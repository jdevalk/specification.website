---
title: "/llms.txt"
slug: llms-txt
category: agent-readiness
summary: "A proposed markdown file at the site root that gives LLMs a curated index of your most important content. Emerging convention, not a ratified standard."
status: recommended
order: 20
appliesTo: [all]
relatedSlugs: [llms-full-txt, markdown-source-endpoints, agent-readiness-overview, robots-for-ai-crawlers, content-signals, agent-skills-discovery, schemamap]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "The /llms.txt proposal"
    url: "https://llmstxt.org/"
    publisher: "llmstxt.org"
  - title: "Is It Agent Ready?"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
---

## What it is

`/llms.txt` is a proposed convention for a markdown file served at the root of a site. It gives large language models a short, curated map of the content you most want them to see. The proposal lives at [llmstxt.org](https://llmstxt.org/) and was put forward by Jeremy Howard in 2024.

The name invites a comparison with `robots.txt`, and it is the wrong one. `robots.txt` is a control file: it grants and withholds access, crawler by crawler. `llms.txt` controls nothing. Listing a page in it does not open that page, and leaving one out does not protect it; the file is an index and an invitation, not a permission. Access and usage policy live elsewhere, in [robots.txt for AI crawlers](/spec/agent-readiness/robots-for-ai-crawlers/) and [Content Signals](/spec/agent-readiness/content-signals/), which actually allow, disallow, and set training preferences.

It is not a ratified standard. No major model vendor has committed to consuming it. Treat it as a low-cost bet that may pay off as agents look for cheap, authoritative summaries of a site.

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

## Why it matters

- It is short. A model can read it in one fetch and learn what your site is about without crawling everything.
- It is curated. You decide which pages matter, in which order.
- It is markdown. No parsing of HTML, no JavaScript, no ads to strip.
- It complements `sitemap.xml`, which is exhaustive and machine-only. `llms.txt` is selective and human-readable too.

The cost is low: one file, updated when your information architecture changes.

## How to implement

- Place the file at `https://example.com/llms.txt`. Serve as `text/markdown` or `text/plain`.
- Start with `# Site name` on the first line. Follow with a `> blockquote` summary.
- Use `##` headings to group links. Links should point to canonical pages.
- Prefer markdown versions of pages where you have them — many sites publish `page.md` alongside `page.html`.
- Keep it under a few hundred lines. If you want full content, see [/llms-full.txt](/spec/agent-readiness/llms-full-txt/).
- Link to it from your homepage or footer so humans can find it too.

## Common mistakes

- Treating it like a sitemap and listing every URL. The point is curation.
- Writing marketing copy in the summary. Models will quote it; write plainly.
- Letting it drift. A stale `llms.txt` is worse than none — it teaches models wrong things.
- Assuming any specific model uses it today. Adoption is uneven and not always disclosed.

## Verification

- Fetch `https://example.com/llms.txt` and confirm a `200` with markdown content.
- Validate the structure against the example on [llmstxt.org](https://llmstxt.org/).
- Re-check after every information-architecture change.
