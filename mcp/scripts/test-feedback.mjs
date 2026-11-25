import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), contents: `
    import worker from './src/index.ts';
    export default { async fetch(request, env) {
      const points = [];
      const response = await worker.fetch(request, { ...env, MCP_LOG: { writeDataPoint(point) { points.push(point); } } });
      response.headers.set('X-Fixture-Analytics', JSON.stringify(points));
      return response;
    } };
  ` },
  bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
});
const instances = [];
after(async () => { await Promise.all(instances.map((mf) => mf.dispose())); });
const valid = {
  title: 'Search misses an exact title', tool_name: 'search',
  problem: 'An exact title returns no results.', steps_to_reproduce: 'Call search with the title.',
  expected_behavior: 'The topic appears.', actual_behavior: 'No matches.',
  proposed_fix: 'Investigate title matching.',
};
function fixture({ configured = true, limiter = true, limit = 100, status = 201, malformed = false, networkError = false } = {}) {
  const calls = [];
  const analytics = [];
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-05-29', compatibilityFlags: ['nodejs_compat'],
    bindings: configured ? { FEEDBACK_GITHUB_TOKEN: 'test-token-never-real' } : {},
    ratelimits: limiter ? { FEEDBACK_RATE_LIMITER: { namespace_id: '123', simple: { limit, period: 60 } } } : {},
    outboundService: async (request) => {
      calls.push({ url: request.url, method: request.method, headers: Object.fromEntries(request.headers), body: await request.json() });
      if (networkError) throw new Error('private upstream diagnostic');
      return new Response(malformed ? 'not json' : JSON.stringify(status === 201
        ? { number: 123, html_url: 'https://github.com/jdevalk/specification.website/issues/123' }
        : { message: 'private upstream diagnostic' }), { status, headers: { 'Content-Type': 'application/json' } });
    },
  }));
  instances.push(mf);
  async function send(body, modern = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (modern) {
      body.params._meta = { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' };
      headers['MCP-Protocol-Version'] = '2026-07-28';
      headers['Mcp-Method'] = body.method;
      if (body.method === 'tools/call') headers['Mcp-Name'] = body.params.name;
    }
    const response = await mf.dispatchFetch('https://fixture.invalid/mcp', { method: 'POST', headers, body: JSON.stringify(body) });
    analytics.push(...JSON.parse(response.headers.get('X-Fixture-Analytics')));
    return response.json();
  }
  const call = (args = valid, modern = false) => send({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'report_feedback', arguments: args } }, modern);
  return { calls, analytics, send, call };
}

test('both MCP eras advertise a write tool and return a confirmed public issue', async () => {
  const f = fixture();
  for (const modern of [false, true]) {
    const list = await f.send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, modern);
    const tool = list.result.tools.find((t) => t.name === 'report_feedback');
    assert.deepEqual(tool.annotations, { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true });
    const result = (await f.call({ ...valid, problem: '@someone <script>example</script>' }, modern)).result;
    assert.equal(result.isError, undefined, JSON.stringify(result));
    assert.equal(result.structuredContent.issue_number, 123);
    assert.equal(result.structuredContent.status, 'submitted_for_review');
    assert.match(result.content[0].text, /issues\/123/);
  }
  assert.equal(f.calls.length, 2);
  const feedbackLogs = f.analytics.filter((point) => point.blobs[1] === 'report_feedback');
  assert.equal(feedbackLogs.length, 2);
  assert.ok(feedbackLogs.every((point) => point.blobs[2] === ''));
  for (const call of f.calls) {
    assert.equal(call.url, 'https://api.github.com/repos/jdevalk/specification.website/issues');
    assert.equal(call.method, 'POST');
    assert.equal(call.headers.authorization, 'Bearer test-token-never-real');
    assert.match(call.body.body, /Proposed fix \(unverified\)/);
    assert.match(call.body.body, /untrusted input/);
    assert.ok(!call.body.body.includes('@someone'));
    assert.ok(!call.body.body.includes('<script>'));
    assert.deepEqual(call.body.labels, ['mcp-feedback']);
    assert.deepEqual(Object.keys(call.body).sort(), ['body', 'labels', 'title']);
  }
});

test('invalid reports, notifications and batches never create issues', async () => {
  const f = fixture();
  for (const args of [[], 'bad', {}, { ...valid, title: ' ' }, { ...valid, problem: 'a'.repeat(3001) }, { ...valid, proposed_fix: 1 }, { ...valid, repository: 'other/repo' }]) {
    assert.equal((await f.call(args)).result.isError, true);
  }
  const request = { jsonrpc: '2.0', method: 'tools/call', params: { name: 'report_feedback', arguments: valid } };
  assert.equal((await f.send(request)).result.isError, true);
  assert.equal((await f.send({ ...request, id: null })).result.isError, true);
  assert.equal((await f.send([{ ...request, id: 1 }]))[0].result.isError, true);
  assert.equal(f.calls.length, 0);
});

test('missing configuration and rate limits fail closed', async () => {
  const missing = fixture({ configured: false });
  assert.match((await missing.call()).result.content[0].text, /not configured/);
  assert.equal(missing.calls.length, 0);
  const noLimiter = fixture({ limiter: false });
  assert.equal((await noLimiter.call()).result.isError, true);
  assert.equal(noLimiter.calls.length, 0);
  const limited = fixture({ limit: 1 });
  assert.equal((await limited.call()).result.structuredContent.issue_number, 123);
  assert.match((await limited.call()).result.content[0].text, /rate limited/);
  assert.equal(limited.calls.length, 1);
});

test('GitHub failures are private and uncertain submissions are never retried', async () => {
  for (const options of [{ status: 302 }, { status: 401 }, { status: 403 }, { status: 422 }, { status: 500 }, { malformed: true }, { networkError: true }]) {
    const f = fixture(options);
    const result = (await f.call()).result;
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /before retrying/);
    assert.doesNotMatch(result.content[0].text, /private upstream diagnostic|test-token/);
    assert.equal(f.calls.length, 1);
  }
});
