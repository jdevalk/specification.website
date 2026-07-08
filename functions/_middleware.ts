/**
 * Cloudflare Pages middleware — content negotiation for spec pages.
 *
 * Spec pages live at /spec/<category>/<slug>/ (HTML) and
 * /spec/<category>/<slug>.md (Markdown source). If a client sends
 * Accept: text/markdown, we serve the Markdown body from the canonical
 * (slash-terminated) URL with Content-Location and Vary: Accept set
 * correctly, so caches handle it right. The same negotiation applies to
 * `/` (→ /llms.txt) and `/checklist/` (→ /checklist.md). Everything else passes through
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

// Retired well-known URI. `/.well-known/ai.txt` was removed on 2026-05-29;
// the convention proved defunct. Rather than a bare 404 we serve a 410 Gone
// that records the retirement in machine-readable form: Deprecation (RFC 9745)
// carries the date it was deprecated, Sunset (RFC 8594) the removal instant,
// and a rel="deprecation" link points to the human explanation. RFC 8594
// explicitly covers this post-sunset 410 case. Worked example for
// /spec/resilience/deprecation-and-sunset/.
const AI_TXT_PATH = "/.well-known/ai.txt";
const AI_TXT_DEPRECATION = "@1780012800"; // 2026-05-29T00:00:00Z
const AI_TXT_SUNSET = "Fri, 29 May 2026 00:00:00 GMT";
const AI_TXT_DOCS =
  "https://specification.website/spec/resilience/deprecation-and-sunset/";

function goneAiTxt(): Response {
  const body =
    "410 Gone\n\n" +
    "/.well-known/ai.txt was retired on 2026-05-29. The convention is defunct;\n" +
    "express AI-crawler preferences via robots.txt and content signals instead.\n" +
    `See ${AI_TXT_DOCS}\n`;
  return new Response(body, {
    status: 410,
    statusText: "Gone",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Deprecation: AI_TXT_DEPRECATION,
      Sunset: AI_TXT_SUNSET,
      Link: `<${AI_TXT_DOCS}>; rel="deprecation"; type="text/html"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// RFC 9530 Digest Fields. Only the two `Active` algorithms from the IANA
// HTTP Digest Fields registry; md5, sha (SHA-1), unixsum, unixcksum, adler
// and crc32c are all registered `Deprecated` and we never emit them.
const DIGEST_ALGOS = {
  "sha-256": "SHA-256",
  "sha-512": "SHA-512",
} as const;
type DigestAlgo = keyof typeof DIGEST_ALGOS;

/**
 * Pick a hashing algorithm from a `Want-Content-Digest` / `Want-Repr-Digest`
 * request field (RFC 9530 §4). It is a Structured Fields Dictionary whose
 * values are Integers 0-10: higher is more preferred, and 0 means "not
 * acceptable". A bare key (no `=n`) is the Boolean true, which we read as the
 * weakest positive preference. Unknown and unparseable members are ignored.
 *
 * Returns `null` when the client has explicitly refused every algorithm we
 * support, in which case we send no digest at all rather than one it told us
 * not to use. Absent any usable preference we default to SHA-256.
 */
function chooseDigestAlgo(want: string | null): DigestAlgo | null {
  if (!want) return "sha-256";

  let best: DigestAlgo | null = null;
  let bestPref = 0;
  const refused = new Set<DigestAlgo>();

  for (const member of want.split(",")) {
    const [rawKey, rawPref] = member.split("=");
    const key = rawKey?.trim().toLowerCase();
    if (!key || !(key in DIGEST_ALGOS)) continue;
    const algo = key as DigestAlgo;
    const pref = rawPref === undefined ? 1 : Number.parseInt(rawPref, 10);
    if (!Number.isFinite(pref)) continue;
    if (pref <= 0) {
      refused.add(algo);
      continue;
    }
    if (pref > bestPref) {
      bestPref = pref;
      best = algo;
    }
  }

  if (best) return best;
  // Nothing was preferred. Fall back to the first supported algorithm the
  // client did not rule out; if it ruled them all out, send none.
  return (
    (Object.keys(DIGEST_ALGOS) as DigestAlgo[]).find((a) => !refused.has(a)) ??
    null
  );
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Attach RFC 9530 integrity fields for a Markdown response.
 *
 * `Content-Digest` covers the message content actually transferred;
 * `Repr-Digest` covers the whole selected representation. They differ when the
 * content is a slice of the representation (a 206 range response) or when the
 * two carry different content codings. On this surface neither happens: Pages
 * ignores `Range` on these assets (returns 200), and Cloudflare does not apply
 * a content coding to `text/markdown`, so the bytes we hash here are the bytes
 * on the wire and the two fields coincide. We emit both because a client that
 * only knows one of them should still get an answer.
 *
 * This is precisely why the digest is scoped to Markdown and never added to
 * HTML: HTML responses are brotli-compressed by the edge *after* this Worker
 * returns, so a digest computed here would describe bytes the client never
 * receives and would fail every validation. `Content-Encoding` is stripped
 * because `arrayBuffer()` has already decoded the body.
 */
async function addDigests(
  headers: Headers,
  body: ArrayBuffer,
  algo: DigestAlgo,
): Promise<void> {
  const hash = await crypto.subtle.digest(DIGEST_ALGOS[algo], body);
  const value = `${algo}=:${toBase64(hash)}:`;
  headers.set("Content-Digest", value);
  headers.set("Repr-Digest", value);
  headers.delete("Content-Encoding");
}

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
  algo: DigestAlgo | null,
): Promise<Response> {
  const upstream = await env.ASSETS.fetch(new URL(mdPath, url).toString());
  // Buffered rather than streamed so we can hash it. These are a few KB.
  const body = await upstream.arrayBuffer();
  const headers = new Headers(upstream.headers);
  // Force the negotiated content type — agents asked for text/markdown
  // and our upstreams (.md files and llms.txt) are Markdown either way.
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  // The digest algorithm is selected from Want-Content-Digest, so that field
  // is part of the cache key too.
  headers.set("Vary", "Accept, Want-Content-Digest");
  headers.set("Content-Location", mdPath);
  if (upstream.ok && algo) await addDigests(headers, body, algo);
  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

// Direct hits on a `.md` URL (no content negotiation involved) get the same
// integrity fields as the negotiated representation.
async function withDigestedMarkdown(
  upstream: Response,
  algo: DigestAlgo | null,
): Promise<Response> {
  const body = await upstream.arrayBuffer();
  const headers = new Headers(upstream.headers);
  headers.append("Vary", "Accept");
  headers.append("Vary", "Want-Content-Digest");
  if (upstream.ok && algo) await addDigests(headers, body, algo);
  return new Response(body, {
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
  // Want-Repr-Digest is accepted as a synonym: both our fields carry the same
  // value on this surface, so honouring either preference is unambiguous.
  const algo = chooseDigestAlgo(
    request.headers.get("want-content-digest") ??
      request.headers.get("want-repr-digest"),
  );

  let response: Response;
  let repr = "passthrough";

  // Retired well-known URI: serve a 410 Gone with Deprecation/Sunset headers.
  if (url.pathname === AI_TXT_PATH) {
    response = goneAiTxt();
    repr = "gone";
    // Site root: agents asking for Markdown get llms.txt (the site index).
  } else if (url.pathname === "/" || url.pathname === "") {
    if (wantsMarkdown) {
      response = await serveAsMarkdown(env, url, "/llms.txt", algo);
      repr = "markdown";
    } else {
      response = withVaryAccept(await next());
      repr = "html";
    }
  } else if (url.pathname === "/checklist" || url.pathname === "/checklist/") {
    // The checklist: agents get the Markdown task-list mirror.
    if (wantsMarkdown) {
      response = await serveAsMarkdown(env, url, "/checklist.md", algo);
      repr = "markdown";
    } else {
      response = withVaryAccept(await next());
      repr = "html";
    }
  } else if (url.pathname.endsWith(".md")) {
    // A direct `.md` fetch. Checked before SPEC_PAGE because that pattern also
    // matches these paths, capturing `<slug>.md` as the slug.
    response = await withDigestedMarkdown(await next(), algo);
    repr = "markdown";
  } else {
    // Individual spec pages: agents get the per-page .md source.
    const match = url.pathname.match(SPEC_PAGE);
    if (match) {
      const [, category, slug] = match;
      const mdPath = `/spec/${category}/${slug}.md`;
      if (wantsMarkdown) {
        response = await serveAsMarkdown(env, url, mdPath, algo);
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
