---
title: "XML sitemaps"
slug: xml-sitemaps
category: seo
summary: "An XML file listing the canonical URLs of a site, with optional metadata about when each was last changed. The fastest way to tell a search engine what exists."
status: recommended
order: 20
appliesTo: [all]
relatedSlugs: [sitemap-index, image-sitemaps, robots-txt, canonical-url, schemamap]
updated: "2026-09-05T00:00:00.000Z"
sources:
  - title: "Sitemaps XML format"
    url: "https://www.sitemaps.org/protocol.html"
    publisher: "sitemaps.org"
  - title: "Build and submit a sitemap"
    url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"
    publisher: "Google Search Central"
  - title: "HTML Standard — Interactions with XPath and XSLT"
    url: "https://html.spec.whatwg.org/multipage/infrastructure.html#interactions-with-xpath-and-xslt"
    publisher: "WHATWG"
  - title: "Removing XSLT for a more secure browser"
    url: "https://developer.chrome.com/docs/web-platform/deprecating-xslt"
    publisher: "Chrome for Developers"
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

## Do not attach an XSL stylesheet

A sitemap opened in a browser shows raw XML, which is hostile to anyone who is not a crawler. The long-standing fix was an `<?xml-stylesheet?>` processing instruction pointing at an XSLT stylesheet, which the browser applied to render the sitemap as a readable HTML table. That advice has expired.

Since August 2026 the [HTML Standard](https://html.spec.whatwg.org/multipage/infrastructure.html#interactions-with-xpath-and-xslt) tells authors to avoid client-side XSLT outright: browser XSLT implementations are, in its words, highly susceptible to memory-safety vulnerabilities, and the feature is being removed from the web platform. Chrome stops running it in version 158, due 17 November 2026; Firefox and WebKit have signalled the same intent. This is a removal, not a deprecation warning — the stylesheet simply stops being applied.

The failure is worth understanding precisely, because it is milder than it sounds and that is exactly why it gets left in place too long. Crawlers never read the stylesheet; they parse the XML underneath it, and an `<?xml-stylesheet?>` instruction a parser cannot process is ignored rather than fatal. So nothing about discovery or indexing breaks. What breaks is the human view: a URL that rendered a tidy table starts rendering the browser's raw-XML fallback, and nobody notices until someone opens the sitemap and reports it as a bug.

If you want a page a person can read, write one in HTML and link it. It costs no more than the stylesheet did, it is crawlable and linkable in its own right, and it does not depend on a feature three engines are deleting.

**This site no longer does it.** `specification.website` pointed its sitemaps at a `/sitemap.xsl` until this page changed; the processing instruction has been dropped rather than left to break.

## Common mistakes

- Listing non-canonical URLs (parameters, session IDs, alternate-case paths).
- Including URLs that return 3xx, 4xx, or 5xx — crawlers will drop trust in the whole sitemap.
- Updating `<lastmod>` on every build even when content has not changed.
- Splitting by URL hash for no reason. Split by content type or section so each sitemap is meaningful on its own.

## Verification

- Fetch the sitemap directly. Confirm `Content-Type: application/xml` and a `200 OK`.
- Validate against the sitemaps.org XSD.
- Check Search Console's Sitemaps report for parse errors and discovered-vs-indexed counts.
