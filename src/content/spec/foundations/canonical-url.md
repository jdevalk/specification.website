---
title: "Canonical URL (rel=\"canonical\")"
slug: canonical-url
category: foundations
summary: "Declare the preferred URL for a page so search engines and crawlers consolidate ranking signals on one address, even when several URLs serve the same content."
status: recommended
order: 70
appliesTo: [all]
relatedSlugs: [title, meta-description, open-graph, no-vary-search]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "RFC 6596 — The Canonical Link Relation"
    url: "https://www.rfc-editor.org/rfc/rfc6596"
    publisher: "IETF"
  - title: "MDN — rel=canonical"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel#canonical"
    publisher: "MDN"
  - title: "Google — Consolidate duplicate URLs with canonicals"
    url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls"
    publisher: "Google Search Central"
  - title: "HTML Living Standard — Link types: canonical"
    url: "https://html.spec.whatwg.org/multipage/links.html#link-type-canonical"
    publisher: "WHATWG"
---

## What it is

The canonical link tells crawlers which URL is the authoritative version of a page when the same content is reachable through several addresses:

```html
<link rel="canonical" href="https://example.com/articles/lang-attribute" />
```

It belongs in `<head>` and was standardised in [RFC 6596](https://www.rfc-editor.org/rfc/rfc6596). All major search engines honour it.

## Why it matters

The same content often lives at multiple URLs without anyone meaning it to:

- `https://example.com/page` and `https://www.example.com/page`
- `http://` and `https://` versions of the same path
- `/page` and `/page/` (with and without trailing slash)
- `/page?utm_source=newsletter` and `/page` (tracking parameters)
- `/page?sort=date` and `/page?sort=name` (filter and sort variants)
- Paginated archives, printer-friendly views, AMP versions

Without a canonical, crawlers may index every variant separately, splitting ranking signals and backlinks across duplicates. With a canonical, those signals consolidate on one URL. The result is a stronger ranking for the page you actually want to rank, and a cleaner index.

A canonical is a **strong hint**, not an absolute directive. Search engines can override it if other signals (sitemaps, redirects, internal links) point elsewhere. Make all your signals agree.

## How to implement

Put a **self-referencing canonical** on every public HTML page. Even pages without duplicates benefit: it removes ambiguity for query-string variants and short-circuits any scraper that copies the page.

```html
<link rel="canonical" href="https://example.com/articles/lang-attribute" />
```

Rules:

- **Use absolute URLs.** Include the scheme (`https://`) and host. Relative canonicals are allowed by the spec but more error-prone; absolute is the safer default.
- **Match the scheme you actually serve.** If the site is HTTPS everywhere, canonicals must say `https://`.
- **Pick one host and stick to it.** Either `example.com` or `www.example.com`, never both. Redirect the other.
- **Be consistent about trailing slashes.** If `/articles/` and `/articles` resolve to the same content, pick one and canonicalise to it. Mixed is the worst case.
- **Strip tracking parameters** from the canonical. The canonical of `/page?utm_source=newsletter` is `/page`.
- **Avoid loops.** Page A canonical to B, B canonical to A is a contradiction.
- **One per page.** Multiple canonicals are ignored.

Cross-domain canonicals are valid when content is syndicated. If you republish an article on a partner site, the partner can canonical back to your original:

```html
<!-- On partner.example -->
<link rel="canonical" href="https://yoursite.example/articles/the-original" />
```

For pages that exist in multiple languages, use `hreflang` in addition to `canonical`. Each language version is its own canonical; `hreflang` ties them together.

The canonical can also be sent as an HTTP header, which is useful for non-HTML resources like PDFs:

```http
Link: <https://example.com/whitepaper.pdf>; rel="canonical"
```

## Common mistakes

- Pointing every page's canonical at the homepage. This tells crawlers your inner pages are duplicates of the homepage and de-indexes them.
- Canonicalising paginated archives (`?page=2`) to page 1. Each pagination page is distinct content; let them index normally.
- Setting a canonical on `https://` that points to `http://`, or vice versa.
- Forgetting to update the canonical when the site moves domain.
- Generating canonicals from `window.location` in client-side JS only. Crawlers may not run JS; render server-side.

## Verification

- View source on a few pages with query parameters. The canonical should ignore the parameters and point to the clean URL.
- Run `document.querySelector('link[rel=canonical]').href` in DevTools.
- Crawl the site and list canonical targets. Every target should return 200 OK, not a redirect.
- In Google Search Console, the "URL Inspection" tool shows the user-declared canonical and the Google-selected canonical. When they differ, something else is overriding your hint.
