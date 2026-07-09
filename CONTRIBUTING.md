# Contributing to The Website Specification

Thanks for considering a contribution. The spec is open: issues, pull requests, and even straight-up disagreements are welcome. There are three rules.

## 1. Cite your sources

Every page lists at least one source. If you are adding or changing a claim, link the standard, the official documentation, or the maintained reference behind it.

**No source, no merge.** Preferred sources, in order:

1. The underlying standard (WHATWG, W3C, IETF RFC, schema.org, sitemaps.org).
2. The maintainer's documentation (MDN, web.dev, Google Search Central).
3. A widely-trusted secondary source (Yoast Developer, Equalize Digital, OWASP).

Avoid blog posts, vendor marketing pages, and out-of-date Stack Overflow answers.

When an MDN reference or browser-support claim is involved, resolve it through the **MDN MCP server** (`https://mcp.mdn.mozilla.net/`, free, no auth) rather than pasting a deep link from memory or search. It returns the _current_ canonical URL — MDN periodically reorganises its reference tree, and hard-coded deep links rot — and exposes Baseline / Browser Compatibility Data so you can sanity-check that a feature is actually shippable before recommending it. MDN stays a context source: the page's primary citation must still be the underlying standard.

## 2. Stay platform-agnostic

The spec describes _outcomes_, not implementations. "Set `Content-Security-Policy`" is in scope. "Add this to your `next.config.mjs`" is not — link out to platform docs instead.

If a topic only makes sense on a specific platform, it probably belongs in that platform's docs, not here.

## 3. Be honest about status

- **Required** — the web platform contract breaks without it (e.g. `<title>`, `<meta charset>`, HTTPS).
- **Recommended** — a modern site should do it.
- **Optional** — depends on context. Pick when it applies.
- **Avoid** — outdated, harmful, or superseded.

If a status is wrong, fix it — with reasoning in the PR description.

## How to propose a change

### Small fixes (typos, broken links, source updates)

Just open a PR. You can use the "Edit this page on GitHub" link on any spec page.

### New spec page

1. Open an [issue](https://github.com/jdevalk/specification.website/issues) describing the topic, why it belongs, and your sources.
2. Once the topic is agreed:
   - Copy an existing file in `src/content/spec/<category>/`.
   - Update the front matter (see schema in [`src/content.config.ts`](src/content.config.ts)).
   - Write the body. Sections: `## What it is`, `## Why it matters`, `## How to implement`, `## Common mistakes`, `## Verification`.
   - Up to ~1000 words (up to ~2000 for a genuinely hard topic). No minimum — 400 words is fine if that says it. Length must be earned by explanation, not padding: a real explanation makes some existing sentence redundant.
   - Name the wrong belief the reader arrives with. Ask what a competent-but-not-expert reader wrongly believes about the topic, then contrast against it (`<title>` is not `<h1>`). Some pages have no such misconception — those get no such paragraph.
3. Run `npm run dev` locally on port 31337 and verify the page renders.
4. Open a PR. CI will type-check, build, and verify the schema.

### New category

These are rare. Open an issue first — categories are slow-changing.

## Code changes

The site is built with Astro + Tailwind. PRs welcome for:

- Accessibility improvements.
- Performance fixes.
- New components for the spec pages (decision tables, status filters, search).
- Build / CI improvements.

Run `npm run check` (Astro type-check) and `npm run build` before pushing.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). The short version: be kind.

## Licence

By contributing, you agree your work will be released under the [MIT licence](LICENSE) (code) and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (content).
