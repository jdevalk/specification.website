---
title: "Resource hints overview"
slug: resource-hints
category: performance
summary: "Five resource hints — dns-prefetch, preconnect, preload, modulepreload, prefetch — cover every stage of the request lifecycle. Pick the right one for the job."
status: recommended
order: 100
appliesTo: [all]
relatedSlugs: [preload-prefetch-preconnect, font-loading, critical-css]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "W3C — Resource Hints"
    url: "https://www.w3.org/TR/resource-hints/"
    publisher: "W3C"
  - title: "MDN — <link>: The External Resource Link element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"
    publisher: "MDN"
  - title: "web.dev — Preload critical assets"
    url: "https://web.dev/articles/preload-critical-assets"
    publisher: "web.dev"
  - title: "MDN — rel=modulepreload"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/modulepreload"
    publisher: "MDN"
---

## What it is

Resource hints are `<link rel>` declarations that tell the browser to do work earlier than the HTML parser would otherwise discover it. The W3C Resource Hints specification defines four; HTML adds two more (`preload`, `modulepreload`).

| Hint | What it does | Use when |
|---|---|---|
| `dns-prefetch` | Resolve DNS for the origin. | Cheap fallback for older browsers; large numbers of secondary origins. |
| `preconnect` | DNS + TCP + TLS handshake to the origin. | You will definitely request from this origin in the next ~10 seconds. |
| `preload` | Fetch a specific resource at high priority. | Late-discovered critical resource (LCP image, font referenced from CSS). |
| `modulepreload` | Fetch and parse an ES module, including its dependency graph. | Critical JS module that would otherwise be discovered after the parser hits `<script type="module">`. |
| `prefetch` | Fetch a resource at low priority for a future navigation. | The user's next likely page (article → comments, search → first result). |

## Why it matters

The browser's parser discovers resources in source order. Anything referenced from CSS, JavaScript, or a late `<link>` is found late, after several round-trips. Hints move discovery to the start of the document so work overlaps with the rest of HTML parsing.

Used wrongly, hints **harm** performance — preloading 20 things slows the LCP element because everything fights for the same bandwidth. Treat each hint as a deliberate decision.

## How to implement

A practical decision flow:

1. **Is this for the current page?**
   - Yes → next question.
   - No, it's the next navigation → `prefetch` (as `document` for HTML, otherwise blank).

2. **Is it a specific URL the browser would otherwise discover late?**
   - Yes, and it's an ES module → `modulepreload`.
   - Yes, anything else → `preload` with the correct `as=` (image, font, style, script, fetch).
   - No, you don't know the URL yet but you know the origin → next question.

3. **How many requests will you make to that origin?**
   - 1+ — use `preconnect` (with `crossorigin` if the requests use CORS).
   - 0–1 maybe — use `dns-prefetch` only. Cheaper.

Example head with each hint serving a distinct purpose:

```html
<!-- We'll request the hero from the CDN -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin>

<!-- Analytics may or may not fire on this page -->
<link rel="dns-prefetch" href="https://stats.example.com">

<!-- Font is referenced from CSS, would be discovered late -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- LCP image, eager loading + high priority -->
<link rel="preload" href="/hero.avif" as="image" fetchpriority="high">

<!-- Critical module imported by /app.mjs -->
<link rel="modulepreload" href="/router.mjs">

<!-- After the user reads this article they often hit the next one -->
<link rel="prefetch" href="/articles/next" as="document">
```

See [preload-prefetch-preconnect](/spec/performance/preload-prefetch-preconnect/) for syntax details and gotchas.

## Common mistakes

- Preloading the same resource that is already referenced by a `<link rel="stylesheet">` higher in the head. The preload scanner finds it; the hint is noise.
- Mixing `preload` and `prefetch` semantics. `preload` is for the current page; `prefetch` is for the next one.
- Forgetting `crossorigin` on font preloads or preconnects to CORS origins.
- `modulepreload` on a non-module script. Use `preload as="script"` for classic scripts.
- More than ~5 hints in the head. Each one competes for bandwidth.

## Verification

- DevTools → Network → check the start time and priority of hinted resources. Hints should pull them left.
- Chrome console logs unused preloads after a few seconds.
- Lighthouse "Preload key requests" and "Preconnect to required origins" cover the common cases.
