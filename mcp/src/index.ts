// The Website Specification — MCP server (Cloudflare Worker).
//
// Streamable HTTP transport (the modern MCP transport): the client POSTs
// JSON-RPC 2.0 messages to /mcp and gets back JSON-RPC responses. No
// sessions, no server-initiated messages, no SSE — this server is stateless
// and read-only. Advertises the 2025-06-18 protocol revision (tool
// annotations + structured output / outputSchema).
//
// All spec content is bundled at build time via scripts/build-data.mjs.
// The Worker holds the manifest in module scope, so it is parsed once per
// isolate and reused across requests.

import data from './data.json' with { type: 'json' };
import {
  TOOLS,
  PROMPTS,
  searchTool,
  listTopicsTool,
  getTopicTool,
  getChecklistTool,
  getCategoriesTool,
  getChangesTool,
  buildAuditPrompt,
} from './tools';
import { handleA2aRpc, AGENT_CARD } from './a2a';
import type { Manifest, RpcRequest, RpcResponse } from './types';

interface Env {
  MCP_LOG?: AnalyticsEngineDataset;
}

const manifest = data as unknown as Manifest;

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = {
  name: 'specification-website',
  version: '0.1.0',
  title: 'The Website Specification',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  ...CORS_HEADERS,
};

// Glama MCP connector ownership claim, served at /.well-known/glama.json so
// glama.ai can verify the maintainer of this connector. Mirrored as a static
// file on the Pages site; both origins are served because Glama checks the
// connector's own origin (mcp.specification.website).
const GLAMA_CLAIM = {
  $schema: 'https://glama.ai/mcp/schemas/connector.json',
  maintainers: [{ email: 'joost@altha.nl' }],
};

function ok(id: string | number | null | undefined, result: unknown): RpcResponse {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function err(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown,
): RpcResponse {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, data } };
}

function handleRpc(req: RpcRequest): RpcResponse | null {
  const { id, method, params = {} } = req;

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: {
          tools: { listChanged: false },
          prompts: { listChanged: false },
          logging: {},
        },
        instructions:
          'Read-only MCP server for The Website Specification at https://specification.website. ' +
          'Use `search` for free-text queries, `list_topics` for filtered lists, `get_topic` to fetch ' +
          'a single page as Markdown, and `get_checklist` for audit-style output. ' +
          'Spec items have one of four statuses: `required` (platform contract breaks without it), ' +
          '`recommended` (modern site should do it), `optional` (context-dependent), `avoid` (outdated or harmful). ' +
          'The `list_topics` and `get_checklist` tools return ALL statuses by default — pass `status` to filter. ' +
          'The `audit_url` prompt is the exception: with no `focus`, it defaults to `required`-only.',
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null; // notifications get no reply

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, { tools: TOOLS });

    case 'tools/call': {
      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) ?? {};
      try {
        switch (name) {
          case 'search':
            return ok(id, searchTool(manifest, args as { query: string; limit?: number }));
          case 'list_topics':
            return ok(id, listTopicsTool(manifest, args as any));
          case 'get_topic':
            return ok(id, getTopicTool(manifest, args as { slug: string }));
          case 'get_checklist':
            return ok(id, getChecklistTool(manifest, args as any));
          case 'get_categories':
            return ok(id, getCategoriesTool(manifest));
          case 'get_changes':
            return ok(id, getChangesTool(manifest, args as { since?: string; type?: string; limit?: number }));
          default:
            return err(id, -32602, `Unknown tool: ${name}`);
        }
      } catch (e) {
        return err(id, -32603, `Tool error: ${(e as Error).message}`);
      }
    }

    case 'prompts/list':
      return ok(id, { prompts: PROMPTS });

    case 'prompts/get': {
      const name = params.name as string;
      const args = (params.arguments as Record<string, string>) ?? {};
      if (name !== 'audit_url') return err(id, -32602, `Unknown prompt: ${name}`);
      const url = args.url;
      if (!url) return err(id, -32602, 'Missing required argument: url');
      return ok(id, buildAuditPrompt(manifest, url, args.focus));
    }

    case 'logging/setLevel':
      return ok(id, {});

    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

function htmlLanding(): Response {
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>specification.website — MCP server</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="https://mcp.specification.website/">
<style>
  body { font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #1a1a20; background: #fff; max-width: 48rem; margin: 4rem auto; padding: 0 1.5rem; }
  h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
  h2 { font-size: 1.125rem; margin: 2rem 0 0.5rem; }
  code, pre { font-family: ui-monospace, Menlo, Consolas, monospace; }
  pre { background: #f7f7f8; border: 1px solid #d8d8df; border-radius: .375rem;
    padding: .75rem 1rem; overflow-x: auto; }
  code { background: #eeeef1; padding: .1em .35em; border-radius: .25rem; font-size: .9em; }
  a { color: #15803d; }
</style>
</head>
<body>
<h1>The Website Specification — MCP server</h1>
<p>Streamable HTTP MCP endpoint at <code>POST /mcp</code>. Stateless, read-only, no authentication.</p>

<h2>Connect (Claude Desktop, MCP-aware clients)</h2>
<pre>{
  "mcpServers": {
    "specification-website": {
      "transport": "http",
      "url": "https://mcp.specification.website/mcp"
    }
  }
}</pre>

<h2>Tools</h2>
<ul>
  <li><code>search(query, limit?)</code> — full-text across every spec page</li>
  <li><code>list_topics({ category?, status?, limit? })</code> — filtered index</li>
  <li><code>get_topic({ slug })</code> — full Markdown for one page</li>
  <li><code>get_checklist({ category?, status? })</code> — flat checklist</li>
  <li><code>get_categories()</code> — taxonomy with counts</li>
</ul>

<h2>Prompts</h2>
<ul>
  <li><code>audit_url(url, focus?)</code> — generates an audit plan for a target URL</li>
</ul>

<h2>Also speaks A2A</h2>
<p>Agent-to-Agent JSON-RPC endpoint at <code>POST /a2a/v1</code>; agent card at <a href="/.well-known/agent-card.json"><code>/.well-known/agent-card.json</code></a>. <code>message/send</code> wraps the same search; other A2A methods return method-not-found.</p>

<h2>Discovery</h2>
<ul>
  <li>MCP server card: <a href="https://specification.website/.well-known/mcp/server-card.json">specification.website/.well-known/mcp/server-card.json</a></li>
  <li>A2A agent card: <a href="https://specification.website/.well-known/agent-card.json">specification.website/.well-known/agent-card.json</a></li>
  <li>Spec pages: <a href="https://specification.website/spec/agent-readiness/mcp-and-tool-discovery/">mcp-and-tool-discovery</a>, <a href="https://specification.website/spec/agent-readiness/a2a-agent-cards/">a2a-agent-cards</a></li>
  <li>Source: <a href="https://github.com/jdevalk/specification.website">github.com/jdevalk/specification.website</a></li>
</ul>
</body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
  });
}

function metadata(): Response {
  return new Response(
    JSON.stringify(
      {
        name: SERVER_INFO.name,
        title: SERVER_INFO.title,
        version: SERVER_INFO.version,
        protocolVersion: PROTOCOL_VERSION,
        transport: 'http',
        endpoint: 'https://mcp.specification.website/mcp',
        capabilities: { tools: true, prompts: true },
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
        prompts: PROMPTS.map((p) => ({ name: p.name, description: p.description })),
        manifest: {
          generatedAt: manifest.generatedAt,
          pages: manifest.pages.length,
          categories: manifest.categories.length,
        },
        sources: {
          site: 'https://specification.website',
          repo: 'https://github.com/jdevalk/specification.website',
          spec: 'https://specification.website/spec/agent-readiness/mcp-and-tool-discovery/',
        },
      },
      null,
      2,
    ),
    { headers: JSON_HEADERS },
  );
}

function agentCardResponse(): Response {
  return new Response(JSON.stringify(AGENT_CARD, null, 2), { headers: JSON_HEADERS });
}

async function handleA2a(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify(err(null, -32600, 'A2A endpoint requires POST with a JSON-RPC body.')),
      { status: 405, headers: JSON_HEADERS },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify(err(null, -32700, 'Parse error: invalid JSON')), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }
  if (Array.isArray(body)) {
    const responses = body
      .map((r) => {
        const req = r as RpcRequest;
        const resp = handleA2aRpc(manifest, req);
        logMcpCall(env, request, req, resp, 'a2a');
        return resp;
      })
      .filter((r): r is RpcResponse => r !== null);
    return new Response(JSON.stringify(responses), { headers: JSON_HEADERS });
  }
  const req = body as RpcRequest;
  const response = handleA2aRpc(manifest, req);
  logMcpCall(env, request, req, response, 'a2a');
  if (response === null) {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return new Response(JSON.stringify(response), { headers: JSON_HEADERS });
}

async function handleMcp(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify(err(null, -32600, 'MCP endpoint requires POST with a JSON-RPC body.')),
      { status: 405, headers: JSON_HEADERS },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify(err(null, -32700, 'Parse error: invalid JSON')), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  // Batch or single
  if (Array.isArray(body)) {
    const responses = body
      .map((r) => {
        const req = r as RpcRequest;
        const resp = handleRpc(req);
        logMcpCall(env, request, req, resp, 'remote');
        return resp;
      })
      .filter((r): r is RpcResponse => r !== null);
    if (responses.length === 0) {
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }
    return new Response(JSON.stringify(responses), { headers: JSON_HEADERS });
  }
  const req = body as RpcRequest;
  const response = handleRpc(req);
  logMcpCall(env, request, req, response, 'remote');
  if (response === null) {
    // Streamable HTTP requires accepted notifications to return 202 with no body.
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }
  return new Response(JSON.stringify(response), { headers: JSON_HEADERS });
}

// --- Usage logging --------------------------------------------------------

// Writes one data point per MCP / A2A call to the MCP_LOG Analytics Engine
// dataset, which the Pages /admin/stats dashboard queries. Never throws.
//
// The stateless server has no sessions, so client identity is asymmetric:
// only `initialize` carries clientInfo (name/version); `tools/call` does not.
// Both shapes share one dataset — `initialize` rows give the client mix,
// `tools/call` rows give the tool mix and the actual query arguments.
function logMcpCall(
  env: Env,
  httpReq: Request,
  message: RpcRequest | null | undefined,
  response: RpcResponse | null,
  surface: 'remote' | 'a2a',
): void {
  const dataset = env.MCP_LOG;
  if (!dataset) return; // binding not configured (local dev) — silently skip
  try {
    const method = (message && message.method) || '';
    if (!method || method === 'ping') return; // ping is keepalive noise
    if (method.startsWith('notifications/')) return; // pure notifications

    const params = (message && message.params) || {};

    // Channel attribution: an install URL like /mcp?ref=hackernews carries
    // its `ref` on every request, so launch-channel usage is distinguishable.
    let ref = '';
    try {
      ref = (new URL(httpReq.url).searchParams.get('ref') || '').slice(0, 60);
    } catch {
      ref = '';
    }

    let toolName = '';
    let args = '';
    let clientName = '';
    let clientVersion = '';
    let isError = '';

    if (method === 'tools/call') {
      toolName = String((params as Record<string, unknown>).name || '');
      try {
        args = JSON.stringify((params as Record<string, unknown>).arguments || {}).slice(0, 500);
      } catch {
        args = '';
      }
      if (response && 'error' in response) {
        isError = '1';
      } else if (
        response &&
        'result' in response &&
        response.result &&
        typeof response.result === 'object' &&
        (response.result as { isError?: boolean }).isError
      ) {
        isError = '1';
      }
    } else if (method === 'initialize') {
      const clientInfo = ((params as Record<string, unknown>).clientInfo || {}) as {
        name?: unknown;
        version?: unknown;
      };
      clientName = String(clientInfo.name || '');
      clientVersion = String(clientInfo.version || '');
    } else if (method === 'message/send') {
      // A2A: surface the user text as args so the dashboard shows what
      // was asked, mirroring tools/call.
      try {
        args = JSON.stringify(params).slice(0, 500);
      } catch {
        args = '';
      }
    }

    const protocol =
      httpReq.headers.get('mcp-protocol-version') ||
      (method === 'initialize'
        ? String((params as Record<string, unknown>).protocolVersion || '')
        : '');
    const identity = method === 'tools/call' && toolName ? toolName : method;
    const cf = (httpReq as Request & { cf?: IncomingRequestCfProperties }).cf;

    dataset.writeDataPoint({
      blobs: [
        method, // blob1
        toolName, // blob2
        args, // blob3
        clientName, // blob4
        clientVersion, // blob5
        protocol, // blob6
        (httpReq.headers.get('user-agent') || '').slice(0, 300), // blob7
        cf?.country || '', // blob8
        isError, // blob9
        surface, // blob10 — 'remote' (MCP) or 'a2a'
        ref, // blob11 — channel ref from /mcp?ref=… install URLs
      ],
      indexes: [identity],
    });
  } catch {
    // Never break a request because logging failed.
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    switch (url.pathname) {
      case '/':
        return htmlLanding();
      case '/mcp':
      case '/mcp/':
        return handleMcp(request, env);
      case '/a2a/v1':
      case '/a2a/v1/':
        return handleA2a(request, env);
      case '/.well-known/mcp/server-card.json':
        return metadata();
      case '/.well-known/agent-card.json':
        return agentCardResponse();
      case '/.well-known/glama.json':
        return new Response(JSON.stringify(GLAMA_CLAIM, null, 2), { headers: JSON_HEADERS });
      case '/health':
        return new Response('ok', { headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS } });
      default:
        return new Response('Not found.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS },
        });
    }
  },
} satisfies ExportedHandler<Env>;
