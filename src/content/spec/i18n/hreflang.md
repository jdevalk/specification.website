---
title: "hreflang for language and regional URLs"
slug: hreflang
category: i18n
summary: "hreflang tells search engines which language or regional version of a page to show to which user. It uses BCP 47 codes and must be reciprocal across all alternates."
status: recommended
order: 10
appliesTo: [all]
relatedSlugs: [lang-attribute, locale-content, rtl-support, international-url-structure, sitemap-hreflang, localised-metadata, language-switcher, avoid-auto-geo-redirects]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "Google Search Central — Localized versions of your pages"
    url: "https://developers.google.com/search/docs/specialty/international/localized-versions"
    publisher: "Google Search Central"
  - title: "BCP 47 — Tags for Identifying Languages"
    url: "https://www.rfc-editor.org/info/bcp47"
    publisher: "IETF"
  - title: "W3C i18n — Choosing a language tag"
    url: "https://www.w3.org/International/questions/qa-choosing-language-tags"
    publisher: "W3C"
---

## What it is

`hreflang` is a signal that tells search engines a page has equivalent versions in other languages or regions. It lives on a `<link rel="alternate">` element, an HTTP `Link` header, or a `<xhtml:link>` entry in an XML sitemap. Each alternate carries a [BCP 47](https://www.rfc-editor.org/info/bcp47) language tag such as `en`, `en-GB`, `fr-CA`, or `zh-Hant`.

```html
<link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/" />
<link rel="alternate" hreflang="en-US" href="https://example.com/en-us/" />
<link rel="alternate" hreflang="fr-CA" href="https://example.com/fr-ca/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

`hreflang` does not declare what language a page is in. It only asserts that a set of URLs are equivalents of one another. A search engine still reads each page's actual language from its content and its [`lang` attribute](/spec/i18n/lang-attribute/), not from the tag: a self-referential `hreflang="de"` does not make a page German, and if that page in fact serves English the annotation contradicts the content rather than overriding it.

## Why it matters

Without `hreflang`, search engines guess which version of a page to surface. A user in Paris may get the US English page; a user in Quebec may get the page intended for France. `hreflang` removes that guesswork, reduces duplicate-content confusion across localised URLs, and improves click-through because the result matches the user's language and region.

It does not influence ranking on its own. It is purely a swap signal: same query, better-matched URL.

## How to implement

- **Use BCP 47 codes.** Language only (`en`, `de`), or language plus region (`en-GB`, `pt-BR`). Region alone (`hreflang="GB"`) is invalid. Script subtags are allowed where they disambiguate, e.g. `zh-Hans` and `zh-Hant`.
- **Self-reference.** Every page must list itself among its alternates.
- **Reciprocal links.** If page A points to page B, page B must point back to page A. One-way links are ignored.
- **`x-default`.** Add a `hreflang="x-default"` entry for the URL shown when no other alternate matches the user's locale. This is typically a language picker or the default-region homepage.
- **Pick one delivery method.** Use HTML `<link>` for static pages, the HTTP `Link` header for non-HTML resources such as PDFs, and the XML sitemap for sites with many alternates — mixing them on the same URL set creates conflicts.

A sitemap entry covers all alternates of a URL in one place:

```xml
<url>
  <loc>https://example.com/en-gb/</loc>
  <xhtml:link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/" />
  <xhtml:link rel="alternate" hreflang="fr-CA" href="https://example.com/fr-ca/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/" />
</url>
```

## Common mistakes

- Using a country code as a language code (`hreflang="UK"` instead of `en-GB`).
- Pointing alternates at URLs that redirect or 404.
- Forgetting the self-reference. Google then ignores the whole cluster.
- Mixing `hreflang` declarations in HTML, headers and sitemaps — pick one source of truth.
- Setting `hreflang` on canonicalised-away pages. Each alternate should be the canonical URL of its locale.
- Dropping `x-default` once two or more locales exist. Some setups emit it only when a single alternate is present, which is backwards — `x-default` is the fallback for exactly the multi-locale case where no `hreflang` matches the visitor.
