// Browser-side WebMCP registration script, generated at build time from spec
// content. Extracted here (rather than inline in src/pages/webmcp.js.ts) so the
// endpoint that serves it and BaseLayout that pins it with SRI share one source
// of truth: webmcpBody() is memoised, so the exact bytes that are served are the
// exact bytes that are hashed. Because the body embeds the spec manifest it
// changes whenever content changes — hence a build-time hash, not a constant.
import { getCollection } from "astro:content";
import { categories, site } from "~/lib/site";
import { sriOf } from "~/lib/integrity";

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

async function build(): Promise<string> {
  const entries = await getCollection("spec", ({ data }) => !data.draft);

  const manifest = entries
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

  const categoriesList = categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    order: c.order,
  }));

  const CATEGORY_ENUM = categories.map((c) => c.slug);
  const STATUS_ENUM = ["required", "recommended", "optional", "avoid"];

  const data = JSON.stringify({
    site: { name: site.name, url: site.url },
    categories: categoriesList,
    pages: manifest,
  });

  return `/* The Website Specification — WebMCP browser-side tools.
 * Exposes spec lookup + navigation as tools an in-browser AI agent can call.
 * Generated at build time from src/content/spec/. Do not hand-edit.
 */
(function () {
  // Prefer document.modelContext (current spec surface, Chrome 150+).
  // Fall back to navigator.modelContext for older builds — deprecated, removal pending.
  var mc = null;
  if (typeof document !== 'undefined' && document.modelContext) mc = document.modelContext;
  else if (typeof navigator !== 'undefined' && navigator.modelContext) mc = navigator.modelContext;
  if (!mc) return;

  var DATA = ${data};
  var CATEGORY_ENUM = ${JSON.stringify(CATEGORY_ENUM)};
  var STATUS_ENUM = ${JSON.stringify(STATUS_ENUM)};

  function tokenise(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\\s\\/_.-]/g, ' ')
      .split(/\\s+/)
      .filter(function (t) { return t.length >= 2; });
  }

  function rank(query, limit) {
    var tokens = tokenise(query);
    if (!tokens.length) return [];
    var phrase = String(query || '').toLowerCase();
    var scored = [];
    for (var i = 0; i < DATA.pages.length; i++) {
      var p = DATA.pages[i];
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

  function filterPages(args) {
    return DATA.pages.filter(function (p) {
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
        var hits = rank(q, limit);
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
        var pages = filterPages(input || {});
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
        var page = null;
        for (var i = 0; i < DATA.pages.length; i++) {
          if (DATA.pages[i].slug === slug || DATA.pages[i].slug.toLowerCase() === String(slug).toLowerCase()) {
            page = DATA.pages[i];
            break;
          }
        }
        if (!page) {
          var close = [];
          for (var j = 0; j < DATA.pages.length && close.length < 5; j++) {
            var s = DATA.pages[j].slug;
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
