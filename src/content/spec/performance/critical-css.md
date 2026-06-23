---
title: "Critical CSS and render-blocking resources"
slug: critical-css
category: performance
summary: "Inline the CSS needed for above-the-fold content and defer the rest. Render-blocking resources in <head> are the single biggest cause of slow first paint."
status: recommended
order: 80
appliesTo: [all]
relatedSlugs: [core-web-vitals, font-loading, preload-prefetch-preconnect]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "web.dev — Extract critical CSS"
    url: "https://web.dev/articles/extract-critical-css"
    publisher: "web.dev"
  - title: "web.dev — Defer non-critical CSS"
    url: "https://web.dev/articles/defer-non-critical-css"
    publisher: "web.dev"
  - title: "MDN — Render-blocking resources"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Render_blocking"
    publisher: "MDN"
  - title: "Chrome for Developers — Eliminate render-blocking resources"
    url: "https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources"
    publisher: "Google"
---

## What it is

A render-blocking resource is one the browser must fetch and parse before it can paint pixels. By default, every `<link rel="stylesheet">` and every synchronous `<script>` in `<head>` blocks rendering.

**Critical CSS** is the subset of your stylesheet needed to render the visible part of the page on first load. Inlined in a `<style>` tag in `<head>`, it lets the browser paint without waiting for the full stylesheet.

```html
<head>
  <style>/* ~14KB of styles for above-the-fold content */</style>
  <link rel="preload" href="/site.css" as="style" onload="this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/site.css"></noscript>
</head>
```

## Why it matters

A typical site stylesheet is 100–300KB. On a slow connection, fetching it adds 500ms+ before any pixel appears. That delay shows up directly as poor LCP and First Contentful Paint. Render-blocking JavaScript is even worse — it blocks both parsing and rendering.

Inlining the critical CSS removes one round-trip from the critical path. The non-critical CSS still loads, but in parallel with rendering rather than ahead of it.

## How to implement

**Identify above-the-fold styles.** Tools such as `critical`, `penthouse`, and `critters` parse the rendered page and extract only the rules used in the initial viewport. Build-time generation is fine; per-page is better.

**Inline in `<head>`.** Keep the inlined CSS under ~14KB (one TCP slow-start window) so it fits in the first packet.

**Load the rest asynchronously.** The `preload` + `onload` swap shown above is the standard pattern. A `<noscript>` fallback covers browsers with JavaScript disabled.

**Move JavaScript out of the critical path.** Add `defer` or `type="module"` to script tags. Both fetch in parallel and execute after parsing:

```html
<script src="/app.js" defer></script>
<script type="module" src="/app.mjs"></script>
```

Use `async` only for truly independent third-party scripts.

**Don't block on third-party CSS.** Webfont providers, analytics dashboards, and chat widgets that drop a stylesheet in `<head>` add an unknown origin to your critical path. Self-host or load asynchronously.

**Watch the `media` attribute.** `<link rel="stylesheet" media="print">` does not block rendering. Useful for splitting print styles out.

## Common mistakes

- Inlining the entire stylesheet. The HTML balloons; nothing is cacheable across pages.
- Forgetting the `<noscript>` fallback. Users with JS off see an unstyled page.
- Loading a synchronous `<script>` tag in `<head>` for analytics. Now analytics blocks your LCP.
- Critical CSS generated once for the homepage and reused everywhere. Article pages and product pages need different critical styles.
- Mistaking `async` for `defer`. `async` can execute mid-parse and block rendering.

## Verification

- DevTools → Performance → record a load. The "Render-Blocking" badge marks every blocking request.
- Lighthouse "Eliminate render-blocking resources" lists them with estimated savings.
- View source: every non-critical `<link rel="stylesheet">` should be deferred; every `<script>` in `<head>` should have `defer` or `async`.
