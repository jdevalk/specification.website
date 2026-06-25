---
title: "No-Vary-Search response header"
slug: no-vary-search
category: performance
summary: "The `No-Vary-Search` response header tells browsers and caches that some URL query parameters (tracking, UTM, sort order) do not change the response. The cached entry for the canonical URL is reused for variants — fewer fetches, better prefetch hits, less duplicate work."
status: recommended
order: 55
appliesTo: [all]
relatedSlugs: [cache-control, canonical-url, speculation-rules, view-transitions, url-structure]
updated: "2026-05-29T12:14:17.000Z"
sources:
  - title: "No-Vary-Search — WICG editor's draft"
    url: "https://wicg.github.io/nav-speculation/no-vary-search.html"
    publisher: "WICG"
  - title: "MDN — No-Vary-Search"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/No-Vary-Search"
    publisher: "MDN"
  - title: "Chrome Status — No-Vary-Search"
    url: "https://chromestatus.com/feature/5202380930678784"
    publisher: "Google"
---

## What it is

`No-Vary-Search` is a response header that tells the browser's HTTP cache (and the Speculation Rules prefetch/prerender cache) which URL query parameters are irrelevant to the response. By default, every distinct query string is treated as a distinct resource. `No-Vary-Search` lets the server say "the response for `/products?utm_source=x` is identical to the response for `/products`" without redirecting.

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
No-Vary-Search: params=("utm_source" "utm_medium" "utm_campaign" "utm_term" "utm_content"), key-order
```

The directives are small and precise:

- `params=("a" "b")` — these specific parameters do not change the response.
- `params` (no value) — none of the query parameters change the response.
- `except=("page")` — every parameter except these does not change the response (inverse form).
- `key-order` — the order of parameters in the URL does not matter.

## Why it matters

- **Prefetch hits land more often.** Pages prefetched via [Speculation Rules](/spec/performance/speculation-rules.md) only count as a hit if the final URL matches. Without `No-Vary-Search`, a click that adds `?utm_source=newsletter` misses the prefetch and re-fetches the page.
- **CDN cache hit rate improves.** The same logic applies to shared caches: declaring that tracking params do not vary the response lets one cached object serve every campaign.
- **Less duplicate work for archives and crawlers.** Search engines treat URL variants as distinct pages by default; the [canonical link](/spec/foundations/canonical-url.md) collapses them for indexing, but `No-Vary-Search` collapses them at the HTTP layer too.
- **Cheap to ship.** It is one response header. No code changes, no URL rewriting, no redirects to debug.

## How to implement

- **List the tracking parameters you actually receive.** UTMs are the universal set. Add `gclid`, `fbclid`, `msclkid`, `mc_cid`, `mc_eid`, and anything else your analytics pipeline adds and your application logic does not consume.
- **Set the header at the edge.** Like [Cache-Control](/spec/performance/cache-control/), this belongs in CDN or reverse-proxy config so it applies to every response in the matched path.

```http
No-Vary-Search: params=("utm_source" "utm_medium" "utm_campaign" "utm_content" "utm_term"
                        "gclid" "fbclid" "msclkid"), key-order
```

- **Add `key-order` unless ordering matters.** It almost never does for query strings, and it catches the common case where the same parameters arrive in different orders.
- **Apply it broadly.** Pages, RSS, JSON endpoints, static assets — anywhere a tracking parameter might end up appended.
- **Combine with [Speculation Rules](/spec/performance/speculation-rules/).** Without `No-Vary-Search`, an `eagerness: "moderate"` prefetch is wasted the moment a tracking param is added to the link.

**This site ships it.** `specification.website` sets `No-Vary-Search` on every response via [`public/_headers`](https://github.com/jdevalk/specification.website/blob/main/public/_headers), covering the common UTM parameters plus `gclid`, `fbclid`, `msclkid`, `mc_cid`, `mc_eid`, and `ref`, with `key-order` so parameter ordering is also ignored.

## Common mistakes

- Listing a parameter that does change the response. Adding `page` or `sort` to `params=` collapses different pages into one cached entry. Use `except=` to be safe when in doubt.
- Forgetting that the directive is per-response. The header has to ship on the response that should be reused; setting it only on the variant URL has no effect.
- Treating `No-Vary-Search` as a substitute for `rel="canonical"`. The two solve different problems: this one tells caches not to vary; the canonical tells search engines which URL to index. Ship both.
- Shipping the header without testing prefetch hits. Use Chrome DevTools' Application → Speculative loads panel; a hit will be labelled accordingly.

## Verification

- `curl -sI https://example.com/ | grep -i ^no-vary-search` returns the configured directives.
- In Chrome DevTools, prefetch a URL via Speculation Rules, then navigate to the same URL with extra UTM parameters appended. The Application panel logs it as a prefetch hit.
- Hit the page twice with different UTM strings while watching the CDN's cache-status header (`Cf-Cache-Status`, `X-Cache`, etc.) — both should be `HIT` after the first miss.
- A cache analytics dashboard shows fewer near-duplicate URL entries.
