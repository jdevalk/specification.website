---
title: "/llms.txt"
slug: llms-txt
category: agent-readiness
summary: "A markdown file at the site root that gives LLMs a curated index of your most important content. Now at v2, which makes it discoverable by link relation instead of by guessing the path. Still a convention, not a ratified standard."
status: recommended
order: 20
appliesTo: [all]
relatedSlugs: [llms-full-txt, markdown-source-endpoints, link-headers, agent-readiness-overview, robots-for-ai-crawlers, content-signals, agent-skills-discovery, schemamap]
updated: "2026-08-11T00:00:00.000Z"
sources:
  - title: "The /llms.txt proposal (v2)"
    url: "https://llmstxt.org/"
    publisher: "llmstxt.org"
  - title: "llms.txt — changes from v1 to v2"
    url: "https://llmstxt.org/changes.html"
    publisher: "llmstxt.org"
  - title: "RFC 8288 — Web Linking"
    url: "https://www.rfc-editor.org/rfc/rfc8288"
    publisher: "IETF"
  - title: "Is It Agent Ready?"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
---

## What it is

`/llms.txt` is a proposed convention for a markdown file served at the root of a site. It gives large language models a short, curated map of the content you most want them to see. The proposal lives at [llmstxt.org](https://llmstxt.org/) and was put forward by Jeremy Howard in 2024.

The name invites a comparison with `robots.txt`, and it is the wrong one. `robots.txt` is a control file: it grants and withholds access, crawler by crawler. `llms.txt` controls nothing. Listing a page in it does not open that page, and leaving one out does not protect it; the file is an index and an invitation, not a permission. Access and usage policy live elsewhere, in [robots.txt for AI crawlers](/spec/agent-readiness/robots-for-ai-crawlers/) and [Content Signals](/spec/agent-readiness/content-signals/), which actually allow, disallow, and set training preferences.

It is still not a ratified standard, and no model vendor discloses whether its crawlers read the file. Everything around that has moved, though. The proposal reached v2 in 2026, revised after two years of deployment; OpenAI, Anthropic and Google each publish one for their own developer docs; platforms from Mintlify to GitBook generate one by default; and Chrome's Lighthouse now audits for one under its agentic-browsing checks. Publishing is mainstream, consumption is undisclosed, and that asymmetry is the honest case for shipping it: the cost is one file, and the tooling that demonstrably looks for it is no longer hypothetical.

The file is plain markdown with a defined structure: a top-level heading with the site name, a short blockquote summary, optional context paragraphs, and one or more `##` sections containing markdown links.

```md
# Example Corp

> Example Corp builds open-source tools for static-site authors.

We publish documentation, a blog, and reference specifications.

## Docs

- [Getting started](https://example.com/docs/start.md): Install and first build.
- [API reference](https://example.com/docs/api.md): All public functions.

## Optional

- [Changelog](https://example.com/changelog.md): Release notes.
```

v2 left that format alone and fixed the part that never worked. v1 expected an agent to guess `/llms.txt` at the root, which meant a single file had to speak for a whole origin or go unfound. v2 replaces the guess with a link relation you publish, and scopes coverage by path, so `/docs/llms.txt` can describe the documentation and nothing else.

## Why it matters

- It is short. A model can read it in one fetch and learn what your site is about without crawling everything.
- It is curated. You decide which pages matter, in which order.
- It is markdown. No parsing of HTML, no JavaScript, no ads to strip.
- It complements `sitemap.xml`, which is exhaustive and machine-only. `llms.txt` is selective and human-readable too.

The cost is low: one file, updated when your information architecture changes.

## How to implement

- Place the file at `https://example.com/llms.txt`. Serve as `text/markdown` or `text/plain`.
- **Advertise it with `rel="describedby"`.** This is v2's one hard addition, and skipping it leaves you on the v1 guess-the-path behaviour. Emit it as a `<link>` in the head, as an HTTP [`Link` header](/spec/agent-readiness/link-headers/), or both — the header reaches agents that never parse your HTML.

  ```
  Link: </llms.txt>; rel="describedby"; type="text/markdown"
  ```

- Start with `# Site name` on the first line. Follow with a `> blockquote` summary.
- Use `##` headings to group links. Links should point to canonical pages.
- **Scope by path when one root file cannot speak for the whole origin.** A file covers the pages beneath its path and the most specific file wins, so a large site can participate one section at a time instead of waiting for a document nobody owns.
- Point at markdown source where you publish it. v2 accepts either URL shape — `page.md` or `page.html.md` — so use whichever your routing already produces, and advertise it with `rel="alternate"; type="text/markdown"`. See [per-page markdown source endpoints](/spec/agent-readiness/markdown-source-endpoints/).
- Keep it under a few hundred lines. If you want full content, see [/llms-full.txt](/spec/agent-readiness/llms-full-txt/).
- Link to it from your homepage or footer so humans can find it too.

**This site ships it.** [`/llms.txt`](/llms.txt) is generated from the same content collection as every other page, and each response carries `Link: </llms.txt>; rel="describedby"; type="text/markdown"` so an agent never has to guess.

## Common mistakes

- Treating it like a sitemap and listing every URL. The point is curation.
- Writing marketing copy in the summary. Models will quote it; write plainly.
- Letting it drift. A stale `llms.txt` is worse than none — it teaches models wrong things.
- Publishing the file and never linking to it. An unadvertised `llms.txt` is only found by an agent that already assumed the path, which is the failure v2 set out to fix.
- Reading meaning into `## Optional`. v1 gave that heading mechanical semantics for context-expansion tooling; v2 dropped the tooling and the semantics with it. It is a useful convention for secondary links and nothing more.

## Verification

- Fetch `https://example.com/llms.txt` and confirm a `200` with markdown content.
- Confirm the relation is actually advertised: `curl -sI https://example.com/ | grep -i '^link:'` should show `rel="describedby"`, or the same relation should appear in the HTML head.
- Validate the structure against the example on [llmstxt.org](https://llmstxt.org/).
- Run Chrome's Lighthouse over the site — its agentic-browsing checks report on the file, which confirms from outside that it is both present and findable.
- Re-check after every information-architecture change.
