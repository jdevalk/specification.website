// Browser-side WebMCP registration, in two pieces.
//
// 1. WEBMCP_GUARD — a tiny inline script BaseLayout emits on every page. It
//    feature-detects `modelContext` and only then injects /webmcp.js. Browsers
//    with no WebMCP implementation (i.e. nearly all of them today) fetch
//    nothing at all. The guard's *text* is a constant so its CSP sha256 never
//    moves; the per-build SRI of /webmcp.js rides along in a data- attribute,
//    which CSP does not hash. check-integrity.mjs asserts the two agree.
//
// 2. webmcpBody() — the tool definitions. Tool metadata (name, title,
//    description, inputSchema, annotations) is declared as typed data in TOOLS
//    and checked at build time against the WebMCP spec via the `webmcp-types`
//    package, so a spec change (like destructiveHint -> consequentialHint)
//    fails the build instead of shipping silently. The helpers and execute
//    implementations are plain functions emitted verbatim with
//    Function.toString(): write them exactly as the shipped JS should read
//    (single-level escaping) and never close over build-time values —
//    everything they need is emitted into the IIFE scope (MANIFEST_URL).
//
// The spec manifest is served separately at /webmcp-manifest.json and fetched
// on first use by the tools that need it; the category/status enums stay
// inline in the input schemas, because inputSchema has to be complete at
// registration time.
//
// webmcpBody() is memoised so the bytes BaseLayout hashes are the bytes the
// endpoint serves.
import { getCollection } from "astro:content";
import { categories, site } from "~/lib/site";
import { sriOf } from "~/lib/integrity";
import type { WebMCP } from "webmcp-types";

/** Path of the lazily-fetched spec manifest. */
export const WEBMCP_MANIFEST_PATH = "/webmcp-manifest.json";

// Kept on one line and byte-stable: BaseLayout renders it with set:html, so
// these exact bytes are what CSP hashes. Changing this string means recomputing
// the sha256 in public/_headers — `npm run build` fails loudly if you forget.
// Capture currentScript immediately; load only after deferred security scripts
// have registered the default Trusted Types policy and search has initialised.
export const WEBMCP_GUARD =
  '(function(){var d=document.currentScript.dataset;if(!document.modelContext&&!navigator.modelContext)return;function load(){var s=document.createElement("script");s.src=d.webmcpSrc;s.integrity=d.webmcpSri;s.crossOrigin="anonymous";document.head.appendChild(s)}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load()})();';

// A browser tool: spec-typed metadata plus the implementation, which is
// emitted verbatim into /webmcp.js. `execute` must be a plain `function`
// expression — never an arrow function or method — so Function.toString()
// yields portable source. The metadata is typechecked against the spec:
// a renamed or removed annotation is a build error, not a silent ship.
type BrowserTool = Omit<WebMCP.ModelContextTool, "execute" | "inputSchema"> & {
  inputSchema: Record<string, unknown>;
  execute: (input: any, options?: { signal?: AbortSignal }) => unknown;
};

// Emitted into the IIFE scope; the helpers below reference it by name.
// (Declared for the typechecker; the IIFE defines the real var.)
declare const MANIFEST_URL: string;

const CATEGORY_SLUGS: string[] = categories.map((c) => c.slug);
const STATUS_SLUGS: string[] = ["required", "recommended", "optional", "avoid"];

// ---------------------------------------------------------------------------
// Emitted helpers. These run in the browser, not at build time. They are
// typechecked here but only their source text ships, so keep them free of
// build-time references and write escaping exactly as the final JS needs it.
// ---------------------------------------------------------------------------

let manifestPromise: any = null;

// Fetched once, on the first tool call that needs it. Tools that only drive
// the UI (open_search, open_checklist) never trigger it.
function wmcFetchManifest(manifestUrl: string, signal: any): Promise<any> {
  if (signal && signal.aborted) return Promise.reject(signal.reason);
  if (!manifestPromise) {
    // This request serves every caller; cancelling one must not abort it.
    manifestPromise = fetch(manifestUrl, {
      headers: { Accept: "application/json" },
    })
      .then(function (res: any) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .catch(function (err: any) {
        manifestPromise = null; // let a later call retry
        throw err;
      });
  }
  if (!signal) return manifestPromise;
  // Cancel only this caller's wait, and detach its listener when settled.
  return new Promise(function (resolve, reject) {
    function aborted() {
      signal.removeEventListener("abort", aborted);
      reject(signal.reason);
    }
    signal.addEventListener("abort", aborted, { once: true });
    manifestPromise.then(
      function (manifest: any) {
        signal.removeEventListener("abort", aborted);
        if (signal.aborted) reject(signal.reason);
        else resolve(manifest);
      },
      function (err: any) {
        signal.removeEventListener("abort", aborted);
        reject(err);
      },
    );
  });
}

function wmcToolError(
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  var out: Record<string, unknown> = { error: message, code: code };
  if (extra) {
    for (var k in extra) {
      out[k] = extra[k];
    }
  }
  return out;
}

function wmcManifestError(
  manifestUrl: string,
  err: any,
): Record<string, unknown> {
  return wmcToolError(
    "MANIFEST_ERROR",
    "ERROR loading the spec manifest from " +
      manifestUrl +
      ": " +
      (err && err.message ? err.message : String(err)),
    { retryable: true },
  );
}

function wmcTokenise(s: any): string[] {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/_.-]/g, " ")
    .split(/\s+/)
    .filter(function (t: string): boolean {
      return t.length >= 2;
    });
}

function wmcRank(pages: any[], query: any, limit: number): any[] {
  var tokens = wmcTokenise(query);
  if (!tokens.length) return [];
  var phrase = String(query || "").toLowerCase();
  var scored: any[] = [];
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    var title = p.title.toLowerCase();
    var slug = p.slug.toLowerCase();
    var summary = p.summary.toLowerCase();
    var score = 0;
    for (var j = 0; j < tokens.length; j++) {
      var t = tokens[j];
      if (title.indexOf(t) >= 0) score += 8;
      if (slug.indexOf(t) >= 0) score += 6;
      if (summary.indexOf(t) >= 0) score += 4;
    }
    if (title.indexOf(phrase) >= 0) score += 12;
    if (score > 0) scored.push({ page: p, score: score });
  }
  scored.sort(function (a: any, b: any): number {
    return b.score - a.score || a.page.order - b.page.order;
  });
  return scored.slice(0, limit);
}

function wmcFilterPages(pages: any[], args: any): any[] {
  return pages.filter(function (p: any): boolean {
    if (args && args.category && p.category !== args.category) return false;
    if (args && args.status && p.status !== args.status) return false;
    return true;
  });
}

function wmcOpenSearchOverlay(): boolean {
  var trigger = document.querySelector("[data-search-trigger]");
  if (trigger) {
    (trigger as HTMLElement).click();
    return true;
  }
  var opener = (window as any).__swOpenSearch;
  if (typeof opener === "function") {
    opener();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Tool definitions.
// ---------------------------------------------------------------------------

const TOOLS: BrowserTool[] = [
  {
    name: "search_spec",
    title: "Search the spec",
    description:
      'Search The Website Specification for matching topics. Returns ranked results with title, status, category, canonical URL, and a one-line summary. Use this when the user asks about a topic by keyword (e.g. "CSP", "alt text", "llms.txt").',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text query.",
          minLength: 1,
        },
        limit: {
          type: "integer",
          description: "Maximum results to return.",
          minimum: 1,
          maximum: 25,
          default: 5,
        },
      },
      required: ["query"],
    },
    execute: function (input: any, options: any): unknown {
      var q = input && input.query;
      var limit = (input && input.limit) || 5;
      if (limit < 1) limit = 1;
      if (limit > 25) limit = 25;
      var signal = options && options.signal;
      return wmcFetchManifest(MANIFEST_URL, signal).then(
        function (d: any) {
          var hits = wmcRank(d.pages, q, limit);
          if (!hits.length) {
            return wmcToolError(
              "NOT_FOUND",
              'No spec pages matched "' + q + '".',
              {
                suggestion:
                  "Try broader keywords, or call list_topics to browse by category.",
              },
            );
          }
          var lines = [];
          lines.push(
            "Found " +
              hits.length +
              " result" +
              (hits.length === 1 ? "" : "s") +
              ' for "' +
              q +
              '":',
          );
          lines.push("");
          for (var i = 0; i < hits.length; i++) {
            var p = hits[i].page;
            lines.push(
              i + 1 + ". " + p.title + " — " + p.status + " · " + p.category,
            );
            lines.push("   " + p.summary);
            lines.push("   " + p.url);
          }
          return lines.join("\n");
        },
        function (err: any) {
          return wmcManifestError(MANIFEST_URL, err);
        },
      );
    },
  },
  {
    name: "list_topics",
    title: "List spec topics",
    description:
      'List spec topics, optionally filtered by category and/or status. Returns title, status, category, summary, and URL per topic. Use this when the user wants the canonical list (e.g. "all required SEO topics"). Results are paged — follow page/page_size to walk the whole list.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: CATEGORY_SLUGS,
          description: "Restrict to one category.",
        },
        status: {
          type: "string",
          enum: STATUS_SLUGS,
          description: "Restrict to one status.",
        },
        page: {
          type: "integer",
          description: "Page of results to return.",
          minimum: 1,
          default: 1,
        },
        page_size: {
          type: "integer",
          description: "Topics per page.",
          minimum: 1,
          maximum: 50,
          default: 10,
        },
      },
    },
    execute: function (input: any, options: any): unknown {
      var args = input || {};
      var page = args.page || 1;
      var pageSize = args.page_size || 10;
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 1;
      if (pageSize > 50) pageSize = 50;
      var signal = options && options.signal;
      return wmcFetchManifest(MANIFEST_URL, signal).then(
        function (d: any) {
          var pages = wmcFilterPages(d.pages, args);
          if (!pages.length) {
            return wmcToolError("NOT_FOUND", "No topics matched the filters.", {
              suggestion:
                "Loosen the category/status filters, or call list_topics without filters.",
            });
          }
          var totalPages = Math.ceil(pages.length / pageSize);
          if (page > totalPages) {
            return wmcToolError(
              "INVALID_INPUT",
              "Page " + page + " is out of range.",
              { suggestion: "The last page is " + totalPages + "." },
            );
          }
          var items = pages.slice((page - 1) * pageSize, page * pageSize);
          var lines = [];
          lines.push(
            "Page " +
              page +
              " of " +
              totalPages +
              " — " +
              items.length +
              " of " +
              pages.length +
              " matching topics:",
          );
          lines.push("");
          for (var i = 0; i < items.length; i++) {
            var p = items[i];
            lines.push(
              "- " +
                p.title +
                " (" +
                p.status +
                ", " +
                p.category +
                ") — " +
                p.summary,
            );
            lines.push("  " + p.url);
          }
          return lines.join("\n");
        },
        function (err: any) {
          return wmcManifestError(MANIFEST_URL, err);
        },
      );
    },
  },
  {
    name: "get_topic",
    title: "Read a spec topic",
    description:
      "Fetch the Markdown for one spec page by its slug, returned as lines you can page through. Use this after search_spec or list_topics to read the canonical guidance.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description:
            "Kebab-case slug, as listed by list_topics or search_spec. Examples: 'content-security-policy', 'meta-robots', 'llms-txt'.",
          minLength: 1,
        },
        offset: {
          type: "integer",
          description: "First line to return (0-based).",
          minimum: 0,
          default: 0,
        },
        limit: {
          type: "integer",
          description: "Maximum lines to return.",
          minimum: 1,
          maximum: 500,
          default: 120,
        },
      },
      required: ["slug"],
    },
    execute: function (input: any, options: any): unknown {
      var slug = input && input.slug;
      if (!slug) {
        return wmcToolError(
          "INVALID_INPUT",
          "The slug parameter is required.",
          {
            suggestion: "Use search_spec or list_topics to find a valid slug.",
          },
        );
      }
      var offset = (input && input.offset) || 0;
      var limit = (input && input.limit) || 120;
      if (offset < 0) offset = 0;
      if (limit < 1) limit = 1;
      if (limit > 500) limit = 500;
      var signal = options && options.signal;
      return wmcFetchManifest(MANIFEST_URL, signal).then(
        function (d: any) {
          var page: any = null;
          for (var i = 0; i < d.pages.length; i++) {
            if (
              d.pages[i].slug === slug ||
              d.pages[i].slug.toLowerCase() === String(slug).toLowerCase()
            ) {
              page = d.pages[i];
              break;
            }
          }
          if (!page) {
            var close = [];
            for (var j = 0; j < d.pages.length && close.length < 5; j++) {
              var s = d.pages[j].slug;
              if (s.indexOf(slug) >= 0 || String(slug).indexOf(s) >= 0)
                close.push(s);
            }
            return wmcToolError(
              "NOT_FOUND",
              'No spec page with slug "' + slug + '".',
              {
                suggestion: close.length
                  ? "Closer matches: " + close.join(", ") + "."
                  : "Use search_spec to find the right slug.",
              },
            );
          }
          return fetch(page.mdUrl, {
            headers: { Accept: "text/markdown" },
            signal: signal,
          })
            .then(function (res: any) {
              if (!res.ok) throw new Error("HTTP " + res.status);
              return res.text();
            })
            .then(
              function (text: string) {
                var lines = text.split("\n");
                var slice = lines.slice(offset, offset + limit);
                var out = slice.join("\n");
                if (offset + slice.length < lines.length) {
                  out +=
                    "\n\n…truncated after line " +
                    (offset + slice.length) +
                    " of " +
                    lines.length +
                    "; call get_topic with offset=" +
                    (offset + slice.length) +
                    " to continue.";
                }
                return out;
              },
              function (err: any) {
                return wmcToolError(
                  "FETCH_ERROR",
                  "ERROR fetching " +
                    page.mdUrl +
                    ": " +
                    (err && err.message ? err.message : String(err)),
                  { retryable: true },
                );
              },
            );
        },
        function (err: any) {
          return wmcManifestError(MANIFEST_URL, err);
        },
      );
    },
  },
  {
    name: "open_search",
    title: "Open site search",
    description:
      "Open the on-page ⌘K search overlay so the user can search the spec interactively. Optionally pre-fills a query. UI action — does not return results; use search_spec for that.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional initial query to pre-fill.",
        },
      },
    },
    execute: function (input: any): unknown {
      var q = input && input.query;
      var opener = (window as any).__swOpenSearch;
      // Prefer the modal driver directly when a query is supplied — it
      // handles lazy-loading the bundle and prefilling the input itself.
      if (q && typeof opener === "function") {
        opener(q);
        return 'Search overlay opened with query "' + q + '".';
      }
      var ok = wmcOpenSearchOverlay();
      if (!ok) {
        return wmcToolError(
          "UNAVAILABLE",
          "Search overlay is not available on this page.",
          { suggestion: "Use search_spec to search programmatically." },
        );
      }
      return "Search overlay opened.";
    },
  },
  {
    name: "open_checklist",
    title: "Open the checklist",
    description:
      "Navigate the user to the full spec checklist page. Optionally jumps to a category section via URL hash. UI action — does not return data.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: CATEGORY_SLUGS,
          description: "Optional category to scroll to.",
        },
      },
    },
    execute: function (input: any): unknown {
      var url = "/checklist/";
      if (input && input.category)
        url += "#" + encodeURIComponent(input.category);
      window.location.assign(url);
      return "Navigating to " + url + ".";
    },
  },
];

let bodyPromise: Promise<string> | null = null;
let integrityPromise: Promise<string> | null = null;

/** The generated WebMCP script body. Computed once per build. */
export function webmcpBody(): Promise<string> {
  if (!bodyPromise) bodyPromise = build();
  return bodyPromise;
}

/** sha384 SRI hash of the exact bytes webmcpBody() serves. */
export function webmcpIntegrity(): Promise<string> {
  if (!integrityPromise) integrityPromise = webmcpBody().then(sriOf);
  return integrityPromise;
}

/** The spec manifest served at /webmcp-manifest.json. */
export async function webmcpManifest() {
  const entries = await getCollection("spec", ({ data }) => !data.draft);

  const pages = entries
    .map((e) => {
      const slug = e.data.slug ?? e.id.split("/").pop()!;
      return {
        slug,
        title: e.data.title,
        category: e.data.category,
        status: e.data.status,
        summary: e.data.summary,
        order: e.data.order,
        url: `${site.url}/spec/${e.data.category}/${slug}/`,
        mdUrl: `${site.url}/spec/${e.data.category}/${slug}.md`,
      };
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    );

  return {
    site: { name: site.name, url: site.url },
    categories: categories.map((c) => ({
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      order: c.order,
    })),
    pages,
  };
}

async function build(): Promise<string> {
  const helpers = [
    wmcFetchManifest,
    wmcManifestError,
    wmcToolError,
    wmcTokenise,
    wmcRank,
    wmcFilterPages,
    wmcOpenSearchOverlay,
  ]
    .map((fn) => fn.toString())
    .join("\n\n");

  const toolsSrc = TOOLS.map((t) => {
    const fields = [
      `name: ${JSON.stringify(t.name)}`,
      t.title ? `title: ${JSON.stringify(t.title)}` : "",
      `description: ${JSON.stringify(t.description)}`,
      t.annotations ? `annotations: ${JSON.stringify(t.annotations)}` : "",
      `inputSchema: ${JSON.stringify(t.inputSchema)}`,
      `execute: ${t.execute.toString()}`,
    ].filter(Boolean);
    return `{\n      ${fields.join(",\n      ")}\n    }`;
  }).join(",\n    ");

  return `/* The Website Specification — WebMCP browser-side tools.
 * Exposes spec lookup + navigation as tools an in-browser AI agent can call.
 * Loaded only when the browser exposes modelContext (see the guard in
 * BaseLayout.astro). The spec manifest is fetched from
 * ${WEBMCP_MANIFEST_PATH} on first use, not embedded here.
 * Generated at build time from src/content/spec/. Do not hand-edit.
 */
(function () {
  // Prefer document.modelContext (current spec surface, Chrome 150+).
  // Fall back to navigator.modelContext for older builds — deprecated, removal pending.
  var mc = null;
  if (typeof document !== 'undefined' && document.modelContext) mc = document.modelContext;
  else if (typeof navigator !== 'undefined' && navigator.modelContext) mc = navigator.modelContext;
  if (!mc) return;

  var MANIFEST_URL = ${JSON.stringify(WEBMCP_MANIFEST_PATH)};

  var manifestPromise = null;
${helpers}

  var tools = [
    ${toolsSrc}
  ];

  // Register. registerTool() is async per the spec, so register sequentially
  // and catch per tool: a rejection (e.g. a schema the browser won't accept)
  // warns instead of surfacing as an unhandled rejection. Fall back to
  // provideContext() if the implementation only exposes that.
  if (typeof mc.registerTool === 'function') {
    (async function registerAll() {
      for (var i = 0; i < tools.length; i++) {
        try {
          await mc.registerTool(tools[i]);
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) console.warn('[webmcp] registration failed for ' + tools[i].name + ':', e);
        }
      }
    })();
  } else if (typeof mc.provideContext === 'function') {
    mc.provideContext({ tools: tools });
  }
})();
`;
}
