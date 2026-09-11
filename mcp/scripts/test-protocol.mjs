// Assertions for the Worker's two-era protocol surface.
//
// Run with: npm test  (from mcp/)
//
// The Worker answers two eras from one handler, and the members a result must
// carry differ between them — which is how `tools/list` came to serve zero
// tools to every 2026-07-28 client while `initialize` still looked healthy
// (#186). That is not a bug a read-through catches, so the shapes are pinned
// with tables of cases here.
//
// Same idiom as scripts/test-websub.mjs at the repo root: plain node +
// node:assert, no framework, no dependency. Unlike that file this drives the
// real fetch handler rather than pure helpers — the Worker is a plain ESM
// `export default { fetch(request, env) }`, it never touches an execution
// context, and logMcpCall() returns immediately when env.MCP_LOG is absent, so
// an empty env is enough. No wrangler, no network.
//
// The suite pins the wire contract, not what the tools compute: a tools/call
// row asserts the result's shape and that `content` is there, not that `search`
// ranked anything. Those rows are hand-maintained per tool and per return site
// — nothing derives how many return sites a tool has, so a tool that grows one
// needs a row added with it.

import assert from 'node:assert/strict';
import { MODERN_PROTOCOL_VERSIONS, LEGACY_ONLY_METHODS } from '../src/index.ts';

const { default: worker } = await import('../src/index.ts');

// --- runner ---------------------------------------------------------------

let failures = 0;

function check(label, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`  ok    ${label}`);
  } catch {
    failures++;
    console.log(
      `  FAIL  ${label} — got ${JSON.stringify(actual)}, wanted ${JSON.stringify(expected)}`,
    );
  }
}

// --- harness --------------------------------------------------------------

const ENDPOINT = 'https://mcp.test/mcp';
const MODERN_VERSION = '2026-07-28';
const LEGACY_VERSION = '2025-11-25';

const META_PROTOCOL_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CLIENT_CAPABILITIES = 'io.modelcontextprotocol/clientCapabilities';

let nextId = 1;

// The `Mcp-Name` header mirrors a body value for some methods (transports/
// streamable-http). This MUST stay in step with expectedMcpName() in
// src/index.ts, down to the non-string fallback: the Worker expects '' for a
// name that is not a string, so anything else here produces a -32020 header
// mismatch that reads like a Worker bug. Returns null when the method defines
// no name; sending the header when it is not expected is as wrong as omitting
// it when it is.
function mcpNameFor(method, params) {
  switch (method) {
    case 'tools/call':
    case 'prompts/get':
      return typeof params.name === 'string' ? params.name : '';
    case 'resources/read':
      return typeof params.uri === 'string' ? params.uri : '';
    default:
      return null;
  }
}

// POSTs an arbitrary body. `env` defaults to {} — pass a stub binding to
// exercise logMcpCall. Returns the parsed response plus the id that was sent,
// so callers can assert the JSON-RPC id echo.
async function postRaw(body, headers = {}, env = {}) {
  const res = await worker.fetch(
    new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
    env,
  );
  const text = await res.text();
  return {
    status: res.status,
    body: text,
    json: text ? JSON.parse(text) : null,
    sentId: Array.isArray(body) ? undefined : body.id,
  };
}

// A request in the handshake era: no _meta version key, no modern headers.
function callLegacy(method, params = {}, env = {}) {
  return postRaw({ jsonrpc: '2.0', id: nextId++, method, params }, {}, env);
}

// The body and headers of a 2026-07-28 message: the per-request version in
// params._meta, mirrored into MCP-Protocol-Version, plus Mcp-Method and, where
// the method defines one, Mcp-Name. `id` is omitted for a notification.
//
// RequestMetaObject.required is both the version key and clientCapabilities, so
// a request without the latter is one no conforming client would send — an
// empty object is the declaration that the client supports nothing optional.
function modernMessage(method, params, id) {
  const headers = { 'mcp-protocol-version': MODERN_VERSION, 'mcp-method': method };
  const name = mcpNameFor(method, params);
  if (name !== null) headers['mcp-name'] = name;

  const body = {
    jsonrpc: '2.0',
    ...(id === undefined ? {} : { id }),
    method,
    params: {
      ...params,
      _meta: { [META_PROTOCOL_VERSION]: MODERN_VERSION, [META_CLIENT_CAPABILITIES]: {} },
    },
  };
  return { body, headers };
}

// A request in the 2026-07-28 era.
function callModern(method, params = {}, env = {}) {
  const { body, headers } = modernMessage(method, params, nextId++);
  return postRaw(body, headers, env);
}

// A modern request with one header overridden or removed (`null` removes it),
// for the transport-validation rejections.
function callModernWithHeaders(method, params, overrides) {
  const { body, headers } = modernMessage(method, params, nextId++);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) delete headers[k];
    else headers[k] = v;
  }
  return postRaw(body, headers);
}

// Notifications carry no id and must be answered with 202 and no body.
function notify(method, modern = false) {
  if (!modern) return postRaw({ jsonrpc: '2.0', method, params: {} });
  const { body, headers } = modernMessage(method, {}, undefined);
  return postRaw(body, headers);
}

// --- the method table -----------------------------------------------------

// A new protocol method is a row here and nothing else, unless it also mirrors
// a body value into `Mcp-Name` — then mcpNameFor() above needs a case too.
//
// Fields:
//   method       the JSON-RPC method; `params` its params. Both required.
//   label        row name, for a row sharing its method with another.
//   resultField  the member 2026-07-28 requires alongside `resultType`.
//                Asserted present AND non-empty, so emptying the payload fails.
//   cacheable    carries `ttlMs` + `cacheScope`. Rows without it assert those
//                are ABSENT, so a stray hint fails.
//   expect       extra members to assert by value.
//   resultKeys   the exact key list, in order, asserted in BOTH eras. complete()
//                sits inside handleRpc, so a handshake-era client is served the
//                same members a 2026-07-28 one is; this pins that, in both
//                directions. Moving the stamp to the era boundary changes the
//                bytes legacy clients see, and has to edit these lists.
//
// Each row cites the schema definition behind it: schema/2026-07-28/schema.json
// in github.com/modelcontextprotocol/modelcontextprotocol.
const METHOD_CASES = [
  {
    method: 'tools/list',
    params: {},
    // ListToolsResult.required = [cacheScope, resultType, tools, ttlMs]
    resultField: 'tools',
    cacheable: true,
    resultKeys: ['resultType', 'ttlMs', 'cacheScope', 'tools', '_meta'],
  },
  {
    method: 'prompts/list',
    params: {},
    // ListPromptsResult.required = [cacheScope, prompts, resultType, ttlMs]
    resultField: 'prompts',
    cacheable: true,
    resultKeys: ['resultType', 'ttlMs', 'cacheScope', 'prompts', '_meta'],
  },
  {
    method: 'tools/call',
    params: { name: 'get_categories', arguments: {} },
    // CallToolResult.required = [content, resultType] — no cache hints, so the
    // `cacheable` omission above is an assertion, not merely a default.
    resultField: 'content',
    resultKeys: ['resultType', 'content', 'structuredContent', '_meta'],
  },
  {
    method: 'tools/call',
    label: 'tools/call (tool-reported error)',
    // A bad argument is a tool execution error: a result with isError, not a
    // protocol error (SEP-1303), so it still needs resultType. getTopicTool
    // returns the isError result itself.
    params: { name: 'get_topic', arguments: { slug: 'no-such-page-exists' } },
    resultField: 'content',
    expect: { isError: true },
    resultKeys: ['resultType', 'isError', 'content', '_meta'],
  },
  {
    method: 'tools/call',
    label: 'tools/call (thrown tool error)',
    // The other half of SEP-1303: a tool that THROWS is caught in handleRpc and
    // turned into an isError result. Different code path from the row above,
    // and the key order it produces differs too, which `resultKeys` pins.
    params: { name: 'search', arguments: {} },
    resultField: 'content',
    expect: { isError: true },
    resultKeys: ['resultType', 'content', 'isError', '_meta'],
  },
  {
    method: 'prompts/get',
    params: { name: 'audit_url', arguments: { url: 'https://example.com' } },
    // GetPromptResult.required = [messages, resultType]
    resultField: 'messages',
    resultKeys: ['resultType', 'description', 'messages', '_meta'],
  },
];

const labelOf = (c) => c.label ?? c.method;

// Every tool declares an outputSchema, and server/tools obliges a tool that
// does to return `structuredContent`. The obligation is per RETURN SITE, and
// the empty branch is the one that forgets — get_checklist shipped without it.
// Each row is driven by arguments chosen to match nothing, and `empty` names
// the structuredContent members that prove the empty branch is the one that
// ran: without that, a content change would leave the row passing against the
// populated branch instead.
//
// `search` is content-independent — no page can rank for that query. The others
// filter on real enum values, so each pins the count it expects to be zero and
// fails loudly if the spec grows a page that matches.
const EMPTY_RESULT_CASES = [
  { tool: 'search', args: { query: 'zqxjkvwmpb-no-such-topic' }, empty: { count: 0, results: [] } },
  {
    tool: 'get_checklist',
    args: { category: 'privacy', status: 'avoid' },
    empty: { total: 0, categories: [] },
  },
  {
    tool: 'list_topics',
    args: { category: 'privacy', status: 'avoid' },
    empty: { count: 0, topics: [] },
  },
  { tool: 'get_changes', args: { since: '2099-01-01' }, empty: { count: 0, changes: [] } },
];

// What a client of the era that still has them would send. A method with no
// required params needs no entry.
const LEGACY_ONLY_PARAMS = { 'logging/setLevel': { level: 'info' } };

// The modern era's transport rules (transports/streamable-http). Every row is a
// MUST-reject, answered with HTTP 400 and the listed JSON-RPC code:
// -32020 header mismatch, -32022 unsupported protocol version. `headers`
// overrides one header on an otherwise valid request, or removes it with null.
// `method` and `params` default to 'tools/list' with no params; a row sets them
// only when the rule under test needs a method that mirrors a body value into
// `Mcp-Name`.
const MODERN_REJECTIONS = [
  { label: 'missing MCP-Protocol-Version', headers: { 'mcp-protocol-version': null } },
  {
    label: 'MCP-Protocol-Version disagrees with the body',
    headers: { 'mcp-protocol-version': '2025-11-25' },
  },
  { label: 'missing Mcp-Method', headers: { 'mcp-method': null } },
  { label: 'Mcp-Method disagrees with the body', headers: { 'mcp-method': 'prompts/list' } },
  {
    label: 'missing Mcp-Name',
    method: 'tools/call',
    params: { name: 'get_categories', arguments: {} },
    headers: { 'mcp-name': null },
  },
  {
    label: 'Mcp-Name disagrees with the body',
    method: 'tools/call',
    params: { name: 'get_categories', arguments: {} },
    headers: { 'mcp-name': 'search' },
  },
];

// 2026-07-28 requires `resultType` on the base Result, so on every result.
// schema.json types it as a bare string; the allowed values live only in
// schema.ts. Hence this constant rather than JSON-schema validation.
const COMPLETE = 'complete';

// --- assertions -----------------------------------------------------------

console.log('\nmodern era — every result carries the members 2026-07-28 requires');
for (const c of METHOD_CASES) {
  const label = labelOf(c);
  const { json, sentId } = await callModern(c.method, c.params);
  check(`${label} — echoes the request id`, json.id, sentId);
  check(`${label} — resultType`, json.result?.resultType, COMPLETE);
  // Presence is not enough. `'tools' in result` is satisfied by zero tools,
  // which is the exact symptom this suite exists for.
  const value = json.result?.[c.resultField];
  check(
    `${label} — '${c.resultField}' is a non-empty array`,
    Array.isArray(value) && value.length > 0,
    true,
  );
  for (const [k, v] of Object.entries(c.expect ?? {})) {
    check(`${label} — result.${k}`, json.result?.[k], v);
  }
}

console.log('\nboth eras are served the same result members');
// complete() sits inside handleRpc, which both eras share, so a handshake-era
// client is served the same members a 2026-07-28 one is. That is a deliberate
// choice and not a free one — `resultType` and the cache hints do not exist
// before 2026-07-28, and clients on those revisions never asked for them. It is
// legal (2025-11-25's Result carries `additionalProperties: {}`), so what this
// pins is the decision, in both directions: moving the stamp to the era
// boundary changes the bytes legacy clients see, and must edit these lists.
for (const c of METHOD_CASES) {
  const label = labelOf(c);
  for (const [era, call] of [
    ['modern', callModern],
    ['legacy', callLegacy],
  ]) {
    const { json, sentId } = await call(c.method, c.params);
    check(`${era} ${label} — echoes the request id`, json.id, sentId);
    check(`${era} ${label} — result key list`, Object.keys(json.result ?? {}), c.resultKeys);
  }
}

console.log('\nan empty result still carries structuredContent');
for (const c of EMPTY_RESULT_CASES) {
  const { json } = await callModern('tools/call', { name: c.tool, arguments: c.args });
  check(`${c.tool} — exercises a success branch`, json.result?.isError, undefined);
  for (const [k, v] of Object.entries(c.empty)) {
    check(`${c.tool} — structuredContent.${k} (row still matches nothing)`, json.result?.structuredContent?.[k], v);
  }
}

console.log('\nping and logging/setLevel — removed by 2026-07-28');
// Two hand-written copies agreeing with each other catch an edit to one, not an
// edit to both: that shrinks the loop below instead of failing it, and the
// Worker goes back to answering a method the revision deleted. So the list is
// pinned to its literal as well. A third entry is a decision about the era, not
// a rename, and should have to be made twice.
check('the gate names exactly these two', [...LEGACY_ONLY_METHODS].sort(), [
  'logging/setLevel',
  'ping',
]);
for (const method of LEGACY_ONLY_METHODS) {
  const params = LEGACY_ONLY_PARAMS[method] ?? {};
  // Legacy answers both exactly as before: a bare {}, no resultType.
  const legacy = await callLegacy(method, params);
  check(`legacy ${method} — still answered, still bare`, Object.keys(legacy.json.result ?? {}), []);
  // Modern can answer neither way. That revision requires `resultType` on every
  // result (Result.required = ["resultType"], EmptyResult is a $ref to Result)
  // while defining neither method — so an unstamped {} is schema-invalid and a
  // stamped one reports success for a method that does not exist.
  const modern = await callModern(method, params);
  check(`modern ${method} — HTTP 404`, modern.status, 404);
  check(`modern ${method} — -32601`, modern.json.error?.code, -32601);
  check(`modern ${method} — no result`, modern.json.result, undefined);
}

console.log('\ncache hints — only on the result types that declare them');
for (const c of METHOD_CASES) {
  const label = labelOf(c);
  const { json } = await callModern(c.method, c.params);
  if (c.cacheable) {
    check(`${label} — ttlMs is a positive number`, typeof json.result.ttlMs === 'number' && json.result.ttlMs > 0, true);
    check(`${label} — cacheScope`, json.result.cacheScope, 'public');
  } else {
    // Not an omission. The revision defines cache hints only for the result
    // types that declare them, so a hint here would be wrong — publicComplete()
    // creeping onto tools/call would have clients cache a per-request result
    // for an hour.
    check(`${label} — carries no ttlMs`, 'ttlMs' in json.result, false);
    check(`${label} — carries no cacheScope`, 'cacheScope' in json.result, false);
  }
}

console.log('\nserver/discover — what a modern client opens with');
{
  const { status, json } = await callModern('server/discover');
  check('HTTP 200', status, 200);
  // DiscoverResult.required = [cacheScope, capabilities, resultType,
  // supportedVersions, ttlMs]. All five are asserted by value: this branch sets
  // its own cache hints through publicComplete(), and `capabilities` is pinned
  // by key because the point of the method is letting a client skip probing —
  // an empty or partial set is schema-valid and leaves the endpoint
  // functionally dead for anyone who trusts it.
  check('resultType', json.result.resultType, COMPLETE);
  check('supportedVersions', json.result.supportedVersions, [MODERN_VERSION]);
  check('capabilities', Object.keys(json.result.capabilities).sort(), ['prompts', 'tools']);
  check('ttlMs is positive', json.result.ttlMs > 0, true);
  check('cacheScope', json.result.cacheScope, 'public');
}

// The era boundary applies 2026-07-28's facts: complete()/publicComplete()
// inside handleRpc, the LEGACY_ONLY_METHODS gate in handleMcp(). Any edit to
// this array opts a revision into all of them, whether it appends one or
// replaces the one there.
check(
  'a new modern revision has to be checked against the boundary first',
  MODERN_PROTOCOL_VERSIONS,
  [MODERN_VERSION],
);

console.log('\ninitialize — the handshake era, never stamped');
{
  const params = {
    protocolVersion: MODERN_VERSION,
    capabilities: {},
    clientInfo: { name: 'harness', version: '0' },
  };
  // A handshake must never be answered with a revision that has no handshake.
  const negotiated = await callLegacy('initialize', params);
  check('a modern version requested at the handshake is answered with a legacy one', negotiated.json.result.protocolVersion, LEGACY_VERSION);

  // An initialize carrying the modern _meta key is still reachable: the gate
  // sees a version and handleRpc answers the handshake. It is the one branch
  // complete() must never reach, in either era — 2026-07-28 has no
  // InitializeResult, because it has no handshake.
  const plain = await postRaw({ jsonrpc: '2.0', id: 1, method: 'initialize', params });
  const withMeta = await postRaw(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { ...params, _meta: { [META_PROTOCOL_VERSION]: MODERN_VERSION } },
    },
    { 'mcp-protocol-version': MODERN_VERSION, 'mcp-method': 'initialize' },
  );
  check('unstamped result members', Object.keys(plain.json.result), [
    'protocolVersion',
    'serverInfo',
    'capabilities',
    'instructions',
  ]);
  check('_meta on the request changes nothing', JSON.stringify(withMeta.json.result), JSON.stringify(plain.json.result));
}

console.log('\nmodern transport rules (transports/streamable-http)');
// Every one is a MUST. The era gate makes the result-shape fix reachable at
// all, so it has to be more than deletable-with-CI-green.
for (const r of MODERN_REJECTIONS) {
  const { status, json } = await callModernWithHeaders(
    r.method ?? 'tools/list',
    r.params ?? {},
    r.headers,
  );
  check(`rejects: ${r.label}`, [status, json.error?.code, json.result], [400, -32020, undefined]);
}
{
  const { status, json } = await postRaw(
    {
      jsonrpc: '2.0',
      id: nextId++,
      method: 'tools/list',
      params: { _meta: { [META_PROTOCOL_VERSION]: '1999-01-01' } },
    },
    { 'mcp-protocol-version': '1999-01-01', 'mcp-method': 'tools/list' },
  );
  check('rejects: an unsupported protocol version', [status, json.error?.code], [400, -32022]);
  check('names what it does support', json.error.data.supported, [MODERN_VERSION]);
}

// A non-ASCII header value arrives wrapped in `=?base64?…?=` and MUST be
// decoded before comparison (transports/streamable-http#value-encoding).
// Nothing else in the suite reaches decodeHeaderValue().
{
  const encoded = `=?base64?${Buffer.from('get_categories', 'utf8').toString('base64')}?=`;
  const { status, json } = await callModernWithHeaders(
    'tools/call',
    { name: 'get_categories', arguments: {} },
    { 'mcp-name': encoded },
  );
  check('decodes a base64-wrapped Mcp-Name before comparing', [status, json.result?.resultType], [200, COMPLETE]);
}

// `Mcp-Name` mirrors params.name for tools/call and prompts/get, params.uri for
// resources/read. This server does not implement resources/read, so what is
// pinned is that the request reaches the method switch: a harness mirroring the
// wrong member would be rejected at -32020, never reaching this -32601.
{
  const { status, json } = await callModern('resources/read', { uri: 'spec://tools/list' });
  check('resources/read reaches the method switch', [status, json.error?.code], [404, -32601]);
}

// Mirroring expectedMcpName() means mirroring its non-string fallback. The
// Worker expects an empty Mcp-Name for a non-string name, so a harness that
// coerced 42 to "42" would be rejected at -32020, never reaching this -32602.
{
  const { status, json } = await callModern('tools/call', { name: 42, arguments: {} });
  check('a non-string tool name reaches the tool switch', [status, json.error?.code], [200, -32602]);
}

console.log('\nthe era gate reads a SUPPORTED version, not the presence of the key');
// validateModernRequest() returns early for a message with no usable `id` — the
// revision leaves notification header rules undefined — so these requests are
// never validated at all, only their version is read. Gating on presence alone
// would answer them under an era they never asked for.
{
  const { status, json } = await postRaw({
    jsonrpc: '2.0',
    id: null,
    method: 'ping',
    params: { _meta: { [META_PROTOCOL_VERSION]: '1999-01-01' } },
  });
  check('an unsupported version keeps the methods its era still has', [status, Object.keys(json.result ?? {})], [200, []]);
}
{
  const { status, json } = await postRaw({
    jsonrpc: '2.0',
    id: null,
    method: 'no/such/method',
    params: { _meta: { [META_PROTOCOL_VERSION]: '1999-01-01' } },
  });
  check('an unsupported version does not get the modern 404 mapping', [status, json.error.code], [200, -32601]);
}

console.log('\nJSON-RPC errors and the 404 mapping');
{
  const legacy = await callLegacy('no/such/method');
  check('legacy method-not-found stays HTTP 200', [legacy.status, legacy.json.error.code], [200, -32601]);
  const modern = await callModern('no/such/method');
  // The modern era distinguishes "no such method" from a legacy 404.
  check('modern method-not-found is HTTP 404', [modern.status, modern.json.error.code], [404, -32601]);
  check('an error envelope carries no result', modern.json.result, undefined);
}
// The 404 mapping is narrow on purpose: method-not-found maps to a missing
// resource, not every error. An unknown TOOL is a valid tools/call, so it stays
// 200 with -32602.
{
  const { status, json } = await callModern('tools/call', { name: 'no_such_tool', arguments: {} });
  check('an unknown tool is 200 with -32602, not a 404', [status, json.error.code], [200, -32602]);
}

console.log('\nnotifications and batches');
for (const modern of [false, true]) {
  const res = await notify('notifications/initialized', modern);
  check(`a notification is 202 with an empty body (modern=${modern})`, [res.status, res.body], [202, '']);
}
{
  const { status, body } = await postRaw([
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
  ]);
  check('an all-notification batch is 202 with an empty body', [status, body], [202, '']);
}
// Batching was removed in 2025-06-18, so a batch can only be legacy, and
// handleMcp answers it before the era gate. These pin that. Without them, the
// day someone makes batches modern too, batching clients break silently.
{
  const { status, json } = await postRaw([
    { jsonrpc: '2.0', id: 101, method: 'tools/list', params: {} },
    { jsonrpc: '2.0', id: 102, method: 'ping', params: {} },
  ]);
  check('a batch is answered with an array, in order', [status, json.map((r) => r.id)], [200, [101, 102]]);
  // `ping` is answered, not rejected: the gate that removes it belongs to the
  // modern era, and a batch is never in it.
  check('a batch never reaches the era gate', Object.keys(json[1].result), []);
}
{
  const { status, json } = await postRaw([
    {
      jsonrpc: '2.0',
      id: 103,
      method: 'ping',
      params: { _meta: { [META_PROTOCOL_VERSION]: MODERN_VERSION } },
    },
  ]);
  check('nor does a batch carrying the modern _meta key', [status, Object.keys(json[0].result)], [200, []]);
}

console.log('\nusage logging');
// logMcpCall() reads `isError` off the result. A three-line stub binding — not
// a mocking library — is enough to run it. Without one it returns before its
// own try/catch and never executes.
{
  const rows = [];
  const env = { MCP_LOG: { writeDataPoint: (row) => rows.push(row) } };
  const { json } = await callModern(
    'tools/call',
    { name: 'get_topic', arguments: { slug: 'no-such-page-exists' } },
    env,
  );
  check('the response is unchanged', [json.result.resultType, json.result.isError], [COMPLETE, true]);
  check('one row written', rows.length, 1);
  check('method and tool name', rows[0].blobs.slice(0, 2), ['tools/call', 'get_topic']);
  // blob9 is the isError column /admin/stats reads. It comes from the response
  // handleMcp returned, so this fails if a tool-reported error stops being
  // passed through as a result.
  check('the isError column', rows[0].blobs[8], '1');
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll MCP protocol assertions passed.\n');
