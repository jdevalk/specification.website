import { REPORT_FEEDBACK_TOOL } from './feedback';
import type { Category, Page, Manifest, Status, ChangelogEntry } from './types';

// --- helpers ------------------------------------------------------------

function tokenise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s/_.-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

interface Scored {
  page: Page;
  score: number;
  matches: { field: string; snippet: string }[];
}

function snippet(body: string, query: string, radius = 80): string {
  const lower = body.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return '';
  const start = Math.max(0, idx - radius);
  const end = Math.min(body.length, idx + q.length + radius);
  const pre = start > 0 ? '…' : '';
  const post = end < body.length ? '…' : '';
  return (pre + body.slice(start, end) + post).replace(/\s+/g, ' ').trim();
}

function rankPages(pages: Page[], rawQuery: string, limit: number): Scored[] {
  const tokens = tokenise(rawQuery);
  if (tokens.length === 0) return [];
  const scored: Scored[] = [];
  for (const page of pages) {
    const fields = {
      title: page.title.toLowerCase(),
      slug: page.slug.toLowerCase(),
      summary: page.summary.toLowerCase(),
      body: page.body.toLowerCase(),
    };
    let score = 0;
    const matches: { field: string; snippet: string }[] = [];
    for (const t of tokens) {
      if (fields.title.includes(t)) score += 8;
      if (fields.slug.includes(t)) score += 6;
      if (fields.summary.includes(t)) score += 4;
      const bodyHits = fields.body.split(t).length - 1;
      if (bodyHits > 0) {
        score += Math.min(bodyHits, 6);
        const s = snippet(page.body, t);
        if (s && matches.length < 2) matches.push({ field: 'body', snippet: s });
      }
    }
    // Phrase bonus
    if (fields.title.includes(rawQuery.toLowerCase())) score += 12;
    if (score > 0) scored.push({ page, score, matches });
  }
  scored.sort((a, b) => b.score - a.score || a.page.order - b.page.order);
  return scored.slice(0, limit);
}

function filterPages(
  pages: Page[],
  filters: { category?: string; status?: Status },
): Page[] {
  return pages.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.status && p.status !== filters.status) return false;
    return true;
  });
}

// --- tool implementations -----------------------------------------------

export function searchTool(m: Manifest, args: { query: string; limit?: number }) {
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 25);
  const results = rankPages(m.pages, args.query, limit);
  if (results.length === 0) {
    return {
      content: [{ type: 'text' as const, text: `No spec pages matched "${args.query}".` }],
      structuredContent: { query: args.query, count: 0, results: [] },
    };
  }
  const lines: string[] = [];
  lines.push(`Found ${results.length} spec page${results.length === 1 ? '' : 's'} for "${args.query}":\n`);
  for (const { page, score, matches } of results) {
    lines.push(`### ${page.title}`);
    lines.push(`- **status:** ${page.status}  ·  **category:** ${page.category}  ·  **score:** ${score}`);
    lines.push(`- **url:** ${page.url}`);
    lines.push(`- **markdown:** ${page.mdUrl}`);
    lines.push(`- ${page.summary}`);
    for (const m of matches) lines.push(`  > …${m.snippet}…`);
    lines.push('');
  }
  const structuredContent = {
    query: args.query,
    count: results.length,
    results: results.map(({ page, score, matches }) => ({
      slug: page.slug,
      title: page.title,
      status: page.status,
      category: page.category,
      score,
      url: page.url,
      mdUrl: page.mdUrl,
      summary: page.summary,
      excerpts: matches.map((mm) => mm.snippet),
    })),
  };
  return {
    content: [{ type: 'text' as const, text: lines.join('\n').trimEnd() }],
    structuredContent,
  };
}

export function listTopicsTool(
  m: Manifest,
  args: { category?: string; status?: Status; limit?: number },
) {
  const pages = filterPages(m.pages, args);
  const limit = args.limit ? Math.min(Math.max(args.limit, 1), 200) : pages.length;
  const items = pages.slice(0, limit);
  const lines: string[] = [];
  const filterDesc =
    [
      args.category ? `category=${args.category}` : '',
      args.status ? `status=${args.status}` : '',
    ]
      .filter(Boolean)
      .join(', ') || 'all';
  lines.push(
    `${items.length} of ${pages.length} matching topics (filters: ${filterDesc}):\n`,
  );
  for (const p of items) {
    lines.push(`- **[${p.title}](${p.url})** — ${p.status}, ${p.category}`);
    lines.push(`  ${p.summary}`);
  }
  const structuredContent = {
    total: pages.length,
    count: items.length,
    filters: {
      ...(args.category ? { category: args.category } : {}),
      ...(args.status ? { status: args.status } : {}),
    },
    topics: items.map((p) => ({
      slug: p.slug,
      title: p.title,
      status: p.status,
      category: p.category,
      summary: p.summary,
      url: p.url,
    })),
  };
  return {
    content: [{ type: 'text' as const, text: lines.join('\n') }],
    structuredContent,
  };
}

export function getTopicTool(m: Manifest, args: { slug: string }) {
  const page =
    m.pages.find((p) => p.slug === args.slug) ??
    m.pages.find((p) => p.slug.toLowerCase() === args.slug.toLowerCase());
  if (!page) {
    const close = m.pages
      .map((p) => ({ p, score: p.slug.includes(args.slug) || args.slug.includes(p.slug) ? 1 : 0 }))
      .filter((x) => x.score > 0)
      .slice(0, 5);
    const suggestions = close.length
      ? `\nCloser matches: ${close.map((x) => x.p.slug).join(', ')}`
      : '';
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `No spec page with slug "${args.slug}".${suggestions}`,
        },
      ],
    };
  }
  const fm: string[] = [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    `slug: ${page.slug}`,
    `category: ${page.category}`,
    `status: ${page.status}`,
    `url: ${page.url}`,
    `markdown: ${page.mdUrl}`,
  ];
  if (page.updated) fm.push(`updated: ${JSON.stringify(page.updated)}`);
  if (page.sources.length) {
    fm.push('sources:');
    for (const s of page.sources) {
      fm.push(`  - title: ${JSON.stringify(s.title)}`);
      fm.push(`    url: ${JSON.stringify(s.url)}`);
      if (s.publisher) fm.push(`    publisher: ${JSON.stringify(s.publisher)}`);
    }
  }
  if (page.relatedSlugs.length) {
    fm.push(`relatedSlugs: [${page.relatedSlugs.join(', ')}]`);
  }
  fm.push('---', '');
  const text = `${fm.join('\n')}# ${page.title}\n\n> ${page.summary}\n\n${page.body}`;
  const structuredContent = {
    slug: page.slug,
    title: page.title,
    category: page.category,
    status: page.status,
    url: page.url,
    mdUrl: page.mdUrl,
    updated: page.updated,
    summary: page.summary,
    sources: page.sources,
    relatedSlugs: page.relatedSlugs,
    markdown: text,
  };
  return { content: [{ type: 'text' as const, text }], structuredContent };
}

export function getChecklistTool(
  m: Manifest,
  args: { category?: string; status?: Status },
) {
  const pages = filterPages(m.pages, args);
  if (pages.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No matching items.' }],
      structuredContent: {
        total: 0,
        filters: {
          ...(args.category ? { category: args.category } : {}),
          ...(args.status ? { status: args.status } : {}),
        },
        categories: [],
      },
    };
  }
  // group by category
  const groups = new Map<string, Page[]>();
  for (const p of pages) {
    const k = p.category;
    const arr = groups.get(k) ?? [];
    arr.push(p);
    groups.set(k, arr);
  }
  const lines: string[] = [];
  lines.push(`# The Website Specification — checklist (${pages.length} items)\n`);
  const cats = Array.from(groups.keys()).sort((a, b) => {
    const oa = m.categories.find((c) => c.slug === a)?.order ?? 99;
    const ob = m.categories.find((c) => c.slug === b)?.order ?? 99;
    return oa - ob;
  });
  const structuredCategories: {
    slug: string;
    title: string;
    items: { slug: string; title: string; status: Status; summary: string; url: string }[];
  }[] = [];
  for (const c of cats) {
    const cat = m.categories.find((x) => x.slug === c);
    lines.push(`## ${cat?.title ?? c}`);
    for (const p of groups.get(c)!) {
      lines.push(`- [ ] **${p.title}** _(${p.status})_ — ${p.summary}`);
      lines.push(`      ${p.url}`);
    }
    lines.push('');
    structuredCategories.push({
      slug: c,
      title: cat?.title ?? c,
      items: groups.get(c)!.map((p) => ({
        slug: p.slug,
        title: p.title,
        status: p.status,
        summary: p.summary,
        url: p.url,
      })),
    });
  }
  const structuredContent = {
    total: pages.length,
    filters: {
      ...(args.category ? { category: args.category } : {}),
      ...(args.status ? { status: args.status } : {}),
    },
    categories: structuredCategories,
  };
  return {
    content: [{ type: 'text' as const, text: lines.join('\n').trimEnd() }],
    structuredContent,
  };
}

export function getCategoriesTool(m: Manifest) {
  const counts = new Map<string, number>();
  for (const p of m.pages) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const lines: string[] = [];
  lines.push(`# Categories (${m.categories.length})\n`);
  for (const c of m.categories) {
    lines.push(`- **${c.title}** (\`${c.slug}\`) — ${counts.get(c.slug) ?? 0} topics. ${c.summary}`);
  }
  const structuredContent = {
    count: m.categories.length,
    categories: m.categories.map((c) => ({
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      topicCount: counts.get(c.slug) ?? 0,
    })),
  };
  return { content: [{ type: 'text' as const, text: lines.join('\n') }], structuredContent };
}

export function getChangesTool(
  m: Manifest,
  args: { since?: string; type?: string; limit?: number },
) {
  const bySlug = new Map(m.pages.map((p) => [p.slug, p]));
  // Normalise `since` to a YYYY-MM-DD prefix; entry dates are ISO dates, so a
  // lexicographic compare is a correct date compare.
  const since = args.since ? args.since.slice(0, 10) : undefined;
  let entries: ChangelogEntry[] = m.changelog;
  if (since) entries = entries.filter((e) => e.date >= since);
  if (args.type) entries = entries.filter((e) => e.type === args.type);
  // changelog is already newest-first; apply limit only when no `since` window,
  // or always as a safety cap.
  const limit = args.limit ? Math.min(Math.max(args.limit, 1), 100) : since ? 100 : 20;
  const windowed = entries.slice(0, limit);

  const resolved = windowed.map((e) => {
    const topics = e.relatedSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is Page => Boolean(p))
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        status: p.status,
        category: p.category,
        url: p.url,
      }));
    // Slugs named in the entry but no longer present (e.g. a removed page).
    const unresolvedSlugs = e.relatedSlugs.filter((s) => !bySlug.has(s));
    return {
      date: e.date,
      type: e.type,
      title: e.title,
      summary: e.body.replace(/\s+/g, ' ').trim(),
      topics,
      unresolvedSlugs,
    };
  });

  const sinceDesc = since ? `since ${since}` : `most recent ${windowed.length}`;
  const typeDesc = args.type ? `, type=${args.type}` : '';
  const lines: string[] = [];
  if (resolved.length === 0) {
    lines.push(`No spec changes ${sinceDesc}${typeDesc}.`);
  } else {
    lines.push(`${resolved.length} spec change entr${resolved.length === 1 ? 'y' : 'ies'} (${sinceDesc}${typeDesc}), newest first:\n`);
    for (const e of resolved) {
      lines.push(`### ${e.date} — ${e.title} _(${e.type})_`);
      lines.push(e.summary);
      for (const t of e.topics) {
        lines.push(`- **[${t.title}](${t.url})** — now \`${t.status}\`, ${t.category} (re-audit this)`);
      }
      for (const s of e.unresolvedSlugs) {
        lines.push(`- \`${s}\` — no longer a live page (removed)`);
      }
      lines.push('');
    }
    lines.push('To re-audit only what moved: call `get_topic` on each topic above, then re-check the target site against its current guidance.');
  }

  const structuredContent = {
    since: since ?? null,
    type: args.type ?? null,
    count: resolved.length,
    latest: m.changelog[0]?.date ?? null,
    changes: resolved,
  };
  return {
    content: [{ type: 'text' as const, text: lines.join('\n').trimEnd() }],
    structuredContent,
  };
}

// --- tool catalogue (advertised via tools/list) -------------------------

const CATEGORY_ENUM = [
  'foundations',
  'seo',
  'accessibility',
  'security',
  'well-known',
  'agent-readiness',
  'performance',
  'privacy',
  'resilience',
  'i18n',
];

const STATUS_ENUM = ['required', 'recommended', 'optional', 'avoid'];

const CHANGE_TYPE_ENUM = ['added', 'changed', 'status', 'removed'];

// Reused inline so the four status tiers are documented at every call site
// where a `status` filter is accepted.
const STATUS_PARAM_DESC =
  'Filter by spec status tier. `required` = the web-platform contract breaks or a clear class of users is harmed without it. `recommended` = a modern site should do it. `optional` = context-dependent. `avoid` = outdated, harmful, or superseded. Omit to include all four tiers. Example: `required`.';

const CATEGORY_PARAM_DESC =
  'Filter to a single top-level category. Call `get_categories` for the list with descriptions and topic counts. Omit to include all ten categories. Example: `seo`.';

// All five tools are read-only, deterministic, and operate over a corpus
// bundled into the Worker at build time — never the live web. These
// annotations declare exactly that, which is the behaviour-transparency
// signal MCP clients (and registries) read.
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// Shared output-schema fragment: a topic reference as returned in list/search.
const TOPIC_REF_PROPERTIES = {
  slug: { type: 'string', description: 'Kebab-case identifier; pass to `get_topic`.' },
  title: { type: 'string', description: 'Human-readable page title.' },
  status: {
    type: 'string',
    enum: STATUS_ENUM,
    description: 'Spec status tier: `required`, `recommended`, `optional`, or `avoid`.',
  },
  category: {
    type: 'string',
    enum: CATEGORY_ENUM,
    description: 'Top-level category this topic belongs to.',
  },
  summary: { type: 'string', description: 'One-sentence summary of the topic.' },
  url: { type: 'string', description: 'Canonical HTML URL of the spec page.' },
};

// Shared output-schema fragment: the echo of the filters that were applied,
// returned by list_topics and get_checklist. Omitted keys mean no filter.
const FILTERS_ECHO_PROPERTIES = {
  category: {
    type: 'string',
    enum: CATEGORY_ENUM,
    description: 'The category filter that was applied, if any.',
  },
  status: {
    type: 'string',
    enum: STATUS_ENUM,
    description: 'The status filter that was applied, if any.',
  },
};

export const TOOLS = [
  REPORT_FEEDBACK_TOOL,
  {
    name: 'search',
    title: 'Search the spec',
    description:
      'Read-only, deterministic full-text search across every spec page. Ranks pages by weighted keyword matches in title, slug, summary, and body, and returns the top results with status, category, canonical URL, Markdown URL, and matching body excerpts. No side effects and no live-web access — it queries an in-memory snapshot bundled at build time, so it returns in well under a millisecond. Use this for keyword/topic lookups when you do NOT already know the slug. Prefer `list_topics` when you want the complete, unranked set of pages matching a category/status filter; prefer `get_topic` when you already know the exact slug.',
    annotations: { ...READ_ONLY_ANNOTATIONS, title: 'Search the spec' },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          description:
            'Free-text query, matched case-insensitively as substrings (not whole words). Split on whitespace; tokens shorter than 2 characters are ignored, so single-letter terms match nothing. Punctuation other than / _ . - is treated as a separator. Each token is scored against title, slug, summary, and body. Example: `content security policy` or `alt text`.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 25,
          default: 5,
          description: 'Maximum number of ranked results to return. Defaults to 5; clamped to 1–25.',
        },
      },
      required: ['query'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The query that was run, echoed back.' },
        count: { type: 'integer', description: 'Number of results returned (0 if no match).' },
        results: {
          type: 'array',
          description: 'Ranked matches, most relevant first; empty when `count` is 0.',
          items: {
            type: 'object',
            properties: {
              ...TOPIC_REF_PROPERTIES,
              score: { type: 'number', description: 'Relevance score; higher is a closer match.' },
              mdUrl: { type: 'string', description: 'URL of the raw Markdown for this page.' },
              excerpts: {
                type: 'array',
                items: { type: 'string' },
                description: 'Up to two body snippets showing the matched terms in context.',
              },
            },
            required: ['slug', 'title', 'status', 'category', 'score', 'url', 'mdUrl', 'summary'],
          },
        },
      },
      required: ['query', 'count', 'results'],
    },
  },
  {
    name: 'list_topics',
    title: 'List spec topics',
    description:
      'Read-only. Return the canonical list of spec topics, optionally narrowed by category and/or status, each with title, status, category, summary, and URL. Returns ALL statuses unless `status` is passed; omitting `limit` returns every matching topic. No side effects; results are deterministic and returned in canonical spec order (by category, then page order). This is the right tool when you want a complete, unranked index (e.g. "every required SEO topic"). Use `search` instead for relevance-ranked keyword lookup, `get_checklist` for audit-style grouped output, and `get_topic` to fetch one page in full.',
    annotations: { ...READ_ONLY_ANNOTATIONS, title: 'List spec topics' },
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATEGORY_ENUM, description: CATEGORY_PARAM_DESC },
        status: { type: 'string', enum: STATUS_ENUM, description: STATUS_PARAM_DESC },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 200,
          description:
            'Maximum number of topics to return after filtering. Omit to return every matching topic; clamped to 1–200 when given.',
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        total: { type: 'integer', description: 'Total topics matching the filters, before `limit`.' },
        count: { type: 'integer', description: 'Topics actually returned (after `limit`).' },
        filters: {
          type: 'object',
          properties: FILTERS_ECHO_PROPERTIES,
          description: 'The filters that were applied (omitted keys mean no filter).',
        },
        topics: {
          type: 'array',
          description: 'Matching topics in canonical spec order (by category, then page order).',
          items: {
            type: 'object',
            properties: TOPIC_REF_PROPERTIES,
            required: ['slug', 'title', 'status', 'category', 'summary', 'url'],
          },
        },
      },
      required: ['total', 'count', 'filters', 'topics'],
    },
  },
  {
    name: 'get_topic',
    title: 'Get one spec page',
    description:
      'Read-only. Fetch the full canonical Markdown for a single spec page by its slug: YAML frontmatter (title, status, category, sources, related slugs) plus the rendered body. Use this once you have a slug from `search` or `list_topics`. If you only have keywords, call `search` first.',
    annotations: { ...READ_ONLY_ANNOTATIONS, title: 'Get one spec page' },
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          minLength: 1,
          description:
            'Kebab-case slug, as listed by `list_topics` or `search`. Matched case-insensitively, with close-match suggestions on miss. Examples: `content-security-policy`, `meta-robots`, `llms-txt`.',
        },
      },
      required: ['slug'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Kebab-case identifier of this page.' },
        title: { type: 'string', description: 'Human-readable page title.' },
        category: {
          type: 'string',
          enum: CATEGORY_ENUM,
          description: 'Top-level category this topic belongs to.',
        },
        status: {
          type: 'string',
          enum: STATUS_ENUM,
          description: 'Spec status tier: `required`, `recommended`, `optional`, or `avoid`.',
        },
        url: { type: 'string', description: 'Canonical HTML URL.' },
        mdUrl: { type: 'string', description: 'Raw Markdown URL.' },
        updated: {
          type: ['string', 'null'],
          description: 'ISO 8601 timestamp of the last content update, or null.',
        },
        summary: { type: 'string', description: 'One-sentence summary of the topic.' },
        sources: {
          type: 'array',
          description: 'Primary-source citations for this page.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Title of the cited source.' },
              url: { type: 'string', description: 'URL of the cited source.' },
              publisher: {
                type: 'string',
                description: 'Publishing body (e.g. WHATWG, W3C, IETF), if known.',
              },
            },
            required: ['title', 'url'],
          },
        },
        relatedSlugs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Slugs of related topics; each can be passed to `get_topic`.',
        },
        markdown: { type: 'string', description: 'The full page as Markdown with YAML frontmatter.' },
      },
      required: ['slug', 'title', 'category', 'status', 'url', 'mdUrl', 'summary', 'markdown'],
    },
  },
  {
    name: 'get_checklist',
    title: 'Get an audit checklist',
    description:
      'Read-only. Return a Markdown checklist of spec items grouped by category, optionally filtered by category and/or status. Built for site audits — each item is a tickable line with status and canonical URL. Returns all statuses unless `status` is passed. No side effects; items are grouped by category in canonical order and the output is deterministic. Use `list_topics` instead when you want a flat list rather than grouped checkboxes, or the `audit_url` prompt to drive an actual audit of a target URL.',
    annotations: { ...READ_ONLY_ANNOTATIONS, title: 'Get an audit checklist' },
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATEGORY_ENUM, description: CATEGORY_PARAM_DESC },
        status: { type: 'string', enum: STATUS_ENUM, description: STATUS_PARAM_DESC },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        total: { type: 'integer', description: 'Total checklist items across all groups.' },
        filters: {
          type: 'object',
          properties: FILTERS_ECHO_PROPERTIES,
          description: 'The filters that were applied (omitted keys mean no filter).',
        },
        categories: {
          type: 'array',
          description: 'Checklist groups in canonical category order, each holding its items.',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Kebab-case category identifier.' },
              title: { type: 'string', description: 'Human-readable category title.' },
              items: {
                type: 'array',
                description: 'Checklist entries in this category, in canonical page order.',
                items: {
                  type: 'object',
                  properties: {
                    slug: { type: 'string', description: 'Kebab-case identifier; pass to `get_topic`.' },
                    title: { type: 'string', description: 'Human-readable page title.' },
                    status: {
                      type: 'string',
                      enum: STATUS_ENUM,
                      description: 'Spec status tier: `required`, `recommended`, `optional`, or `avoid`.',
                    },
                    summary: { type: 'string', description: 'One-sentence summary of the item.' },
                    url: { type: 'string', description: 'Canonical HTML URL of the spec page.' },
                  },
                  required: ['slug', 'title', 'status', 'summary', 'url'],
                },
              },
            },
            required: ['slug', 'title', 'items'],
          },
        },
      },
      required: ['total', 'filters', 'categories'],
    },
  },
  {
    name: 'get_categories',
    title: 'List categories',
    description:
      'Read-only. List the ten top-level spec categories with their summaries and topic counts. Takes no arguments. No side effects; categories are returned in canonical display order. Call this first to discover the valid `category` filter values used by `list_topics`, `get_checklist`, and `search` results.',
    annotations: { ...READ_ONLY_ANNOTATIONS, title: 'List categories' },
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: {
        count: { type: 'integer', description: 'Number of categories returned (always ten).' },
        categories: {
          type: 'array',
          description: 'All top-level categories in canonical display order.',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Use as the `category` filter value.' },
              title: { type: 'string', description: 'Human-readable category title.' },
              summary: { type: 'string', description: 'One-sentence description of the category.' },
              topicCount: { type: 'integer', description: 'Number of spec topics in this category.' },
            },
            required: ['slug', 'title', 'summary', 'topicCount'],
          },
        },
      },
      required: ['count', 'categories'],
    },
  },
  {
    name: 'get_changes',
    title: 'Get spec changes since a date',
    description:
      'Read-only. Return the spec\'s change history — new pages, status promotions/downgrades, substantive rewrites, and removals — newest first, each resolved to the current topics it affects (slug, title, current status, category, URL). This is the delta tool for a returning agent: pass `since` (the date you last audited a site) to get only what has changed, then re-audit just those topics instead of the whole spec. Omit `since` to get the most recent entries. The spec is hand-curated and typed (added/changed/status/removed), so this is a precise signal, not a raw timestamp diff. The same history is published as an RSS feed at https://specification.website/changelog/rss.xml for out-of-band polling. A sensible re-check cadence is monthly, or whenever you start a fresh audit.',
    annotations: { ...READ_ONLY_ANNOTATIONS, title: 'Get spec changes since a date' },
    inputSchema: {
      type: 'object',
      properties: {
        since: {
          type: 'string',
          description:
            'Return only changes on or after this date (ISO `YYYY-MM-DD`; longer ISO datetimes are accepted and truncated to the day). Typically the date of your last audit. Omit to get the most recent changes regardless of date. Example: `2026-05-01`.',
        },
        type: {
          type: 'string',
          enum: CHANGE_TYPE_ENUM,
          description:
            'Filter to one kind of change. `added` = a new spec page or category. `status` = a topic promoted or downgraded between tiers. `changed` = a substantive rewrite of an existing page. `removed` = a page that was live and has been deleted. Omit to include all four kinds.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description:
            'Maximum number of change entries to return, newest first. Defaults to 20 when `since` is omitted, or up to 100 within a `since` window; clamped to 1–100.',
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        since: {
          type: ['string', 'null'],
          description: 'The `since` date that was applied (truncated to YYYY-MM-DD), or null.',
        },
        type: {
          type: ['string', 'null'],
          enum: [...CHANGE_TYPE_ENUM, null],
          description: 'The `type` filter that was applied, or null.',
        },
        count: { type: 'integer', description: 'Number of change entries returned.' },
        latest: {
          type: ['string', 'null'],
          description:
            'Date of the most recent change in the whole spec (independent of filters). Store this and pass it back as `since` next time.',
        },
        changes: {
          type: 'array',
          description: 'Matching change entries, newest first.',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'ISO `YYYY-MM-DD` date of the change.' },
              type: {
                type: 'string',
                enum: CHANGE_TYPE_ENUM,
                description: 'Kind of change: added, changed, status, or removed.',
              },
              title: { type: 'string', description: 'Headline of the change entry.' },
              summary: { type: 'string', description: 'One-to-three-sentence description of the change.' },
              topics: {
                type: 'array',
                description: 'Current spec topics this change affects — re-audit these.',
                items: {
                  type: 'object',
                  properties: TOPIC_REF_PROPERTIES,
                  required: ['slug', 'title', 'status', 'category', 'url'],
                },
              },
              unresolvedSlugs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Slugs named by the entry that are no longer live pages (e.g. removed topics).',
              },
            },
            required: ['date', 'type', 'title', 'summary', 'topics', 'unresolvedSlugs'],
          },
        },
      },
      required: ['since', 'type', 'count', 'latest', 'changes'],
    },
  },
];

export const PROMPTS = [
  {
    name: 'audit_url',
    description:
      'Generate an audit plan for a target URL against this spec. With no `focus`, the plan covers required-tier items only (the platform-contract baseline, ~35 items). Pass `focus` to audit a single category at recommended + optional depth (capped at 40 items).',
    arguments: [
      { name: 'url', description: 'The website URL to audit.', required: true },
      {
        name: 'focus',
        description:
          'Optional category to focus on (foundations, seo, accessibility, security, well-known, agent-readiness, performance, privacy, resilience, i18n). If omitted, the plan defaults to required-tier items across all categories.',
        required: false,
      },
    ],
  },
];

export function buildAuditPrompt(m: Manifest, url: string, focus?: string) {
  const pages = focus
    ? m.pages.filter((p) => p.category === focus && p.status !== 'avoid')
    : m.pages.filter((p) => p.status === 'required');
  const items = pages.slice(0, 40);
  const focusLine = focus
    ? `the **${focus}** category`
    : `every **required** item across the spec`;
  const messages = [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text:
          `You are auditing the website ${url} against The Website Specification ` +
          `(https://specification.website). Focus on ${focusLine}. ` +
          `For each item below, decide PASS / FAIL / UNCLEAR by fetching the page (and headers) ` +
          `and citing the evidence. Where multiple items overlap, group them. ` +
          `Use the get_topic tool to load any page's full guidance before judging.\n\n` +
          items
            .map((p) => `- **${p.title}** (${p.status}) — ${p.summary}\n  Reference: ${p.url}`)
            .join('\n') +
          `\n\nFor each FAIL, recommend the minimal change with a code snippet where possible.`,
      },
    },
  ];
  return {
    description: `Audit plan for ${url}${focus ? ' (' + focus + ')' : ''}.`,
    messages,
  };
}
