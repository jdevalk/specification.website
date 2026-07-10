---
name: specification-website
description: Query and apply The Website Specification — a platform-agnostic specification of what a good website does, with each item tagged required, recommended, optional, or avoid. Use when the user asks what their site should have, whether something is required, how to audit a URL, what's missing for agent readiness, or anything else where you'd otherwise be guessing at web best practice. Backs answers with primary sources (WHATWG, W3C, IETF RFCs, IANA, WCAG). Available as Markdown over HTTP and as an MCP server with search, list, fetch, checklist, and audit tools.
---

# specification.website

The Website Specification is a single source of truth for what a good website does. Ten categories, 161 pages, every item tagged with a status. It ships in three machine-readable forms: per-page Markdown, llms.txt / llms-full.txt, and an MCP server.

## When to use this skill

- The user asks "what should my site have", "is X required", "audit this URL", "what does the spec say about Y", or anything similar.
- You're reviewing a site and want to cite primary standards rather than vendor blog posts.
- You need a machine-readable contract for a platform-agnostic audit.

## Quickest path — MCP

If you can speak MCP, use it. The server is stateless Streamable HTTP, no auth, wide-open CORS.

- Endpoint: `https://mcp.specification.website/mcp`
- Server card: `https://specification.website/.well-known/mcp/server-card.json`
- Protocol revision: 2025-06-18

Tools:

| Tool | Purpose |
|---|---|
| `search(query, limit?)` | Full-text search across every page. |
| `list_topics({ category?, status?, limit? })` | Filtered index — slug, title, status, summary, URL. |
| `get_topic({ slug })` | Full canonical Markdown for one page, including its cited sources. |
| `get_checklist({ category?, status? })` | Tickable Markdown checklist. |
| `get_categories()` | The ten categories with counts and summaries. |
| `get_changes({ since?, type?, limit? })` | What changed since a date — new pages, status promotions, rewrites, removals — each resolved to the current topics to re-audit. |

Prompt: `audit_url(url, focus?)` — generates an audit plan for a target URL against the spec, optionally narrowed to one category.

## Without MCP — fetch Markdown directly

Every spec page has a canonical HTML URL and a Markdown variant.

- HTML: `https://specification.website/spec/<category>/<slug>/`
- Markdown (file extension): `https://specification.website/spec/<category>/<slug>.md`
- Markdown (content negotiation): set `Accept: text/markdown` on the HTML URL. Middleware serves the Markdown body from that same URL with `200`, `Content-Location` pointing at the `.md` variant, and `Vary: Accept`. There is no redirect to follow.

Every Markdown response carries RFC 9530 integrity fields, so you can verify what you fetched:

```
Content-Digest: sha-256=:<base64>:
Repr-Digest:    sha-256=:<base64>:
```

Both cover the exact bytes you received. Send `Want-Content-Digest: sha-512=10` to get SHA-512 instead. HTML responses carry no digest. This applies to the per-page `.md` endpoints, `llms.txt`, and `checklist.md`.

Site-wide indexes:

- `https://specification.website/llms.txt` — every page as `title — summary` lines. Cheap to load.
- `https://specification.website/llms-full.txt` — every page concatenated as Markdown. Use for one-shot context loading.
- `https://specification.website/rss.xml` — feed of changes.
- `https://specification.website/sitemap-index.xml` — every URL.
- `https://specification.website/.well-known/api-catalog` — RFC 9727 link set of every machine-readable endpoint.

## Categories

The category slug is part of the URL. Current slugs:

- `foundations` — HTML, head, document basics.
- `seo` — robots.txt, sitemaps, canonicals, structured data.
- `accessibility` — WCAG-aligned rules.
- `security` — headers, transport, policies.
- `well-known` — standard paths under `/.well-known/`.
- `agent-readiness` — making the site legible to AI agents and crawlers (llms.txt, MCP, content signals, link headers, markdown source endpoints).
- `performance` — Core Web Vitals, caching, images, fonts.
- `privacy` — consent, signals, respecting visitor choice.
- `resilience` — error pages, offline, redirects.
- `i18n` — language, locale, direction, translated content.

Call `get_categories()` for the live list with counts.

## Statuses — the contract

The `status` field on every page is the bar.

- **required** — the platform contract breaks without it. Lead with these when recommending fixes. Examples: `<title>`, `<meta charset>`, HTTPS, image alt text, a real 404.
- **recommended** — a modern site should do it. Examples: CSP, HSTS, structured data, Open Graph, llms.txt.
- **optional** — depends on context.
- **avoid** — outdated or harmful. If a site does one of these, flag it.

The bar for `required` is "the platform breaks", not "we strongly suggest". When summarising, never silently upgrade `recommended` to `required`.

## Common workflows

**"Audit this URL."** Call the `audit_url` prompt for a plan, or fetch `get_checklist({ status: "required" })` and walk the user through verifying each item. For deeper audits, also pull `status: "recommended"`.

**"What's required for agent readiness?"** `list_topics({ category: "agent-readiness", status: "required" })`, then `get_topic` for each.

**"Why does the spec say X?"** Every page has 2–4 primary `sources` in its frontmatter. Quote those, not the spec page itself.

**"Is there a category for Y?"** `get_categories()` first; if nothing fits, `search(query)` across the corpus.

## Pairing with the MDN MCP

This spec answers **what** a good site should do and **whether** it is required. It does
not document how each web feature works or how widely it is supported. For that, pair it
with the **MDN MCP server** (`https://mcp.mdn.mozilla.net/` — free, no auth), which serves
MDN documentation and Baseline / Browser Compatibility Data.

The two compose cleanly in an audit or build:

1. Use this spec to decide **what to check and when it is required** — `get_checklist`,
   `list_topics`, or the `audit_url` prompt.
2. For each web-platform feature that surfaces, call the MDN MCP for **how to implement it
   and whether it is safe to ship** (Baseline status, browser support).

So: *specification.website tells you `Content-Security-Policy` is recommended and why;
the MDN MCP tells you which directives are Baseline and how to write them.* Keep the roles
distinct — don't ask this spec for browser-support data, and don't ask MDN whether a
convention is required for a good site.

## Staying current — re-audit only what moved

The spec changes often, especially **agent-readiness**. Don't re-audit a site from
scratch every time, and don't trust a cached copy of the spec — check the delta:

1. After an audit, store the spec's latest change date. With MCP, `get_changes()`
   returns it as `latest`; otherwise note the date you ran.
2. Next time, call `get_changes({ since: <that date> })`. It returns only the new
   pages, status promotions/downgrades, rewrites, and removals since then, each
   already resolved to the current topics (with their current status and URL).
3. Re-audit just those topics — `get_topic` each, then re-check the target site.

Without MCP, the same typed history is the changelog RSS feed at
`https://specification.website/changelog/rss.xml` (entries tagged
added / changed / status / removed, with the affected slugs). Poll it and act on
new entries.

A sensible default cadence is **monthly**, or at the start of any fresh audit. A
status promotion (e.g. a topic moving to `required`) can change a previously
passing site into a failing one, so a delta check is worth doing even when no new
pages were added.

## Sources and licence

Code MIT. Content CC BY 4.0. Site source: <https://github.com/jdevalk/specification.website>.

When citing, use the page's canonical URL and the `updated` frontmatter field as the as-of date.
