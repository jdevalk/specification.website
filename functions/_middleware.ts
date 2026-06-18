/**
 * Cloudflare Pages middleware — content negotiation for spec pages.
 *
 * Spec pages live at /spec/<category>/<slug>/ (HTML) and
 * /spec/<category>/<slug>.md (Markdown source). If a client sends
 * Accept: text/markdown, we serve the Markdown body from the canonical
 * (slash-terminated) URL with Content-Location and Vary: Accept set
 * correctly, so caches handle it right. Everything else passes through
 * to the static asset pipeline unchanged, with Vary: Accept appended to
 * spec-page HTML responses so caches don't conflate the two
 * representations.
 *
 * Also calls `logBot()` first thing, so every page and well-known request
 * that looks like a crawler / agent gets recorded in the AGENT_LOG
 * Analytics Engine dataset (read by /admin/stats).
 *
 * Every response carries a `Server-Timing` header reporting the time spent
 * in this middleware (`edge`) and which representation was negotiated — a
 * worked example of the /spec/performance/server-timing/ page. Same-origin,
 * so it is readable from PerformanceServerTiming without Timing-Allow-Origin.
 */

import { logBot } from "./_shared/bot-detect";

type Env = {
  ASSETS: Fetcher;
  AGENT_LOG?: AnalyticsEngineDataset;
};

const SPEC_PAGE = /^\/spec\/([^/]+)\/([^/]+)\/?$/;

function prefersMarkdown(accept: string): boolean {
  // We treat the request as "wants markdown" only when text/markdown is
  // explicitly named. Browsers default to text/html and don't hit this
  // path. Agents that opt in get it.
  return /text\/markdown/i.test(accept);
}

async function serveAsMarkdown(
  env: Env,
  url: URL,
  mdPath: string,
): Promise<Response> {
  const upstream = await env.ASSETS.fetch(new URL(mdPath, url).toString());
  const headers = new Headers(upstream.headers);
  // Force the negotiated content type — agents asked for text/markdown
  // and our upstreams (.md files and llms.txt) are Markdown either way.
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept");
  headers.set("Content-Location", mdPath);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function withVaryAccept(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.append("Vary", "Accept");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Append a Server-Timing metric reporting edge processing time. `desc`
// records which representation we served (html / markdown / passthrough).
// We expose only the duration and a coarse label — no infrastructure
// internals — so this stays safe on public responses.
function withServerTiming(
  response: Response,
  durMs: number,
  repr: string,
): Response {
  const headers = new Headers(response.headers);
  headers.append("Server-Timing", `edge;desc="${repr}";dur=${durMs}`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Captured up front so the Server-Timing dur reflects everything this
  // middleware does, including the downstream asset fetch.
  const started = Date.now();

  // Bot/agent logging must run before any early return below, otherwise
  // crawlers (which fetch HTML, not markdown) would never be logged.
  logBot(context);

  const { request, next, env } = context;
  const url = new URL(request.url);
  const accept = request.headers.get("accept") ?? "";
  const wantsMarkdown = prefersMarkdown(accept);

  let response: Response;
  let repr = "passthrough";

  // Site root: agents asking for Markdown get llms.txt (the site index).
  if (url.pathname === "/" || url.pathname === "") {
    if (wantsMarkdown) {
      response = await serveAsMarkdown(env, url, "/llms.txt");
      repr = "markdown";
    } else {
      response = withVaryAccept(await next());
      repr = "html";
    }
  } else {
    // Individual spec pages: agents get the per-page .md source.
    const match = url.pathname.match(SPEC_PAGE);
    if (match) {
      const [, category, slug] = match;
      const mdPath = `/spec/${category}/${slug}.md`;
      if (wantsMarkdown) {
        response = await serveAsMarkdown(env, url, mdPath);
        repr = "markdown";
      } else {
        response = withVaryAccept(await next());
        repr = "html";
      }
    } else {
      // Everything else: pass through.
      response = await next();
    }
  }

  return withServerTiming(response, Date.now() - started, repr);
};
