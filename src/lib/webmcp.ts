// Browser-side WebMCP registration, in two pieces.
//
// 1. WEBMCP_GUARD — a tiny inline script BaseLayout emits on every page. It
//    feature-detects `modelContext` and only then injects /webmcp.js. Browsers
//    with no WebMCP implementation (i.e. nearly all of them today) fetch
//    nothing at all. The guard's *text* is a constant so its CSP sha256 never
//    moves; the per-build SRI of /webmcp.js rides along in a data- attribute,
//    which CSP does not hash. check-integrity.mjs asserts the two agree.
//
// 2. webmcpBody() — the tool definitions. It no longer embeds the spec
//    manifest: that is served separately at /webmcp-manifest.json and fetched
//    on first use by the tools that need it. Embedding it made this file ~86 kB,
//    which every visitor paid for on every page whether or not an agent existed
//    to call the tools. Only the two enums stay inline, because inputSchema has
//    to be complete at registration time.
//
// webmcpBody() is memoised so the bytes BaseLayout hashes are the bytes the
// endpoint serves.
import { getCollection } from "astro:content";
import { categories, site } from "~/lib/site";
import { sriOf } from "~/lib/integrity";

/** Path of the lazily-fetched spec manifest. */
export const WEBMCP_MANIFEST_PATH = "/webmcp-manifest.json";

// Kept on one line and byte-stable: BaseLayout renders it with set:html, so
// these exact bytes are what CSP hashes. Changing this string means recomputing
// the sha256 in public/_headers — `npm run build` fails loudly if you forget.
export const WEBMCP_GUARD =
  '(function(){var d=document.currentScript.dataset;if(!document.modelContext&&!navigator.modelContext)return;var s=document.createElement("script");s.src=d.webmcpSrc;s.integrity=d.webmcpSri;s.crossOrigin="anonymous";document.head.appendChild(s)})();';

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
  const CATEGORY_ENUM = categories.map((c) => c.slug);
  const STATUS_ENUM = ["required", "recommended", "optional", "avoid"];

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
  var CATEGORY_ENUM = ${JSON.stringify(CATEGORY_ENUM)};
  var STATUS_ENUM = ${JSON.stringify(STATUS_ENUM)};

  // Fetched once, on the first tool call that needs it. Tools that only drive
  // the UI (open_search, open_checklist) never trigger it.
  var dataPromise = null;
  function data() {
    if (!dataPromise) {
      dataPromise = fetch(MANIFEST_URL, { headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .catch(function (err) {
          dataPromise = null; // let a later call retry
          throw err;
        });
    }
    return dataPromise;
  }

  function failed(err) {
    return 'ERROR loading the spec manifest from ' + MANIFEST_URL + ': ' +
      (err && err.message ? err.message : String(err));
  }

  function tokenise(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\\s\\/_.-]/g, ' ')
      .split(/\\s+/)
      .filter(function (t) { return t.length >= 2; });
  }

  function rank(pages, query, limit) {
    var tokens = tokenise(query);
    if (!tokens.length) return [];
    var phrase = String(query || '').toLowerCase();
    var scored = [];
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
    scored.sort(function (a, b) {
      return b.score - a.score || a.page.order - b.page.order;
    });
    return scored.slice(0, limit);
  }

  function filterPages(pages, args) {
    return pages.filter(function (p) {
      if (args && args.category && p.category !== args.category) return false;
      if (args && args.status && p.status !== args.status) return false;
      return true;
    });
  }

  function openSearchOverlay() {
    var trigger = document.querySelector('[data-search-trigger]');
    if (trigger) { trigger.click(); return true; }
    if (typeof window.__swOpenSearch === 'function') { window.__swOpenSearch(); return true; }
    return false;
  }

  var tools = [
    {
      name: 'search_spec',
      description:
        'Search The Website Specification for matching topics. Returns ranked results with title, status, category, canonical URL, and a one-line summary. Use this when the user asks about a topic by keyword (e.g. "CSP", "alt text", "llms.txt").',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text query.', minLength: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 25, default: 5 },
        },
        required: ['query'],
      },
      execute: function (input) {
        var q = input && input.query;
        var limit = (input && input.limit) || 5;
        if (limit < 1) limit = 1;
        if (limit > 25) limit = 25;
        return data().then(function (d) {
          var hits = rank(d.pages, q, limit);
          if (!hits.length) {
            return 'No spec pages matched "' + q + '".';
          }
          var lines = [];
          lines.push('Found ' + hits.length + ' result' + (hits.length === 1 ? '' : 's') + ' for "' + q + '":');
          lines.push('');
          for (var i = 0; i < hits.length; i++) {
            var p = hits[i].page;
            lines.push((i + 1) + '. ' + p.title + ' — ' + p.status + ' · ' + p.category);
            lines.push('   ' + p.summary);
            lines.push('   ' + p.url);
          }
          return lines.join('\\n');
        }, failed);
      },
    },
    {
      name: 'list_topics',
      description:
        'List spec topics, optionally filtered by category and/or status. Returns title, status, category, summary, and URL for each. Use this when the user wants the canonical list (e.g. "all required SEO topics").',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: CATEGORY_ENUM, description: 'Restrict to one category.' },
          status: { type: 'string', enum: STATUS_ENUM, description: 'Restrict to one status.' },
          limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Cap the number of items returned.' },
        },
      },
      execute: function (input) {
        return data().then(function (d) {
          var pages = filterPages(d.pages, input || {});
          var limit = input && input.limit ? input.limit : pages.length;
          if (limit < 1) limit = 1;
          if (limit > 200) limit = 200;
          var items = pages.slice(0, limit);
          if (!items.length) return 'No topics matched the filters.';
          var lines = [];
          lines.push(items.length + ' of ' + pages.length + ' matching topics:');
          lines.push('');
          for (var i = 0; i < items.length; i++) {
            var p = items[i];
            lines.push('- ' + p.title + ' (' + p.status + ', ' + p.category + ') — ' + p.summary);
            lines.push('  ' + p.url);
          }
          return lines.join('\\n');
        }, failed);
      },
    },
    {
      name: 'get_topic',
      description:
        "Fetch the full Markdown for one spec page by its slug. Returns the rendered body with YAML frontmatter (title, status, sources). Use this after search_spec or list_topics to read the canonical guidance.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: "Kebab-case slug, as listed by list_topics or search_spec. Examples: 'content-security-policy', 'meta-robots', 'llms-txt'.",
            minLength: 1,
          },
        },
        required: ['slug'],
      },
      execute: function (input) {
        var slug = input && input.slug;
        if (!slug) return 'ERROR: slug is required.';
        return data().then(function (d) {
          var page = null;
          for (var i = 0; i < d.pages.length; i++) {
            if (d.pages[i].slug === slug || d.pages[i].slug.toLowerCase() === String(slug).toLowerCase()) {
              page = d.pages[i];
              break;
            }
          }
          if (!page) {
            var close = [];
            for (var j = 0; j < d.pages.length && close.length < 5; j++) {
              var s = d.pages[j].slug;
              if (s.indexOf(slug) >= 0 || String(slug).indexOf(s) >= 0) close.push(s);
            }
            var hint = close.length ? ' Closer matches: ' + close.join(', ') + '.' : '';
            return 'No spec page with slug "' + slug + '".' + hint;
          }
          return fetch(page.mdUrl, { headers: { Accept: 'text/markdown' } })
            .then(function (res) {
              if (!res.ok) throw new Error('HTTP ' + res.status);
              return res.text();
            })
            .catch(function (err) {
              return 'ERROR fetching ' + page.mdUrl + ': ' + (err && err.message ? err.message : String(err));
            });
        }, failed);
      },
    },
    {
      name: 'open_search',
      description:
        'Open the on-page ⌘K search overlay so the user can search the spec interactively. Optionally pre-fills a query. UI action — does not return results; use search_spec for that.',
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional initial query to pre-fill.' },
        },
      },
      execute: function (input) {
        var q = input && input.query;
        // Prefer the modal driver directly when a query is supplied — it
        // handles lazy-loading the bundle and prefilling the input itself.
        if (q && typeof window.__swOpenSearch === 'function') {
          window.__swOpenSearch(q);
          return 'Search overlay opened with query "' + q + '".';
        }
        var ok = openSearchOverlay();
        if (!ok) return 'ERROR: search overlay is not available on this page.';
        return 'Search overlay opened.';
      },
    },
    {
      name: 'open_checklist',
      description:
        'Navigate the user to the full spec checklist page. Optionally jumps to a category section via URL hash. UI action — does not return data.',
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: CATEGORY_ENUM, description: 'Optional category to scroll to.' },
        },
      },
      execute: function (input) {
        var url = '/checklist/';
        if (input && input.category) url += '#' + encodeURIComponent(input.category);
        window.location.assign(url);
        return 'Navigating to ' + url + '.';
      },
    },
  ];

  // Register. Prefer registerTool() (per the W3C draft + Chrome Labs demos).
  // Fall back to provideContext() if the implementation only exposes that.
  try {
    if (typeof mc.registerTool === 'function') {
      for (var i = 0; i < tools.length; i++) mc.registerTool(tools[i]);
    } else if (typeof mc.provideContext === 'function') {
      mc.provideContext({ tools: tools });
    }
  } catch (e) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[webmcp] tool registration failed:', e);
    }
  }
})();
`;
}
