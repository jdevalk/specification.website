---
title: "Meta robots and X-Robots-Tag"
slug: meta-robots
category: seo
summary: "Every page must have an explicit, correct indexing policy — either implicit (default index, follow) on public pages, or an explicit noindex / X-Robots-Tag on staging, admin, thin, or private content. Get this wrong and you either disappear from search or expose what you didn't mean to."
status: required
order: 75
appliesTo: [all]
relatedSlugs: [robots-txt, canonical-url, redirects, soft-404, xml-sitemaps, server-side-rendering]
updated: "2026-05-29T09:55:11.000Z"
sources:
  - title: "HTML Living Standard — Standard metadata names: robots"
    url: "https://html.spec.whatwg.org/multipage/semantics.html#meta-robots"
    publisher: "WHATWG"
  - title: "Google Search Central — Robots meta tag, data-nosnippet, and X-Robots-Tag"
    url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag"
    publisher: "Google Search Central"
  - title: "Bing Webmaster — Robots meta tag"
    url: "https://www.bing.com/webmasters/help/which-robots-metatags-does-bing-support-5198d240"
    publisher: "Bing"
  - title: "MDN — <meta name=\"robots\">"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name"
    publisher: "MDN"
---

## What it is

The robots meta tag and the equivalent `X-Robots-Tag` HTTP header tell search engines and other compliant crawlers whether they may index a page, follow its links, and how to render it in results. Together they are the per-page complement to [robots.txt](/spec/seo/robots-txt/) — robots.txt controls *crawling*, robots meta controls *indexing*.

```html
<meta name="robots" content="index, follow">
<meta name="robots" content="noindex, nofollow">
<meta name="robots" content="noindex, max-image-preview:large">
```

```http
X-Robots-Tag: noindex, nofollow
X-Robots-Tag: googlebot: noindex
```

The HTTP header form is the only way to control indexing for non-HTML resources — PDFs, images, JSON endpoints, downloads.

## Why it matters

Every URL a search engine fetches has a policy, whether you set one or not. The default is `index, follow` — every fetched page becomes a candidate for the index, and every link is a discovery hop. That is right for your homepage and your articles; it is wrong for:

- **Staging and preview environments.** Forgetting `noindex` on a `staging.example.com` is a top-five SEO mistake. Once Google indexes a staging URL, it competes with production.
- **Internal search results, filtered listings, faceted-search permutations.** Infinite combinations of low-value pages dilute the site's crawl budget.
- **Thin, duplicate, or transactional pages.** Thank-you pages, cart pages, password-reset pages, account screens.
- **Pages waiting for content.** Empty category pages, "coming soon" pages.
- **Sensitive resources.** Print-only versions, internal exports, machine-readable feeds you don't want surfacing as snippets.

Public pages are required to be indexable; non-public pages are required to be non-indexable. Either way, the policy must be explicit and correct.

## How to implement

**Add the meta tag in `<head>`** for every HTML page that needs a non-default policy:

```html
<meta name="robots" content="noindex, follow">
```

`follow` keeps link equity flowing to the destinations even when the host page is not indexed. Pair it with `noindex` for staging, internal search, faceted listings.

**Use directives precisely.** The most useful ones, with the values search engines respect:

| Directive | Effect |
|---|---|
| `index` / `noindex` | Allow / disallow indexing of this page |
| `follow` / `nofollow` | Allow / disallow following links on this page |
| `noarchive` | Don't show a cached copy in results |
| `nosnippet` | Don't show a text snippet in results |
| `max-snippet:[n]` | Cap the snippet at *n* characters; `-1` means no limit |
| `max-image-preview:[none\|standard\|large]` | Control image-preview size |
| `max-video-preview:[n]` | Cap video preview at *n* seconds |
| `noimageindex` | Don't index images on this page |
| `unavailable_after:[date]` | Drop from the index after this RFC 822 / ISO 8601 date |

**Target a specific crawler when you need to.** Replace `robots` with `googlebot`, `bingbot`, `applebot`, or another user-agent token. A `robots` directive applies to all; a named-bot directive overrides it for that bot.

```html
<meta name="robots" content="noindex">
<meta name="googlebot-news" content="noindex, nofollow">
```

**Use `X-Robots-Tag` for non-HTML.** Cloudflare, Nginx, Apache, and CDN edge config can all set it per-path. Required for PDFs you don't want indexed.

```http
X-Robots-Tag: noindex, nofollow
```

**Don't combine `robots.txt: Disallow` with `noindex`.** If a URL is disallowed in robots.txt, crawlers never fetch it — and therefore never see the `noindex`. The page can still be indexed from external links, with no snippet. To truly de-index, allow crawl and serve `noindex`.

**Default policy is implicit.** A public page with no robots meta tag is `index, follow`. You do not need to add `<meta name="robots" content="index, follow">` — it's the default, and shipping it on every page is noise. Add the tag only when the policy differs.

## Common mistakes

- Staging site indexed because someone forgot to set `noindex`. Block it at the server with `X-Robots-Tag: noindex` site-wide on the staging host.
- `Disallow: /` in robots.txt on a staging site instead of `noindex`. The page may still appear in results with the URL but no snippet. Use `noindex` and let the crawler fetch and see it.
- Shipping a launch with `<meta name="robots" content="noindex, nofollow">` left over from staging. Diff every deploy.
- Conflicting directives: `<meta name="robots" content="index">` paired with `X-Robots-Tag: noindex`. The most restrictive wins; the result is usually not what was intended.
- Using `nofollow` to "save crawl budget" by stopping internal link discovery. It does not save budget; it just throws away signals.
- Relying on `noindex` to protect sensitive data. It is a request, not an access control. Use authentication.

## Verification

- View source on every key URL — confirm the `<meta name="robots">` value matches intent.
- `curl -I https://example.com/private/` — confirm `X-Robots-Tag` is set as expected.
- Google Search Console → URL Inspection. The "Indexing allowed" line is authoritative.
- After a staging deploy, search `site:staging.example.com` in Google. Zero results is the only acceptable answer.
- Audit tools (Screaming Frog, Sitebulb) export every URL's `robots` directive — review the list before launch and after major releases.
