# OKF bundle + ARD discovery — Phase 0 recon

Recon for the "publish the spec as an OKF bundle, fix discovery via ARD" plan.
No source files were changed to produce this. Read this before Phase 1.

> **Point-in-time document.** Its ARD signing observations no longer describe the
> site: the `trustManifest` signature, `scripts/sign-ard-catalog.mjs`, and
> `jwks.json` were removed on 31 July 2026 because the verifying key shared an
> origin with the catalogue it signed. See `ops/notes/ard-adoption.md`.

## State reconciliation (what the plan assumed vs. what is already shipped)

| Plan phase                                   | Status today                 | Notes                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phase 1 — OKF bundle generator               | **Not started**              | No `/okf/` tree, no generator.                                                                                                                                                                                                                                                                                                                                                             |
| Phase 2 — package + serve + llms.txt pointer | **Not started**              | No `/okf.tar.gz`, no `## Structured exports` in `llms.txt`.                                                                                                                                                                                                                                                                                                                                |
| Phase 3 — ARD `ai-catalog.json`              | **Already shipped & signed** | `public/.well-known/ai-catalog.json` exists, served at the well-known path with CORS + `application/ai-catalog+json`, host `trustManifest` signed with a detached ES256 JWS (`scripts/sign-ard-catalog.mjs`, public key at `jwks.json`). Advertised via `Link` header, robots, DNS. **But it advertises only 2 entries (MCP server, A2A agent) — not the Agent Skill, not an OKF bundle.** |
| Phase 4 — dogfood spec pages                 | **Half done**                | The ARD / `ai-catalog.json` topic already exists: `src/content/spec/agent-readiness/agentic-resource-discovery.md` (status `optional`). The **OKF bundle** spec page does _not_ exist yet.                                                                                                                                                                                                 |
| Phase 5 — propose media type                 | Not started (optional).      |

**Topic count is 143, not ~141.** Per-category: foundations 14, seo 14, accessibility 23,
security 15, well-known 10, agent-readiness 19, performance 23, privacy 6, resilience 6, i18n 13.

## Content collection → OKF field mapping

Schema: `src/content.config.ts`. Every topic frontmatter has: `title`, `slug?`, `category`
(enum of the 10), `summary`, `status` (`required|recommended|optional|avoid`), `appliesTo[]`,
`relatedSlugs[]`, `sources[]` (`{title, url, publisher?}`), `order`, `draft`, `updated` (ISO).
**All 143 topics carry `updated`** — usable directly as the OKF `timestamp` (no git calls needed).

| OKF concept field (§4)         | Source                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `type` (required)              | constant `Check` for topics, `Reference` for mirrored standards                                      |
| `title`                        | `data.title`                                                                                         |
| `description`                  | `data.summary`                                                                                       |
| `resource`                     | canonical URL `https://specification.website/spec/<category>/<slug>/`                                |
| `tags`                         | `[category, status, ...appliesTo]`                                                                   |
| `timestamp`                    | `data.updated` (ISO 8601)                                                                            |
| `category` (producer key)      | `data.category`                                                                                      |
| `conformance` (producer key)   | derived from `data.status` (`required`→MUST, `recommended`→SHOULD, `optional`→MAY, `avoid`→MUST NOT) |
| `standard` (producer key)      | bundle-relative link to the primary source's `references/` concept                                   |
| `last_verified` (producer key) | `data.updated`                                                                                       |

Body reuses the same Markdown the `.md` negotiation already emits
(`src/pages/spec/[category]/[slug].md.ts` is the reference implementation), plus an appended
`# Citations` block (OKF §8: `[n] [Title](url)`).

## OKF spec rules confirmed (from SPEC.md)

- **Conformance §9:** every non-reserved `.md` needs parseable YAML frontmatter with a **non-empty `type`**. Consumers must not reject on unknown types/keys/broken links. `type` values are not centrally registered — `Check`/`Reference` are fine.
- **Index §6 / §11:** `index.md` files carry **no frontmatter**, except the bundle-root `index.md`, which **may** carry `okf_version: "0.1"` (the one permitted exception). Body is `* [Title](url) - description` lists under headings.
- **Log §7:** `log.md`, date-grouped `## YYYY-MM-DD` newest first, prose with conventional bold lead words (`**Update**`, `**Creation**`). Maps onto our `/changelog/` collection.
- **Citations §8:** `# Citations` heading, `[n] [Title](url)`. Links may be absolute, bundle-relative, or into `references/`. A `references/` dir mirroring external standards as first-class `Reference` concepts is permitted but has no formal schema beyond the standard concept format.

## Distinct cited sources (input for `references/`)

`sources[].publisher` spans ~80 distinct publishers; `sources[].url` spans ~150 distinct URLs.
Top publishers: MDN (113), W3C (87), IETF (59), WHATWG (31), web.dev (29), Google Search
Central (29), IANA (12), schema.org (6), OWASP (6), sitemaps.org (5), llmstxt.org (4).
→ Granularity of `references/` is an open decision (see below).

## ⚠️ Blocking discovery: two competing "AI Catalog" schemas, `type` vs `mediaType`

There are **two genuinely different specifications**, and `mediaType` is not a typo — it is
faithful to the base spec we cite. Confirmed by reading both source specs directly:

- **`Agent-Card/ai-catalog`** (`specification/ai-catalog.md`) — the base spec our
  `agentic-resource-discovery.md` page cites and our `ai-catalog.json` implements. Entry
  required fields `identifier`, `displayName`, **`mediaType`**, exactly one of `url`/`data`;
  optional `description`, `tags`, `version`, `updatedAt`, `metadata`, `publisher`,
  `trustManifest`. Media types: `application/mcp-server-card+json`,
  `application/a2a-agent-card+json`, `application/ai-catalog+json`,
  `application/agentskill+zip`. **No `representativeQueries`.** Our shipped file is **conformant**.
- **`ards-project/ard-spec`** + the rendered `agenticresourcediscovery.org/ai_catalog_spec/`
  (the ARD discovery _layer_, "built on top of ai-catalog", which the plan cites). Renamed the
  field to **`type`** (still an IANA media type), added `representativeQueries` (`minItems: 2,
maxItems: 5`) and `capabilities`; example MCP media type is `application/mcp-server+json`.

`mediaType` entered today in commit `d22b710` (initial ARD adoption), following the base spec.
It is correct against that spec; it is **not** conformant against the ARD-layer schema the plan
targets. Reconciling needs your decision (recorded in the PR). **No re-signing required either
way** — the JWS covers only `host.trustManifest`, not `entries`.

**Recommended:** emit **both** `type` and `mediaType` (identical media-type value) plus
`representativeQueries` on every entry. Both specs say consumers must preserve unknown keys, so
this validates under the base ai-catalog schema _and_ the ARD-layer schema simultaneously. The
new Skill + OKF entries follow the same dual-field shape.

## Serving / build mechanics

- Static output to `dist/`. `/.well-known/` files are plain static assets in `public/` (e.g. `security.txt`); content types + CORS set in `public/_headers`. `public/_routes.json` excludes static asset paths from the Functions worker.
- Derived text endpoints are Astro routes (`src/pages/llms.txt.ts`, `.md.ts` per page) returning `Response`. **Plan: emit the `/okf/` tree the same way** — dynamic `.md.ts` endpoints under `src/pages/okf/` reading `getCollection('spec')`, so the bundle stays derived and works in dev + build.
- **Tarball:** Node has **no `tar` dependency** here, but `zlib.gzipSync` is built in. Plan: a small Astro integration (`astro:build:done` hook in `astro.config.mjs`) that walks `dist/okf/`, writes a POSIX ustar archive by hand (~60 lines, no new dep), gzips it to `dist/okf.tar.gz`. Keeps the repo's minimal-dependency stance.
- New paths need `public/_headers` entries (`text/markdown` for `/okf/*.md`, `application/gzip` for `/okf.tar.gz`) and `public/_routes.json` exclusions where static.

## Decisions (resolved with Joost before building)

1. **Entry field shape — `type` vs `mediaType`:** emit **both** (same value) plus `representativeQueries` on every entry, so the catalog validates under both the base ai-catalog spec and the ARD layer. The `agentic-resource-discovery.md` page now documents the dual-field reality.
2. **`references/` granularity:** **one `Reference` concept per distinct source URL** (445 in practice). Each check's `standard` field links its primary source's concept; `# Citations` links all.
3. **OKF bundle entry `url`:** **`/okf.tar.gz`** (the tarball).

## Conformance-check output (Phase 1 acceptance)

```
checked 588 concept files, 13 reserved (index/log), failures: 0
```

Bundle: 143 check concepts + 10 category indexes + 445 reference concepts + root index +
references index + log = 601 files. Tarball round-trips byte-identically. `npm run check:ard`
still verifies (the JWS covers `host.trustManifest`, which was not touched).
