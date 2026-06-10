---
title: "Stable URLs"
slug: stable-urls
category: agent-readiness
summary: "URLs are public contracts. Once published, they should keep working. Breaking them invalidates citations, bookmarks, links, and agent caches — and is almost always avoidable."
status: required
order: 50
appliesTo: [all]
relatedSlugs: [agent-readiness-overview, robots-txt, structured-data-for-agents, conditional-requests]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "Cool URIs don't change"
    url: "https://www.w3.org/Provider/Style/URI"
    publisher: "W3C — Tim Berners-Lee"
  - title: "Is It Agent Ready?"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
  - title: "Google — Redirects and Search"
    url: "https://developers.google.com/search/docs/crawling-indexing/301-redirects"
    publisher: "Google Search Central"
---

## What it is

A stable URL is one that keeps resolving to the same content over time, or — when content moves — redirects permanently to its new location. The principle was set out by Tim Berners-Lee in 1998 in *Cool URIs don't change* and has only become more important as agents, archives, and citations multiply.

A URL is a public contract. Once you publish one, every link, bookmark, citation, RSS reader, search index, and agent cache assumes it will keep working.

## Why it matters

- **Agents cache answers.** When a model quotes your page, it cites the URL. If that URL 404s next month, the citation is broken and your authority drops.
- **Search engines lose ranking signals.** Backlinks accumulated over years are tied to the URL.
- **Humans hate broken links.** Bookmarks, shared chat messages, printed materials.
- **Internal links rot.** Every change inside your own site creates work elsewhere on it.

A site that reorganises its URLs every release teaches the web not to trust it.

## How to implement

Design for permanence from the start:

- **Avoid implementation details.** No `/wp-content/`, `/index.php`, `.aspx`, or `?id=42`. These leak the stack and break when you switch it.
- **Avoid dates unless they are essential to the resource.** A news article can keep `/2025/03/headline`. An evergreen documentation page should not.
- **Avoid the author or department.** Authors leave and departments rename.
- **Use kebab-case slugs.** Lowercase, hyphens between words, no trailing slashes mixed with non-trailing slashes — pick one and enforce it.
- **Pick a canonical host.** `www.` or no-`www.`, HTTPS only, one path style. Redirect the rest.

When a URL must change, redirect:

- Issue a `301 Moved Permanently` (or `308` to preserve the method) from the old URL to the new one.
- Keep the redirect forever. Removing it years later breaks links you have forgotten about.
- Avoid chains: redirect `A` directly to `C`, not `A` to `B` to `C`.
- Never redirect everything to the homepage. That is worse than a 404 — it tells crawlers the page intentionally still exists.

For deletions, a clean `410 Gone` is more honest than a soft 404 or a homepage redirect.

## Common mistakes

- Re-platforming and changing every URL slug "while we're at it".
- Adding session IDs, tracking parameters, or A/B variants to canonical URLs.
- Letting trailing slashes serve different content from non-trailing slashes.
- 302 (temporary) redirects for moves that are permanent.
- Removing redirect maps after a year because the file got big.

## Verification

- Crawl old URLs after a migration and confirm each returns `301` to a working target.
- Use search-console reports to find 404s coming from external links.
- Spot-check archived URLs in the Wayback Machine. If they still load, your redirects are doing their job.
