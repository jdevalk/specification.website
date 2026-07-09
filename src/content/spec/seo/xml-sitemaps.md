---
title: "XML sitemaps"
slug: xml-sitemaps
category: seo
summary: "An XML file listing the canonical URLs of a site, with optional metadata about when each was last changed. The fastest way to tell a search engine what exists."
status: recommended
order: 20
appliesTo: [all]
relatedSlugs: [sitemap-index, image-sitemaps, robots-txt, canonical-url, schemamap]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "Sitemaps XML format"
    url: "https://www.sitemaps.org/protocol.html"
    publisher: "sitemaps.org"
  - title: "Build and submit a sitemap"
    url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"
    publisher: "Google Search Central"
  - title: "XSL Transformations (XSLT) Version 1.0"
    url: "https://www.w3.org/TR/xslt-10/"
    publisher: "W3C"
  - title: "XML sitemaps: the most important SEO tool"
    url: "https://yoast.com/what-is-an-xml-sitemap-and-why-should-you-have-one/"
    publisher: "Yoast"
---

## What it is

An XML sitemap is a structured list of the URLs a site wants search engines to know about. The format is defined by sitemaps.org and supported by Google, Bing, Yandex, and others. Each entry is a `<url>` element with a required `<loc>` and optional `<lastmod>`, `<changefreq>`, and `<priority>`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/articles/hsts</loc>
    <lastmod>2026-05-12</lastmod>
  </url>
  <url>
    <loc>https://example.com/articles/csp</loc>
    <lastmod>2026-04-30</lastmod>
  </url>
</urlset>
```

## Why it matters

Crawlers find URLs by following links. A sitemap is a shortcut: it lists every canonical URL, even those that are only weakly linked, and tells the crawler when they last changed. Without one, new pages can take days or weeks to be discovered.

A sitemap does not make a page rank, and inclusion is not a promise it will be indexed. It is a discovery and scheduling hint, nothing more: a URL can sit in the sitemap for weeks and stay out of the index if the search engine judges it thin or duplicate. Indexing and ranking are decided after the crawl, on the page itself, not on its presence in a list.

A sitemap is also the cleanest way to surface translation pairs, image and video metadata, and large archives. It is the main signal that powers crawl scheduling on Bing and the IndexNow protocol.

## How to implement

Follow the spec:

- **URL must be absolute.** Include the scheme and host. The sitemap must live on the same host as the URLs it lists, with limited exceptions.
- **One sitemap, 50,000 URLs and 50 MB uncompressed maximum.** Past that, split into multiple sitemaps and add a [sitemap index](/spec/seo/sitemap-index/).
- **List canonical URLs only.** A URL that redirects, returns 404, or has a different canonical confuses crawlers.
- **Set `<lastmod>` honestly.** Use ISO 8601 / W3C date format. Google uses it as a hint when scheduling recrawls; touching it on every deploy degrades that signal.
- **`<changefreq>` and `<priority>` are ignored by Google.** Other crawlers may use them, but do not spend effort tuning them.
- **Gzip is allowed.** Serve as `application/xml` (`.xml`) or `application/x-gzip` (`.xml.gz`).
- **Reference it from `robots.txt`** with `Sitemap: https://example.com/sitemap.xml` and submit it in Search Console / Bing Webmaster Tools.

Generate sitemaps dynamically from your content source, not by crawling your own site — that way you cannot accidentally include orphaned or redirected URLs.

**This site ships it.** `specification.website` generates [`/sitemap-index.xml`](/sitemap-index.xml) at build time from the content collection, and sets each `<lastmod>` from the entry's `updated` front matter — the same field the [RSS feed](/rss.xml) uses — rather than the build timestamp, so the date only moves when the content actually changes.

## A stylesheet for human readers

Browsers parse XML, but the raw view is hostile to anyone who is not a crawler. An [XSL stylesheet](https://www.w3.org/TR/xslt-10/) referenced from the sitemap transforms it into HTML in the browser, so a person who opens the URL sees a readable page with clickable links. Crawlers ignore the stylesheet and parse the underlying XML directly.

Reference the stylesheet with an `<?xml-stylesheet?>` processing instruction immediately after the XML declaration, before the `<urlset>` (or `<sitemapindex>`) root element:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ...
</urlset>
```

The same stylesheet can render both `<urlset>` and `<sitemapindex>` documents by matching on the root element. Serve the `.xsl` file as `application/xslt+xml` from the same origin as the sitemap; cross-origin XSL is blocked by browsers. XSLT 1.0 is supported by current Chrome, Firefox, and Safari with no client-side dependencies.

**This site ships it.** Open [`/sitemap-index.xml`](/sitemap-index.xml) or any per-category sitemap in a browser to see the transformed view. The stylesheet lives at [`/sitemap.xsl`](/sitemap.xsl).

## Common mistakes

- Listing non-canonical URLs (parameters, session IDs, alternate-case paths).
- Including URLs that return 3xx, 4xx, or 5xx — crawlers will drop trust in the whole sitemap.
- Updating `<lastmod>` on every build even when content has not changed.
- Splitting by URL hash for no reason. Split by content type or section so each sitemap is meaningful on its own.

## Verification

- Fetch the sitemap directly. Confirm `Content-Type: application/xml` and a `200 OK`.
- Validate against the sitemaps.org XSD.
- Check Search Console's Sitemaps report for parse errors and discovered-vs-indexed counts.
