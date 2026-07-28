// The Website Specification — MCP server (Cloudflare Worker).
//
// Streamable HTTP transport (the modern MCP transport): the client POSTs
// JSON-RPC 2.0 messages to /mcp and gets back JSON-RPC responses. No
// sessions, no server-initiated messages, no SSE — this server is stateless
// and read-only.
//
// DUAL-ERA (spec: 2026-07-28 basic/versioning#backward-compatibility).
// Revision 2026-07-28 removed the `initialize` handshake: every request now
// declares its own protocol version in `params._meta`, mirrored into the
// MCP-Protocol-Version header. Earlier revisions ("legacy") negotiate once
// via `initialize`. This server answers both on the same endpoint, and picks
// which by how the client opens:
//
//   * a request carrying the modern _meta version key  → modern, stateless
//   * an `initialize` request                          → legacy semantics
//
// Being stateless already, the modern shape costs us nothing structurally —
// the work is per-request validation and the mandatory server/discover RPC.
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

const PROTOCOL_VERSION = '2026-07-28';

// Versions valid for the MODERN per-request mechanism. Only 2026-07-28 goes
// here, and deliberately so: the `_meta` protocol-version key does not exist
// in earlier revisions, so a request carrying it can only mean 2026-07-28.
// Advertising a legacy version through server/discover would invite a client
// to send it as per-request metadata, which is not a thing that revision
// defines. Legacy versions stay reachable through `initialize` below.
const MODERN_PROTOCOL_VERSIONS = [PROTOCOL_VERSION];

// Handshake-based revisions this server still answers via `initialize`. The
// feature surface (tool annotations, structured output / outputSchema) is
// identical across them for this server.
const LEGACY_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const LEGACY_DEFAULT_VERSION = LEGACY_PROTOCOL_VERSIONS[0];

const SUPPORTED_PROTOCOL_VERSIONS = [...MODERN_PROTOCOL_VERSIONS, ...LEGACY_PROTOCOL_VERSIONS];

// Our own support window for the handshake, announced on the wire.
//
// Note what this is NOT: MCP does not deprecate the `initialize` handshake.
// 2025-11-25 is a Final revision, and the deprecated-features registry
// (specification/2026-07-28/deprecated) does not list it. Revisions do not
// sunset — how long a given server keeps honouring one is that server's
// policy. So these dates are ours, not the specification's, and Deprecation
// (RFC 9745) + Sunset (RFC 8594) are the right shape for exactly that: a
// commitment this endpoint is making about its own future behaviour.
//
// Worked example for /spec/resilience/deprecation-and-sunset/.
const HANDSHAKE_DEPRECATION = '@1785196800'; // 2026-07-28T00:00:00Z
const HANDSHAKE_SUNSET = 'Wed, 28 Jul 2027 00:00:00 GMT';
const HANDSHAKE_DOCS =
  'https://specification.website/spec/agent-readiness/mcp-and-tool-discovery/';
const HANDSHAKE_HEADERS = {
  Deprecation: HANDSHAKE_DEPRECATION,
  Sunset: HANDSHAKE_SUNSET,
  Link: `<${HANDSHAKE_DOCS}>; rel="deprecation"; type="text/html"`,
};

// Reserved `_meta` keys from the 2026-07-28 revision (basic/index#meta).
const META_PROTOCOL_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';

// Protocol-defined JSON-RPC error codes (basic/index#error-codes).
const ERR_HEADER_MISMATCH = -32020;
const ERR_UNSUPPORTED_PROTOCOL_VERSION = -32022;
const SERVER_INFO = {
  name: 'specification-website',
  version: '0.2.0',
  title: 'The Website Specification',
  description:
    'Read-only MCP server exposing The Website Specification — search, list, fetch, and checklist tools over every spec page, plus an audit_url prompt.',
  websiteUrl: 'https://specification.website',
  icons: [
    {
      src: 'https://specification.website/icon-512.png',
      mimeType: 'image/png',
      sizes: ['512x512'],
    },
  ],
};

// Natural-language guidance for the calling model. Returned by both eras —
// `initialize` (legacy) and `server/discover` (modern) — so keep it one string.
const SERVER_INSTRUCTIONS =
  'Read-only MCP server for The Website Specification at https://specification.website. ' +
  'Use `search` for free-text queries, `list_topics` for filtered lists, `get_topic` to fetch ' +
  'a single page as Markdown, and `get_checklist` for audit-style output. ' +
  'Spec items have one of four statuses: `required` (platform contract breaks without it), ' +
  '`recommended` (modern site should do it), `optional` (context-dependent), `avoid` (outdated or harmful). ' +
  'The `list_topics` and `get_checklist` tools return ALL statuses by default — pass `status` to filter. ' +
  'The `audit_url` prompt is the exception: with no `focus`, it defaults to `required`-only.';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Mcp-Method, Mcp-Name',
  // Deprecation/Sunset/Link are exposed so a browser-based client can
  // actually read them — without this they are invisible to fetch().
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Deprecation, Sunset, Link',
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
    // Legacy era only. An `initialize` request selects handshake semantics
    // (spec: 2026-07-28 basic/versioning), so it can never yield the modern
    // revision — echo the requested legacy version, else the newest legacy one.
    case 'initialize': {
      const requested = String((params as Record<string, unknown>).protocolVersion || '');
      return ok(id, {
        protocolVersion: LEGACY_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : LEGACY_DEFAULT_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: {
          tools: { listChanged: false },
          prompts: { listChanged: false },
          logging: {},
        },
        instructions: SERVER_INSTRUCTIONS,
      });
    }

    // Modern era. Servers MUST implement server/discover: it returns the
    // supported versions, capabilities and identity in one request, so a
    // client can skip probing tools/list + prompts/list separately.
    case 'server/discover':
      return ok(id, {
        resultType: 'complete',
        supportedVersions: MODERN_PROTOCOL_VERSIONS,
        // No `logging` here. Logging is Deprecated as of 2026-07-28
        // (specification/2026-07-28/deprecated, SEP-2577), and new
        // implementations SHOULD NOT adopt it — advertising it in a discovery
        // call written after that date would be adopting it. The legacy
        // `initialize` response below still declares it, because clients
        // written against those revisions may already expect it there.
        capabilities: {
          tools: {},
          prompts: {},
        },
        _meta: {
          [META_SERVER_INFO]: SERVER_INFO,
        },
        instructions: SERVER_INSTRUCTIONS,
        // The manifest is baked in at build time and only changes on deploy,
        // so a discovery result stays valid for as long as a client cares to
        // hold it. Public: there is nothing per-client in this response.
        ttlMs: 3_600_000,
        cacheScope: 'public',
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
        // Per SEP-1303 (2025-11-25): execution/validation failures inside a
        // known tool are tool results with isError, not protocol errors, so
        // the calling model can read the message and self-correct.
        return ok(id, {
          content: [{ type: 'text', text: `Tool error: ${(e as Error).message}` }],
          isError: true,
        });
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
  <li><code>get_changes({ since?, type?, limit? })</code> — spec changelog, resolved to current topics</li>
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

// --- Modern-era transport validation (2026-07-28) -------------------------

// Header values that cannot be represented in plain ASCII arrive wrapped in a
// sentinel: `=?base64?<base64 of the UTF-8 bytes>?=`. Servers MUST decode
// before comparing to the body value (transports/streamable-http#value-encoding).
function decodeHeaderValue(raw: string): string {
  if (!raw.startsWith('=?base64?') || !raw.endsWith('?=')) return raw;
  const encoded = raw.slice('=?base64?'.length, -'?='.length);
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return raw; // undecodable → will fail the comparison, which is correct
  }
}

// The `Mcp-Name` header mirrors params.name (tools/call, prompts/get) or
// params.uri (resources/read). Returns null when the method does not require it.
function expectedMcpName(method: string, params: Record<string, unknown>): string | null {
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

// A request is "modern" iff it carries the per-request protocol-version key.
// That key does not exist before 2026-07-28, so its presence is unambiguous.
function modernVersionOf(req: RpcRequest): string | null {
  const params = (req.params ?? {}) as Record<string, unknown>;
  const meta = params._meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') return null;
  const version = meta[META_PROTOCOL_VERSION];
  return typeof version === 'string' ? version : null;
}

// Returns a JSON-RPC error response when the request must be rejected, or
// null when it may proceed. Every rejection here is a MUST in
// transports/streamable-http; all of them are HTTP 400.
function validateModernRequest(
  httpReq: Request,
  req: RpcRequest,
  bodyVersion: string,
): RpcResponse | null {
  const { id, method } = req;
  const params = (req.params ?? {}) as Record<string, unknown>;

  // The revision explicitly leaves header requirements for notification POSTs
  // undefined, so validating them would invent a rule and reject conforming
  // clients. A JSON-RPC notification is a message with no `id`.
  if (id === undefined || id === null) return null;

  const reject = (code: number, message: string, data?: unknown) =>
    err(id, code, message, data);

  // The header mirrors the body value; a mismatch means two components in the
  // path disagree about what is being asked, which is a security problem.
  const headerVersion = httpReq.headers.get('mcp-protocol-version');
  if (!headerVersion) {
    return reject(ERR_HEADER_MISMATCH, 'Missing required header: MCP-Protocol-Version');
  }
  if (headerVersion !== bodyVersion) {
    return reject(
      ERR_HEADER_MISMATCH,
      `Header mismatch: MCP-Protocol-Version header value '${headerVersion}' does not match body value '${bodyVersion}'`,
    );
  }

  if (!MODERN_PROTOCOL_VERSIONS.includes(bodyVersion)) {
    return reject(
      ERR_UNSUPPORTED_PROTOCOL_VERSION,
      'Unsupported protocol version',
      { supported: MODERN_PROTOCOL_VERSIONS, requested: bodyVersion },
    );
  }

  const headerMethod = httpReq.headers.get('mcp-method');
  if (!headerMethod) {
    return reject(ERR_HEADER_MISMATCH, 'Missing required header: Mcp-Method');
  }
  if (headerMethod !== method) {
    return reject(
      ERR_HEADER_MISMATCH,
      `Header mismatch: Mcp-Method header value '${headerMethod}' does not match body value '${method}'`,
    );
  }

  const wantName = expectedMcpName(method, params);
  if (wantName !== null) {
    const rawName = httpReq.headers.get('mcp-name');
    if (rawName === null) {
      return reject(ERR_HEADER_MISMATCH, 'Missing required header: Mcp-Name');
    }
    const gotName = decodeHeaderValue(rawName);
    if (gotName !== wantName) {
      return reject(
        ERR_HEADER_MISMATCH,
        `Header mismatch: Mcp-Name header value '${gotName}' does not match body value '${wantName}'`,
      );
    }
  }

  return null;
}

async function handleMcp(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    // 2026-07-28 removed the GET stream and the DELETE session teardown; both
    // are 405 now. Mcp-Session-Id and Last-Event-ID are ignored wherever they
    // appear — this server never had sessions to resume.
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

  // Era selection (spec: basic/versioning). A request carrying the modern
  // per-request version key is served under 2026-07-28 and validated
  // accordingly; anything else falls through to the legacy path untouched,
  // so existing `initialize`-based clients keep working exactly as before.
  const bodyVersion = modernVersionOf(req);
  if (bodyVersion !== null) {
    const rejection = validateModernRequest(request, req, bodyVersion);
    if (rejection) {
      logMcpCall(env, request, req, rejection, 'remote');
      return new Response(JSON.stringify(rejection), { status: 400, headers: JSON_HEADERS });
    }
  }

  const response = handleRpc(req);
  logMcpCall(env, request, req, response, 'remote');
  if (response === null) {
    // Streamable HTTP requires accepted notifications to return 202 with no body.
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }
  // Modern era distinguishes "no such method" from a legacy 404 by pairing
  // HTTP 404 with a JSON-RPC -32601 body.
  const status =
    bodyVersion !== null && 'error' in response && response.error.code === -32601 ? 404 : 200;

  // A legacy handshake gets our support window on the wire. Scoped to the
  // `initialize` response rather than every response from /mcp: the endpoint
  // is not going away, only our willingness to answer the handshake on it.
  const headers =
    req.method === 'initialize' ? { ...JSON_HEADERS, ...HANDSHAKE_HEADERS } : JSON_HEADERS;
  return new Response(JSON.stringify(response), { status, headers });
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

    // Modern era (2026-07-28) carries clientInfo in `_meta` on EVERY request,
    // not once at `initialize`. Read it first so the client-mix column keeps
    // filling as clients migrate; the `initialize` branch below still covers
    // legacy clients, for which this key is absent.
    const meta = (params as Record<string, unknown>)._meta as Record<string, unknown> | undefined;
    if (meta && typeof meta === 'object') {
      const modernClient = (meta['io.modelcontextprotocol/clientInfo'] || {}) as {
        name?: unknown;
        version?: unknown;
      };
      clientName = String(modernClient.name || '');
      clientVersion = String(modernClient.version || '');
    }

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
