# Daily standards scan — routine instructions

> **This file is the single source of truth for the daily standards-scan routine.**
> A scheduled agent reads this file each run and follows it exactly. Edit this file to
> change what the routine does — do not edit the routine's prompt. Commit and push to
> `main`; the next run picks up the change automatically.

You maintain **specification.website** — a platform-agnostic spec of what a good website
does, generated entirely from Markdown under `src/content/spec/<category>/<slug>.md`.
Read `CLAUDE.md` and `CONTRIBUTING.md` first; they are binding (status discipline,
cardinal content rules, the "ship it before you spec it" rule, the add-a-page workflow,
the SKILL.md digest step).

## Goal

Once daily, scan the standards bodies this spec is built on for material we don't yet
cover or that has changed, then **(a)** open draft PRs for the solid, standards-backed
cases and **(b)** send one Slack summary of everything found.

## Sources to check (cited bodies + adjacent feeds)

- WHATWG HTML / DOM / Fetch living standards (`html.spec.whatwg.org` and siblings)
- W3C TR index + CSSWG drafts (`drafts.csswg.org`) for new/advanced specs
- WCAG / W3C accessibility (new success criteria, WCAG 2.2/3.0 movement)
- IETF: new or updated RFCs and active drafts in the web/security/well-known space
  (`rfc-editor.org`, `datatracker.ietf.org`)
- IANA registries: Well-Known URIs, Link Relations, message headers (new registrations)
- schema.org releases (new/changed types relevant to sites)
- Agent-protocol sources: `llmstxt.org`, `modelcontextprotocol.io`, `a2a-protocol.org`
- `sitemaps.org`, JSON Feed, RSS board
- **Baseline status — webstatus.dev public API** (the push-signal for browser-feature
  movement): `https://api.webstatus.dev/v1/features?q=baseline_status:newly` (public, no
  auth, JSON) lists features that have _newly_ reached Baseline; add
  `baseline_date:<START>..<END>` to scope to this run's window — use a trailing ~8-day
  window so a skipped run never drops a feature. This is the discovery step for section
  #2's Baseline check; the MDN MCP then corroborates each hit and supplies the canonical
  primary-source URL. It is derived data, not editorial — trustworthy as a signal, but a
  page still cites the primary standard, not webstatus.dev.

  **`baseline_date` always matches a feature's _low_ date** (the day it went _newly_), even
  when you filter on `baseline_status:widely`. Widely is reached ~30 months after newly, so
  a feature that goes Widely today has a low date ~30 months in the past. This means the
  intuitive query — `baseline_status:widely AND baseline_date:<this run's window>` — is
  **always empty** and silently reports "no transitions" forever. To catch the newly →
  Widely transition, offset the window back ~30 months:

  ```
  # Newly Baseline this run (trailing ~8-day window on the low date):
  baseline_status:newly AND baseline_date:<TODAY-8>..<TODAY>

  # Went WIDELY this run — same window shifted back 30 months:
  baseline_status:widely AND baseline_date:<TODAY-30mo-8d>..<TODAY-30mo>
  ```

  Sanity-check the offset against the returned `baseline.high_date` rather than trusting
  the 30-month rule of thumb; the API returns both `low_date` and `high_date` per feature.

- Adjacent (watch, don't blindly trust): `web.dev` — especially <https://web.dev/blog> —
  `developer.chrome.com`, Google Search Central — for emerging conventions worth
  promoting LATER
- <https://mnot.net/blog/> (Mark Nottingham: HTTP WG co-chair and a designated expert for
  the IANA HTTP Field Name registry): high-signal early commentary on HTTP headers,
  Structured Fields, caching, and registry/protocol movement, often ahead of the RFC.
  Treat what he flags as a lead to investigate; a page still cites the primary standard,
  not the blog.

## Tools — use the MDN MCP server

The MDN MCP server (`https://mcp.mdn.mozilla.net/`, free, no auth) exposes MDN docs **and
Baseline / Browser Compatibility Data (BCD)**. Prefer it over fetching MDN HTML — it is
faster and returns the _current_ canonical URL and support status, which is exactly what
this scan needs. Use it for:

- **Resolving MDN citations** (see "dead or stale citations" below): query the MDN MCP for
  the canonical current URL of a topic instead of trusting a hard-coded deep link that may
  have moved in an MDN reference reorg. When an existing MDN source 404s or redirects,
  the MCP's canonical URL is the fix to propose.
- **Baseline checks** (see "status changes" and "new topics" below): the MCP reports
  whether a feature is Baseline (and since when). A feature newly reaching Baseline is a
  strong signal to add a page or revisit a status; a feature still behind a flag or with
  thin support argues _against_ `required` and often against a page at all yet.

This is an MDN-MCP-backed reference check, not a substitute for citing the primary
standard — the page's `sources` must still lead with WHATWG / W3C / IETF / WCAG; MDN is
context.

## Three things to look for

1. **New topics** — a standard/convention/well-known URI we have no page for.
2. **Status changes** — something we cover that advanced (CR→REC), was obsoleted,
   deprecated, or whose `recommended`/`required`/`avoid` status should now move. Cite the
   change. **Discover** browser-feature movement via the webstatus.dev Baseline API (see
   Sources); **corroborate** each hit against **Baseline in the MDN MCP** for the support
   detail and the canonical URL. A feature newly reaching Baseline supports a promotion or
   a new page; thin support argues against `required`. But most newly-Baseline features are
   CSS/JS authoring conveniences with no auditable website outcome — those do **not** earn a
   page or a PR (the subgrid/PR #82 rule under "Scope & status rules"). Note them in Slack
   under "skipped, and why" so the Baseline firehose stays visible without generating PR
   spam.
3. **Dead or stale citations** — sources on existing pages that 404, moved, or no longer
   say what the page claims. Spot-check a **rotating slice** each run, not every page
   every day. For MDN sources specifically, resolve the current canonical URL via the
   **MDN MCP** (see Tools) rather than guessing the new path by hand.

## Scope & status rules (do not violate)

- Platform-agnostic only: describe outcomes and standards, never "add this to
  `next.config`".
- **Auditable website outcome, not build technique.** Before proposing a page, ask: is
  this a property of a good website that could in principle be checked from outside
  (a header, an element, a behaviour, a well-known URI), or is it a way of _building_ a
  website? A CSS/JS feature whose benefit is developer convenience — easier alignment,
  less code, nicer authoring — does not get a page, however well-supported it is
  (example: CSS subgrid, rejected in PR #82; a flexbox-built site is no worse, and
  there is nothing to audit). Platform features earn a page only when they map to a
  user-facing outcome: container queries → components adapt to the space they are
  given; Popover API → native semantics, focus and dismissal users can rely on. If you
  cannot phrase the page's "Why it matters" in terms of visitors, crawlers, or agents
  — rather than the developer — skip it and mention it in Slack instead.
- Status bar: `required` only if the web platform contract breaks without it; otherwise
  `recommended`/`optional`; `avoid` for outdated/harmful. Default to `recommended`.
- Primary sources only (WHATWG / W3C / IETF / IANA / WCAG / schema.org first; MDN /
  web.dev for context).
- **Ship it before you spec it**: a brand-new _convention_ that would require the site to
  implement a new capability does NOT get a PR — flag it in Slack as "needs us to ship X
  first" so the maintainer can decide. PRs are only for documenting standards we can
  honestly describe (and, where applicable, that the site already satisfies).

## Dedup (critical for a daily job)

Before proposing anything: `git fetch`, list open PRs/branches, and check for an existing
page. Never open a second PR for a topic already proposed or covered. If nothing new and
nothing stale, say so in Slack and open no PRs.

## For each solid candidate → draft PR

- Branch off `main`. Follow the CLAUDE.md add/change workflow exactly:
  - **New page:** full frontmatter (`title`, `slug`, `category`, `summary`, `status`,
    `order`, `appliesTo`, `relatedSlugs`, `sources` [2–4], `updated`) + the canonical
    sections (`## What it is` / `## Why it matters` / `## How to implement` /
    `## Common mistakes` / `## Verification`), British English, up to ~1000 words
    (up to ~2000 only for a genuinely hard topic) with no minimum — do not pad to a
    target; length must be earned by explanation. Name the wrong belief the reader
    arrives with and contrast against it where the topic has one (`<title>` is not
    `<h1>`); skip that paragraph on pages that have no such misconception.
  - Wire `relatedSlugs` on adjacent pages; if it adds a discoverable resource, update the
    api-catalog Linkset and the `Link` header per CLAUDE.md.
  - If page count or categories change, update
    `public/.well-known/agent-skills/specification-website/SKILL.md` **and** recompute its
    sha256 into `agent-skills/index.json`.
- Run `npm run build` (must pass) before opening the PR.
- Open it as a **DRAFT**, never merge. PR body: what changed, why now, the primary
  source(s), the chosen status with one-line justification. One PR per topic. Do **not**
  redeploy the MCP Worker — that's a human step after merge.

## Slack summary (always, even on a quiet day)

DM the maintainer with:

- New topics found → PR links (or "flagged, needs implementation decision").
- Status changes → page + what moved + source + PR link.
- Stale/dead citations → page + broken source + fix PR link.
- Anything deliberately skipped, and why.

Keep it scannable: grouped, one line each, links inline.
