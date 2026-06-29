---
title: "Preload, prefetch, preconnect"
slug: preload-prefetch-preconnect
category: performance
summary: "Resource hints let you tell the browser what is coming. Preload the LCP image and critical fonts, preconnect to third-party origins, prefetch the next navigation."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [resource-hints, early-hints, core-web-vitals, font-loading]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "MDN — <link>: The External Resource Link element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"
    publisher: "MDN"
  - title: "web.dev — Preload critical assets to improve loading speed"
    url: "https://web.dev/articles/preload-critical-assets"
    publisher: "web.dev"
  - title: "web.dev — Establish network connections early to improve perceived page speed"
    url: "https://web.dev/articles/preconnect-and-dns-prefetch"
    publisher: "web.dev"
  - title: "MDN — rel=preload"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload"
    publisher: "MDN"
---

## What it is

Four `<link rel>` hints in the head tell the browser to start work earlier than the parser would:

- **preconnect** — open a TCP+TLS connection now, body comes later.
- **dns-prefetch** — resolve DNS only. The cheap fallback when preconnect is too aggressive.
- **preload** — fetch this exact resource now at high priority.
- **prefetch** — fetch this resource at low priority for a future navigation.

```html
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
<link rel="dns-prefetch" href="https://analytics.example.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.avif" as="image" fetchpriority="high">
<link rel="prefetch" href="/next-article" as="document">
```

## Why it matters

The browser only discovers resources as it parses HTML and CSS. By the time it sees a `<link rel="stylesheet">` that references a font, several round-trips have already passed. Hints move that discovery earlier — sometimes saving 200–500ms on the LCP element.

Used badly, the same hints **harm** performance by contending for bandwidth with the actual critical request. Hint sparingly.

## How to implement

**Preload the LCP image.** If your LCP is a hero image, preload it. Combine with `fetchpriority="high"` so it jumps the queue. Do not preload images that already appear early in the HTML — the preload scanner finds them anyway.

**Preload critical fonts — selectively.** Fonts requested from inside CSS are discovered late, so preloading shortens the path: `as="font" type="font/woff2" crossorigin`. The `crossorigin` attribute is mandatory even for same-origin fonts. The preload competes with critical CSS for bandwidth though, so reserve it for fonts that style above-the-fold text, and always pair with `font-display: swap` or `optional` — see [Web font loading](/spec/performance/font-loading/) for the full tradeoff.

**Preconnect to third-party origins.** If you load images from a CDN, fonts from Google, or analytics from a third party, preconnect saves the TCP+TLS handshake (~100–300ms). Use `crossorigin` for resources fetched with CORS (fonts, fetch, modules).

**Use dns-prefetch as a fallback.** Older browsers and proxies sometimes ignore preconnect. Pair it with dns-prefetch:

```html
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.example.com">
```

**Prefetch the next likely page.** On a landing page, prefetch the obvious next step. The fetch happens at low priority and won't interfere with the current page.

## Common mistakes

- Preloading 10 things. They all fight for bandwidth and nothing wins.
- Forgetting `crossorigin` on font preloads — the browser then fetches the font twice.
- Preconnecting to origins you don't actually use.
- Preloading a stylesheet then forgetting to add `<link rel="stylesheet">`. The preload sits unused; Chrome logs a warning.
- Using prefetch for the LCP image of the current page. That is preload's job.

## Verification

- DevTools → Network → look at the priority and start time of LCP and font requests.
- Chrome logs `<link rel="preload"> was preloaded using link preload but not used within a few seconds` for misused hints.
- Lighthouse "Preload key requests" and "Preconnect to required origins" surface missing hints.
