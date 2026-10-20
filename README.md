# The Website Specification

[![CI](https://github.com/jdevalk/specification.website/actions/workflows/ci.yml/badge.svg)](https://github.com/jdevalk/specification.website/actions/workflows/ci.yml)
[![Lint](https://github.com/jdevalk/specification.website/actions/workflows/lint.yml/badge.svg)](https://github.com/jdevalk/specification.website/actions/workflows/lint.yml)
[![Format](https://github.com/jdevalk/specification.website/actions/workflows/format.yml/badge.svg)](https://github.com/jdevalk/specification.website/actions/workflows/format.yml)
[![Links](https://github.com/jdevalk/specification.website/actions/workflows/links.yml/badge.svg)](https://github.com/jdevalk/specification.website/actions/workflows/links.yml)
[![Security](https://github.com/jdevalk/specification.website/actions/workflows/security.yml/badge.svg)](https://github.com/jdevalk/specification.website/actions/workflows/security.yml)
[![Code licence: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Content licence: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Deployed on Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange.svg)](https://specification.website)

The website specification — from `<title>` to `/.well-known/security.txt`, from WCAG contrast to `llms.txt`. Platform-agnostic, sourced on every page, written for humans and agents. MIT licensed, open for pull requests.

**Live site:** <https://specification.website>
**MCP server:** <https://mcp.specification.website/mcp>

## What this is

The web is a layer cake of standards: WHATWG defines HTML, W3C ratifies WCAG, the IETF publishes the RFCs behind security headers and `/.well-known/` URIs, IANA registers the namespaces, search engines publish their own rules, browsers add quirks. Almost nobody carries the whole picture.

This site collects the slices into one platform-agnostic specification — sources cited on every page.

It is _not_ a framework. It is _not_ a tutorial. It is a spec, in the same way the HTML Living Standard is a spec: outcomes, requirements, references.

## What this is not

- Not platform-specific. No "use this Next.js plugin" advice — the spec describes the outcome, you choose the implementation.
- Not opinion. Where there is no settled standard, the spec says so.
- Not a marketing site. No newsletter capture. No cookies. Aggregate Plausible analytics; that's it.

## Categories

- **Foundations** — HTML, head, document basics.
- **SEO** — search visibility.
- **Accessibility** — WCAG-aligned rules.
- **Security** — headers, transport, policies.
- **Well-Known URIs** — agreed paths under `/.well-known/`.
- **Agent Readiness** — making a site legible to AI agents.
- **Performance** — Core Web Vitals, caching, fonts.
- **Privacy** — consent, signals, respecting choice.
- **Resilience** — graceful failure.
- **Internationalisation** — language, locale, direction.

## Development

Requirements: Node.js 22.22.3+, npm. Cloudflare Pages uses the version pinned in `.node-version`.

```bash
npm install
npm run dev      # http://localhost:31337
npm run build    # static output in ./dist
npm run preview  # serve ./dist on port 31337
```

The dev server runs on port `31337` by convention (because of course it does).

## Adding or changing a spec page

1. Find the right category under `src/content/spec/<category>/`.
2. Copy an existing `.md` file — for example, `src/content/spec/foundations/title.md`.
3. Fill in the front matter (see schema in [`src/content.config.ts`](src/content.config.ts)). At minimum: `title`, `summary`, `category`, `status`, `order`, and `sources`.
4. Write the body. Sections: `## What it is`, `## Why it matters`, `## How to implement`, `## Common mistakes`, `## Verification`.
5. Open a PR.

The build will fail if the schema is invalid — that is intentional.

Everything derived from the spec content updates automatically: `/spec/`, `/checklist/`, `/llms.txt`, `/llms-full.txt`, `/sitemap-index.xml`, `/rss.xml`, per-page `.md` endpoints, the Pagefind search index, and the MCP server's bundled data. Never hand-edit those; edit the source markdown.

## Status levels

- **Required** — the web platform contract breaks without it.
- **Recommended** — modern sites should do it.
- **Optional** — depends on context.
- **Avoid** — outdated, harmful, or actively superseded.

## Sources

Every page cites at least one source. The site draws on:

- [WHATWG HTML Living Standard](https://html.spec.whatwg.org/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and the Understanding documents
- [IETF RFCs](https://www.rfc-editor.org/) for protocol-level items
- [sitemaps.org](https://www.sitemaps.org/), [schema.org](https://schema.org/), [llmstxt.org](https://llmstxt.org/)
- [Google Search Central](https://developers.google.com/search), [web.dev](https://web.dev/)
- [Yoast Developer Portal](https://developer.yoast.com/)
- [Equalize Digital Accessibility Checker docs](https://equalizedigital.com/accessibility-checker/documentation/)
- [WP Accessibility Knowledge Base](https://wpaccessibility.org/)
- [Is It Agent Ready?](https://isitagentready.com/)
- [Overlay Fact Sheet](https://overlayfactsheet.com/)

## MCP server

A separate Cloudflare Worker in [`mcp/`](mcp/) exposes the spec to MCP-aware agents. See [`mcp/README.md`](mcp/README.md) for tools, the connection config, and how to deploy.

## Licence

Content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Code is licensed under [MIT](LICENSE). Use it, fork it, ship it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Three rules: cite your sources, stay platform-agnostic, be honest about status.

## Security

See [SECURITY.md](SECURITY.md) or [/.well-known/security.txt](https://specification.website/.well-known/security.txt).
