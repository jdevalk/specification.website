---
title: "robots.txt"
slug: robots-txt
category: seo
summary: "A plain-text file at the site root that tells crawlers which paths they may or may not fetch. Standardised in RFC 9309 and supported by every major search engine."
status: recommended
order: 10
appliesTo: [all]
relatedSlugs: [xml-sitemaps, robots-for-ai-crawlers, redirects, meta-robots]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "RFC 9309 — Robots Exclusion Protocol"
    url: "https://www.rfc-editor.org/rfc/rfc9309.html"
    publisher: "IETF"
  - title: "Introduction to robots.txt"
    url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro"
    publisher: "Google Search Central"
  - title: "How Google interprets the robots.txt specification"
    url: "https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt"
    publisher: "Google Search Central"
---

## What it is

`robots.txt` is a plain-text file served at the root of a host that tells automated crawlers which URL paths they are allowed to fetch. The format was finalised as a standard in 2022 as RFC 9309.

It must be reachable at exactly `/robots.txt` on the host, served as `text/plain`, and returned with a `200 OK`. A `404` is interpreted as "no restrictions"; a `5xx` is interpreted as "crawl nothing" by most crawlers.

```txt
User-agent: *
Disallow: /admin/
Disallow: /cart
Allow: /admin/public-policy

Sitemap: https://example.com/sitemap.xml
```

## Why it matters

- Saves crawl budget on URLs that have no value in search (faceted filters, internal search, login, cart).
- Keeps staging paths and admin areas out of crawler logs.
- The `Sitemap:` directive is the canonical way to point crawlers at your sitemap when they have not been told another way.
- AI crawlers and SEO tools also honour it — it is the broadest signal you have for "do not fetch this".

It is not a security mechanism. Anything you do not want public must be behind authentication. Disallowed URLs can still appear in search results if they are linked from elsewhere.

## How to implement

Group rules by user-agent. The most specific user-agent wins per RFC 9309.

```txt
User-agent: Googlebot
Disallow: /private/

User-agent: *
Disallow: /admin/
Allow: /

Sitemap: https://example.com/sitemap_index.xml
```

Rules to follow:

- One host per file. `robots.txt` only applies to the host it is served from, including the scheme and port.
- Paths are case-sensitive and treated as URL prefixes. `/Admin` and `/admin` are different.
- Wildcards (`*`) and end-of-URL anchors (`$`) are supported by Google, Bing, and most other major crawlers, but they are not in RFC 9309. Use them carefully.
- `Crawl-delay` is non-standard. Google ignores it; Bing and Yandex honour it. Prefer per-crawler rate settings in their dashboards.
- Keep the file under 500 KiB. Google truncates above that.

## Common mistakes

- `Disallow: /` accidentally left over from staging. This blocks the entire site.
- Disallowing a URL that you also want deindexed. Crawlers cannot read a `noindex` they are not allowed to fetch.
- Adding a `Noindex:` line to robots.txt to keep a page out of search. It was never part of the standard, Google stopped honouring the unofficial version in September 2019, and unsupported lines are silently ignored. robots.txt governs crawling, not indexing: to deindex a page, let it be crawled and serve `noindex` in a meta robots tag or `X-Robots-Tag`.
- Blocking CSS and JS. Google needs to render the page to rank it.
- Serving `robots.txt` from a CDN that returns `5xx` during incidents — crawlers stop fetching the whole site.

## Verification

- Fetch `https://example.com/robots.txt` directly. Confirm `Content-Type: text/plain` and a `200`.
- Use Google Search Console's robots.txt report to see the parsed rules and any warnings.
