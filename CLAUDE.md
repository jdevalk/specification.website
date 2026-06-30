# CLAUDE.md — repo guidance for AI agents (and humans skimming)

This file is read by Claude Code (and any other agent that respects the convention) before it works on this repo. Keep it short, accurate, and updated alongside the code it describes.

## What this project is

`specification.website` — a platform-agnostic specification of what a good website does. Static Astro site, deployed to Cloudflare Pages from this repository's `main` branch. MIT licensed (code) / CC BY 4.0 (content).

Live: <https://specification.website> and <https://specification-website.pages.dev>.

## Top-level rule: everything is derived from the content collection

The whole site is generated from one source of truth: Markdown files under `src/content/spec/<category>/<slug>.md`, with the schema in `src/content.config.ts` and the category list in `src/lib/site.ts`.

**When you add, remove, or change a spec page, the following surfaces update automatically on the next build. Do not hand-edit any of them:**

- `/checklist/` — every spec entry, grouped by category, tickable. Built by `src/pages/checklist.astro` from `getCollection('spec')`.
- `/spec/` (index) and `/spec/<category>/` (category indexes). Same source.
- `/spec/<category>/<slug>/` — the HTML page. Built by `src/pages/spec/[category]/[slug].astro`.
- `/spec/<category>/<slug>.md` — the raw Markdown endpoint with YAML frontmatter. Built by `src/pages/spec/[category]/[slug].md.ts`.
- `/llms.txt` and `/llms-full.txt` — the agent-facing indexes. Built by `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts`.
- `/okf/` — the Open Knowledge Format bundle: one Markdown concept per spec page (`okf/<category>/<slug>.md`), a `references/` concept per distinct cited source, per-directory `index.md`, a `log.md` from the changelog, and a root `index.md` carrying `okf_version`. Built by `src/lib/okf.ts` + the endpoints under `src/pages/okf/`; packaged into `/okf.tar.gz` by the `astro-okf-tarball.mjs` integration (hand-rolled ustar writer, no tar dependency) in `astro:build:done`. Advertised in `/llms.txt`, the api-catalog Linkset, and the AI Catalog. **Do not hand-edit the bundle.**
- `/sitemap-index.xml` — built by `@astrojs/sitemap`.
- `/rss.xml` — built by `src/pages/rss.xml.ts`.
- The Pagefind search index — built by `pagefind --site dist` in the `build` script. Powers the `/search/` page and the global ⌘K overlay.

**If you find yourself editing the checklist by hand, you are doing it wrong.** Edit the spec entry's front matter (`status`, `summary`, `title`) and rebuild.

## Status discipline

The status field is the user-facing contract. Use it precisely.

- **`required`** — the web platform contract breaks, or a clear class of users is harmed, without it. Examples: `<title>`, `<meta charset>`, HTTPS, image alt text, custom 404 returning 404.
- **`recommended`** — a modern site should do it. Examples: CSP, HSTS, structured data, Open Graph, security.txt, /llms.txt.
- **`optional`** — depends on context. Examples: image sitemaps, OpenID Configuration, IDN support.
- **`avoid`** — outdated, harmful, or superseded by a working alternative. Examples: soft-404, empty links/buttons.

When in doubt, default to `recommended`, not `required`. The bar for `required` is "the platform breaks without it", not "we strongly suggest it".

## Changelog

`/changelog/` is the human-readable history of the spec. Unlike the checklist or llms.txt, it is **not derived** — it is a hand-curated content collection (`src/content/changelog/<date>-<slug>.md`, schema in `src/content.config.ts`). The page (`src/pages/changelog.astro`) renders entries newest-first, grouped by month. Each entry has `title`, `date` (ISO `YYYY-MM-DD`), a `type` (`added` | `changed` | `status` | `removed`), optional `relatedSlugs`, and a one-to-three-sentence body. A dedicated RSS feed is **derived** from the collection at `/changelog/rss.xml` (`src/pages/changelog/rss.xml.ts`, advertised in `_headers`, the api-catalog, and the page's `<head>`); the `<li>` anchor ids match the feed's `#`-links, so don't change one without the other.

**The changelog is about the spec's content — pages, not plumbing.** Whenever you make a larger change to what the spec _says_, propose a changelog entry in the same PR:

- **`added`** — one or more new spec pages, or a new category.
- **`removed`** — a spec page (or matching `/.well-known/` asset) that was actually live and has now been deleted, e.g. because the convention turned out defunct.
- **`status`** — a promotion or downgrade of a topic's status.
- **`changed`** — a substantive rewrite of an existing page worth surfacing.

**Always link to the page(s) inline.** An "added a page on X" entry must link X to its `/spec/<category>/<slug>/` URL _in the sentence_ — never trail off with a link to the `/spec/` index. List every page added, each linked.

Do **not** log: typo fixes, refactors, CI/tooling, dependency bumps, OG tweaks, new analytics events, header changes, or any site behaviour invisible on a spec page. Use real dates (British English in the body) and keep each entry to one-to-three sentences.

**When you are unsure whether a change warrants an entry, ask the user — do not silently skip it.** The clear-cut cases decide themselves (a new page always gets one; a typo fix never does). For anything in between — a partial rewrite, a citation overhaul, a reworded summary, a status nuance that isn't a full promotion/downgrade — surface it: _"This change to X is borderline for the changelog — log it as a `changed` entry, or leave it out?"_ and let them call it.

## Cardinal rules for content

These mirror `CONTRIBUTING.md`. Enforce them in your own writing and when reviewing.

1. **Cite primary sources.** Every spec page needs 2–4 sources in front matter, weighted toward standards bodies: WHATWG, W3C, IETF RFCs, IANA, WCAG, schema.org, sitemaps.org, llmstxt.org. Then MDN / web.dev / Google Search Central for practical context. Avoid blog posts and vendor marketing. For any MDN link or browser-support claim, resolve it through the **MDN MCP server** (`https://mcp.mdn.mozilla.net/`, free, no auth) — it returns the current canonical URL (MDN reorganises its reference tree, so hard-coded deep links rot) and Baseline / BCD support data. MDN stays a context source; lead the citation with the standard.
2. **Stay platform-agnostic.** Describe outcomes, not implementations. "Set `Content-Security-Policy`" is in scope. "Add this to your `next.config.mjs`" is not. Link out to platform docs instead.
3. **Be honest about status.** If something is shipping as `required` but the platform works without it, downgrade to `recommended`. If the source URL is dead, replace it (Wayback Machine is acceptable) or remove the citation.
4. **British English.** "colour", "behaviour", "internationalisation", "licence" (noun).
5. **Section structure.** `## What it is`, `## Why it matters`, `## How to implement`, `## Common mistakes`, `## Verification`. Last two are optional if they would not add value.
6. **Length.** 250–500 words of body content. Be useful, not padded.
7. **Inline cross-links must carry the right category.** A spec page's URL is `/spec/<category>/<slug>/`, and the category is the directory the `.md` lives in — _not_ always the category of the page you're linking from. When you hand-write an inline link to another spec page, confirm its directory (`ls src/content/spec/*/<slug>.md`) before writing the path; do not assume the target shares the current page's category. (`relatedSlugs` is safe — the route resolver looks up each slug's real category — but raw Markdown links are not checked at authoring time, only by the **Internal links** CI job, which 404s on a wrong-category path.)

## Architecture quick reference

| Path                                                                          | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/spec/<cat>/<slug>.md`                                            | Spec content. Edit here.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/content.config.ts`                                                       | Content collection schema. Edit if adding a field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/lib/site.ts`                                                             | Site metadata + the canonical category list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/layouts/BaseLayout.astro`                                                | HTML shell, head, dialog for ⌘K search, Plausible (PROD only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/layouts/SpecLayout.astro`                                                | Spec page wrapper; emits TechArticle + BreadcrumbList JSON-LD; advertises Markdown alt via `markdownUrl`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `src/components/HeadMeta.astro`                                               | `<head>` metadata, canonical, OG, Twitter, JSON-LD, RSS / sitemap / markdown alternates.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/components/SiteHeader.astro`                                             | Header nav. Contains the ⌘K trigger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `src/components/SiteFooter.astro`                                             | Footer. Privacy / search links live here.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `src/pages/spec/[category]/[slug].astro`                                      | The dynamic HTML route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/pages/spec/[category]/[slug].md.ts`                                      | The dynamic Markdown route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`, `src/pages/rss.xml.ts` | Derived endpoints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/lib/okf.ts`, `src/pages/okf/`                                            | OKF bundle generator + the `.md` endpoints that emit the `/okf/` tree (concepts, per-directory `index.md`, `references/`, `log.md`, root `index.md`). Derived from the `spec` + `changelog` collections.                                                                                                                                                                                                                                                                                                                                            |
| `astro-okf-tarball.mjs` (root)                                                | Astro integration; in `astro:build:done` it walks `dist/okf/`, writes a reproducible POSIX ustar archive by hand (no tar dependency), gzips it to `dist/okf.tar.gz`.                                                                                                                                                                                                                                                                                                                                                                                |
| `functions/_middleware.ts`                                                    | Cloudflare Pages middleware. Does `Accept: text/markdown` content negotiation on canonical spec URLs and on `/`, and calls `logBot()` so crawler hits land in the `AGENT_LOG` Analytics Engine dataset.                                                                                                                                                                                                                                                                                                                                             |
| `functions/_shared/bot-detect.ts`                                             | UA / `signature-agent` / `cf-verified` / `Accept: text/markdown` detection plus `writeDataPoint()` to the `AGENT_LOG` Analytics Engine binding. Never throws.                                                                                                                                                                                                                                                                                                                                                                                       |
| `functions/reports.ts`                                                        | `/reports` collector for the W3C Reporting API. Browsers POST CSP/COOP/COEP violation, deprecation, intervention, and crash reports here (named by the `Reporting-Endpoints` header in `_headers`); writes one aggregate row per report to the `REPORT_LOG` Analytics Engine dataset (`sw_report_log`). Deprecation/intervention reports triggered by third-party (browser-extension) scripts are dropped — only same-origin `sourceFile`s are recorded. POST-only, never throws, returns 204; stores no IP, no cookies, no URL query strings.      |
| `functions/admin/stats.ts`                                                    | `/admin/stats` dashboard. Queries `sw_agent_log` (crawlers), `sw_mcp_log` (MCP/A2A), and `sw_report_log` (browser policy reports) via the Cloudflare Analytics Engine SQL API using `CF_ACCOUNT_ID` + `CF_ANALYTICS_TOKEN` Pages secrets. **Behind Cloudflare Access** — the function assumes the caller is already authenticated.                                                                                                                                                                                                                  |
| `public/admin-stats.js`                                                       | Tab + filter JS for `/admin/stats`. Extracted to a file because the CSP forbids inline scripts.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `public/_routes.json`                                                         | Cloudflare Pages routing manifest — excludes static assets from the Functions worker so bot logging only runs on HTML and well-known paths.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `wrangler.toml` (root)                                                        | Pages bindings — the `AGENT_LOG` (`sw_agent_log`) and `REPORT_LOG` (`sw_report_log`) Analytics Engine datasets. Pages itself is deployed via the Pages dashboard's Git integration.                                                                                                                                                                                                                                                                                                                                                                 |
| `public/_headers`                                                             | Cloudflare response headers — strict CSP, HSTS, Permissions-Policy, Vary on .md, content types for well-known files, the discovery `Link` header.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `public/.well-known/`                                                         | Static well-known URIs (security.txt, change-password, api-catalog, mcp/server-card.json, agent-card.json for A2A discovery, agent-skills/index.json + agent-skills/<name>/SKILL.md per the Agent Skills Discovery RFC v0.2.0 — if you edit a SKILL.md, recompute its sha256 and update the `digest` in index.json; ai-catalog.json is the ARD AI Catalog whose `host.trustManifest` carries a detached ES256 JWS — **if you edit ai-catalog.json, re-run `npm run sign:ard` or the signature breaks** — with jwks.json publishing the public key). |
| `mcp/`                                                                        | Cloudflare Worker exposing the spec at `mcp.specification.website`. Serves the MCP transport at `/mcp`, an A2A (Agent-to-Agent) JSON-RPC endpoint at `/a2a/v1`, and mirrors both discovery cards under `/.well-known/`. Has its own `package.json`, `wrangler.toml`, build script. Reads from the same `src/content/spec/` source of truth at build time. Logs each call to the `MCP_LOG` Analytics Engine dataset (`sw_mcp_log`).                                                                                                                  |
| `public/search-overlay.js`                                                    | ⌘K overlay logic. CSP-safe (no inline JS).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `public/search-init.js`                                                       | `/search/` page Pagefind initialiser. CSP-safe.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `scripts/generate-assets.mjs`                                                 | Generates icons + OG image from inline SVGs via `sharp`. Wired through `prebuild`/`predev`.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `scripts/sign-ard-catalog.mjs`                                                | Signs `public/.well-known/ai-catalog.json`'s `host.trustManifest` with a detached ES256 JWS (offline; key in gitignored `.ard-signing-key.json`). `npm run sign:ard` re-signs, `npm run check:ard` verifies. Re-run after any edit to ai-catalog.json.                                                                                                                                                                                                                                                                                              |

## Commands

```
npm run dev      # http://localhost:31337
npm run build    # astro build && pagefind --site dist
npm run preview  # serve dist on 31337
npm run check    # astro check
npm run lint     # eslint .
npm run format:check  # prettier --check .
npm run assets   # regenerate icons + OG image
```

`predev` and `prebuild` run `scripts/generate-assets.mjs` automatically.

**Pre-commit gate.** A tracked git hook at `.githooks/pre-commit` runs `npm run lint` and `npm run format:check` on every `git commit`; `core.hooksPath` is pointed at `.githooks/` by the `prepare` script on `npm install` (no husky). The same two checks run in CI (`ci.yml`). Run them before committing so the hook passes; `prettier --write .` fixes formatting. Bypass only in a genuine emergency with `git commit --no-verify`.

## Workflow when adding or changing a spec page

1. Copy an existing entry in `src/content/spec/<category>/`.
2. Update the front matter: `title`, `slug`, `summary`, `status`, `order`, `relatedSlugs`, `sources`, `updated`.
3. Write the body using the canonical section structure.
4. Run `npm run dev` and open the page on port 31337.
5. Verify: it appears on `/spec/`, on `/spec/<category>/`, on `/checklist/`, in `/llms.txt`, in `/sitemap-index.xml`, and is served at `.md` with frontmatter.
6. **Add a changelog entry.** The `src/content/changelog/` collection is **not derived** — it is hand-authored (see the [Changelog](#) paragraph above). Create `src/content/changelog/<YYYY-MM-DD>-<slug>.md` with `title`, `date`, `type` (`added` for a new page), optional `relatedSlugs`, and a one-to-three-sentence body linking the new page. Skipping this is the easiest step to forget — the page ships but never shows up in `/changelog/` or its RSS feed.
7. **Regenerate and commit the OG images.** Per-page OG images are **tracked in git**, not built fresh on deploy — `scripts/generate-assets.mjs` writes them under `public/og/`. Run `npm run assets`, then **stage the new `public/og/spec/<category>/<slug>.png`** plus the handful of count-driven images the new page bumps (`public/og-default.png`, `public/og/checklist.png`, `public/og/spec.png`, and the category image `public/og/spec/<category>.png`). The generator is deterministic, so unrelated images stay byte-identical and won't show as changed. **A spec page committed without its OG image is a bug** — every page must have one (`public/og/spec/<category>/<slug>.png`).
8. **Keep the Agent Skill in sync.** `public/.well-known/agent-skills/specification-website/SKILL.md` is hand-maintained (not derived) — it is the canonical "how to use this spec" doc for agents. On any change that affects it, update it: the page count on line 8 when you add/remove pages (`ls src/content/spec/**/*.md | wc -l`), the category list/examples when categories change, the tool table when MCP tools change, the status descriptions when the bar moves. Then **recompute its sha256 and update the `digest` in `agent-skills/index.json`** (`shasum -a 256 …/SKILL.md`) — the digest must match or discovery clients reject the file.
9. Commit — stage **the spec `.md`, the changelog entry, and the OG images together** (PRs that commit only the Markdown leave the page without an OG image and without a changelog entry). Push to `main`. Cloudflare Pages auto-deploys.
10. **The MCP Worker redeploys itself.** Pages auto-deploy doesn't touch the Worker, but the `Deploy MCP` GitHub Action (`.github/workflows/deploy-mcp.yml`) does: any push to `main` touching `src/content/spec/**`, `src/content/changelog/**`, or `mcp/**` runs `npm run deploy` (the predeploy hook regenerates `mcp/src/data.json` — what `search` / `list_topics` / `get_topic` / `get_checklist` read from — then `wrangler deploy`). So a normal spec-page commit redeploys the Worker on its own; you don't need to run anything. Manual fallback if the Action is broken or you're deploying out-of-band: `cd mcp && npm run deploy`.

**Do not** also edit `/checklist/`, `/llms.txt`, or any other derived surface. They will rebuild.

## When the site itself gains a capability, ship the spec page too

The site is a _worked example_ of the spec, not just documentation that lives next to it. Divergence between what we ship and what we recommend is a bug. Whenever you implement a new capability on the site that fits a spec topic, the same PR has to make the spec match.

Trigger this rule when you ship any of:

- a new HTTP response header (CSP directive, `Link` rel, `Vary`, custom security header);
- a new `/.well-known/` file (`security.txt`, `api-catalog`, `mcp/server-card.json`, `agent-skills/...`);
- a new agent-discovery surface (MCP server, agent skills, DNS-AID records, server card, Linkset entry);
- a new content endpoint (`.md` mirror, JSON API, RSS, JSON Feed, alternate format);
- a new accessibility, performance, privacy, SEO, or i18n behaviour worth recommending elsewhere.

The same PR must do **one** of:

1. **Add a new spec page** under `src/content/spec/<category>/` documenting the underlying standard or convention. Cite primary sources (IETF, W3C, WHATWG, MDN — see [Cardinal rules](#cardinal-rules-for-content)). Pick a status honestly: `required` only if the platform contract breaks without it, otherwise `recommended` or `optional`. Add a one-line "this site ships it; see [X]" callout pointing at our implementation or asset.
2. **Update an existing spec page** to incorporate the new convention, add the new sources, or add the worked-example callout. Bump `updated`. Add the new page (or new section) to `relatedSlugs` on adjacent topics so the cross-graph stays correct.

Also update the [api-catalog Linkset](public/.well-known/api-catalog) if the capability adds a discoverable resource, and the global `Link` header in [`public/_headers`](public/_headers) if it has a registered IANA `rel`. Both should match what the new spec page describes.

The reverse holds too: **do not promote a convention to spec status without us shipping a working implementation first.** The site is the proof-of-feasibility. If the underlying convention turns out non-existent or defunct (see the `/.well-known/ai.txt` deletion history), remove the asset _and_ the spec page in the same PR — don't leave the page documenting something we no longer ship.

## When changing a status

1. Edit the `status` field on the spec entry.
2. Rebuild — the badge changes on the spec page, the category page, the checklist, and the llms.txt summary all at once.
3. If you are _downgrading_ or removing something because the underlying convention turned out non-existent or defunct (the spec's job is to be honest about this — see the deleted `/.well-known/ai.txt` history), also delete any matching asset under `public/`, any cross-references in other spec pages' `relatedSlugs`, and update `CLAUDE.md` if the change is structural.

## Things this site does that you should not break

- **No cookies.** Plausible is the only analytics. It is cookieless and only loaded in `import.meta.env.PROD`. Don't add anything that sets cookies.
- **No third-party scripts other than Plausible.** Anything new requires a CSP update in `public/_headers` and a privacy-policy update in `src/pages/privacy.astro`.
- **No inline `<script>` content** without a corresponding CSP allowance. The site relies on a strict CSP with no `'unsafe-inline'` on `script-src`. Put init logic in a file under `public/` and reference it.
- **Content-Type discipline on well-known files and `/spec/*.md`.** Maintained in `public/_headers`.
- **The `Vary: Accept` header on spec pages.** Set by `functions/_middleware.ts`. Removing it breaks downstream caches serving HTML when an agent asks for Markdown.

## Deployment

- `main` → Cloudflare Pages, auto-deployed via the Pages dashboard's Git integration. No GitHub Actions deploy workflow (`ci.yml` only runs type-check + build verification).
- Custom domain for the site: `specification.website` (configure in the Cloudflare Pages dashboard).
- Functions live in `/functions/` and ship alongside static assets. The Cloudflare build picks them up automatically.
- The **MCP server** in `/mcp/` is a separate Cloudflare Worker. It registers `mcp.specification.website` as a custom domain on first deploy. It is **redeployed automatically** by the `Deploy MCP` GitHub Action whenever a push to `main` touches `src/content/spec/**`, `src/content/changelog/**`, or `mcp/**`, so its bundled data stays in sync (the predeploy hook regenerates `mcp/src/data.json`). The Action authenticates with the `CLOUDFLARE_API_TOKEN` repo secret (Workers Scripts: Edit). Manual fallback: `cd mcp && npm run deploy`.

## Automation

- A scheduled agent runs a **daily standards scan** — it sweeps the standards bodies this spec cites for new topics, status changes, and dead/stale citations, then opens draft PRs and DMs a Slack summary. Its full, binding instructions live in [`ops/routines/daily-standards-scan.md`](ops/routines/daily-standards-scan.md), which is the single source of truth: the routine reads that file each run, so **edit the file (not the routine prompt) to change what the scan does**, then commit to `main`.

## Admin stats dashboard

`/admin/stats` is a server-rendered dashboard for crawler traffic (`sw_agent_log`) and MCP / A2A usage (`sw_mcp_log`). It is **gated by Cloudflare Access**; the function itself does no auth and trusts the edge.

Three writers, all Cloudflare Analytics Engine:

- `functions/_shared/bot-detect.ts` writes a row per bot/agent request via the `AGENT_LOG` binding declared in the root `wrangler.toml`. See `BOT_UA_MATCHERS` for the crawler list — when a new high-profile AI / LLM / search bot ships, add its UA pattern there.
- `functions/reports.ts` writes a row per browser policy report via the `REPORT_LOG` binding (root `wrangler.toml`). Browsers POST these to `/reports`, named by the `Reporting-Endpoints` header in `public/_headers`; the report `type` is the AE index.
- `mcp/src/index.ts` writes a row per MCP / A2A call via the `MCP_LOG` binding declared in `mcp/wrangler.toml`. The two surfaces (`remote`, `a2a`) are tagged in `blob10`.

The dashboard reads all three datasets via the [Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) using two Pages secrets:

- `CF_ACCOUNT_ID` — the account that owns the project (`c53e64d218c83cb220b523a637ffd079`).
- `CF_ANALYTICS_TOKEN` — an API token with **Account → Account Analytics → Read** scoped to that account. Create at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) and add both as Pages → Settings → Variables and Secrets (Production + Preview).

A "table not found" error from a query is expected until the matching dataset has received its first write. Datasets are account-scoped, so the same SQL token reads from both the Pages-written `sw_agent_log` and the Worker-written `sw_mcp_log`.

Conventions when extending it:

- Keep the dashboard CSP-safe — interaction JS lives in `public/admin-stats.js`, not inline.
- Never break a request because logging failed — both `logBot()` and `logMcpCall()` wrap everything in try/catch and return silently.
- Bot detection runs before content negotiation in `functions/_middleware.ts`; don't reorder.
- `public/_routes.json` excludes static assets so the Functions worker (and the logger) only runs on HTML and well-known paths. When you add a new top-level static asset path, add it there too.

## Privacy stance

The site collects aggregate Plausible analytics (no cookies, no IP storage, EU-hosted) for visitors, and aggregate Cloudflare Analytics Engine logs for crawlers, MCP/A2A clients, and browser policy reports via the Reporting API (UA, country, path, tool name, report type/directive; no cookies, no IP storage). Documented in `src/pages/privacy.astro`. If you add anything that collects data, update that page truthfully _in the same PR_.
