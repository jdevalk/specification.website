---
title: "Per-page Markdown source endpoints"
slug: markdown-source-endpoints
category: agent-readiness
summary: "Expose every documentation page's raw Markdown source at a predictable URL — via a .md suffix on the canonical URL, content negotiation, or both. Agents pull source instead of parsing HTML."
status: recommended
order: 35
appliesTo: [all]
relatedSlugs: [llms-txt, llms-full-txt, machine-readable-formats, structured-data-for-agents, agent-readiness-overview, agent-skills-discovery, schemamap, conditional-requests]
updated: "2026-05-29T14:13:42.000Z"
sources:
  - title: "RFC 9110 — HTTP Semantics §12 (Content Negotiation), §8.7 (Vary), §8.7.1 (Content-Location)"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-content-negotiation"
    publisher: "IETF"
  - title: "MDN — Vary"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary"
    publisher: "MDN"
  - title: "MDN — Content-Location"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Location"
    publisher: "MDN"
  - title: "Anthropic — docs.anthropic.com Markdown source (live example)"
    url: "https://docs.anthropic.com/en/docs/intro.md"
    publisher: "Anthropic"
  - title: "llmstxt.org"
    url: "https://llmstxt.org/"
    publisher: "llmstxt.org"
---

## What it is

A per-page Markdown source endpoint exposes the original, unrendered Markdown of a content page at a predictable URL. An agent — an LLM, a documentation index, a CLI tool — fetches the Markdown instead of the HTML and gets the same content without the lossy round trip through DOM parsing, ad scaffolding, navigation chrome, and JavaScript hydration.

Two conventions are emerging, and the best sites do both.

**1. URL suffix.** Append `.md` to the page path.

```http
GET /docs/getting-started/        HTTP/1.1
GET /docs/getting-started.md      HTTP/1.1
```

The first returns HTML. The second returns the raw Markdown source with a `text/markdown` content type.

**2. Content negotiation.** Send `Accept: text/markdown` to the canonical (HTML) URL and get Markdown back.

```http
GET /docs/getting-started/        HTTP/1.1
Accept: text/markdown
```

```http
HTTP/1.1 200 OK
Content-Type: text/markdown; charset=utf-8
Content-Location: /docs/getting-started.md
Vary: Accept
```

The `Content-Location` header tells the client the canonical Markdown URL; `Vary: Accept` tells caches the response depends on the request's `Accept` header.

## Why it matters

- **Lossless source.** HTML extraction loses heading semantics, code-block language hints, callout syntax, and inline metadata. Markdown gives the agent exactly what the author wrote.
- **Smaller payloads.** A typical Markdown page is 5–20× smaller than its rendered HTML once you remove styling, scripts, and shared chrome.
- **No JavaScript runtime.** Crawlers that don't run JS still get full content.
- **Aligned with `llms.txt`.** [llms.txt](/spec/agent-readiness/llms-txt/) and [llms-full.txt](/spec/agent-readiness/llms-full-txt/) point at pages — `.md` makes the pointed-to representation directly usable.
- **Stable signal of intent.** Sites that expose `.md` are advertising "we want to be readable by agents," which is itself a useful discovery signal.

Anthropic's documentation, Stripe's, and a growing number of others ship the `.md` suffix. Treat the canonical URL with `Accept: text/markdown` as the next layer up — same content, the URL stays canonical, caches behave correctly.

## How to implement

**Ship the suffix at minimum.** For every Markdown-sourced page, serve the same Markdown at the URL with `.md` appended.

```http
HTTP/1.1 200 OK
Content-Type: text/markdown; charset=utf-8
Cache-Control: public, max-age=3600
X-Markdown-Tokens: 1240
```

Include a YAML frontmatter block with the page's metadata so agents get structured context alongside the prose: `title`, `url` (the canonical HTML URL), `updated`, `sources`, `licence`. Don't ship implementation details an agent doesn't need (build timestamps, internal IDs).

**Hint the size.** Add an `X-Markdown-Tokens` response header carrying a rough token-count estimate for the body (any reasonable tokeniser — `tiktoken`'s `cl100k_base` is a fine default). The header is not a registered standard, but a growing number of agent-friendly sites ship it because it lets a caller decide whether to inline the page into a prompt, summarise it first, or skip it for a smaller one — without downloading the body. Recompute it whenever the Markdown changes; do not invent the number.

**Advertise it in `<head>`.** Add a discovery link to the HTML version so crawlers and tools find the Markdown without guessing the URL pattern.

```html
<link rel="alternate" type="text/markdown"
      href="https://example.com/docs/getting-started.md"
      title="Getting started — Markdown source">
```

**Add content negotiation if your edge supports it.** Cloudflare Pages Functions, Workers, Vercel Edge Middleware, Netlify Edge Functions, Fastly Compute, and Nginx can all branch on `Accept`. The middleware:

1. Matches the page URL pattern.
2. If `Accept` contains `text/markdown`, fetches the `.md` asset internally and returns its body with `Content-Type: text/markdown`, `Content-Location: /…/page.md`, and `Vary: Accept`.
3. Otherwise serves HTML, but still appends `Vary: Accept` so caches don't conflate the two representations of the same URL.

**Mention it in `llms.txt`.** Document both modes near the top of the file so agents can opt in on first read.

## Common mistakes

- Shipping the suffix but forgetting `Content-Type: text/markdown`. Browsers will then download the file instead of displaying it, and agents may misclassify it.
- Doing content negotiation without `Vary: Accept`. Caches will return whichever representation they cached first to every subsequent client, regardless of what they asked for.
- Returning Markdown that still contains template includes, unresolved shortcodes, or framework-specific syntax (e.g. `{{ component }}`). Serve the fully-rendered Markdown, not the source-of-source.
- Letting the Markdown drift from the HTML. The two should be generated from the same source at the same time, in the same build.
- Putting the `.md` behind authentication while the HTML is public. The two representations must have the same access policy.

## Verification

- `curl -i https://example.com/docs/getting-started.md` returns `200` with `Content-Type: text/markdown; charset=utf-8`.
- `curl -i -H 'Accept: text/markdown' https://example.com/docs/getting-started/` returns Markdown with `Content-Location` and `Vary: Accept`.
- The HTML response to the same URL also carries `Vary: Accept`.
- View source on any page — there is a `<link rel="alternate" type="text/markdown" …>` in `<head>`.
- The `.md` body contains the same headings, paragraphs, and code blocks as the rendered HTML, with frontmatter at the top.
