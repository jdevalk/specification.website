---
title: "Script loading — defer, async, module"
slug: script-loading
category: performance
summary: "Choose the right script-loading attribute for every <script>: defer for app code, async for independent third-party, type=module for modern code. Bare <script> in <head> is always wrong."
status: recommended
order: 85
appliesTo: [all]
relatedSlugs: [critical-css, core-web-vitals, preload-prefetch-preconnect, resource-hints, lazy-loading]
updated: "2026-05-29T09:55:11.000Z"
sources:
  - title: "HTML Living Standard — The script element"
    url: "https://html.spec.whatwg.org/multipage/scripting.html#the-script-element"
    publisher: "WHATWG"
  - title: "MDN — <script>"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script"
    publisher: "MDN"
  - title: "Chrome for Developers — Eliminate render-blocking resources"
    url: "https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources"
    publisher: "Google"
  - title: "web.dev — JavaScript module scripts"
    url: "https://web.dev/articles/modulepreload"
    publisher: "web.dev"
---

## What it is

The `<script>` element has four loading modes that differ in *when the browser pauses HTML parsing* and *when the script runs*. Pick the wrong one and you block paint, break execution order, or ship code older browsers cannot evaluate.

```html
<!-- 1. Classic blocking — never use in <head> -->
<script src="/app.js"></script>

<!-- 2. async — parallel download, runs as soon as ready, may run before DOMContentLoaded -->
<script src="https://cdn.example.com/analytics.js" async
        integrity="sha384-OqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>

<!-- 3. defer — parallel download, runs after parsing in document order -->
<script src="/app.js" defer></script>

<!-- 4. module — parallel download, deferred by default, ESM with imports -->
<script src="/app.js" type="module"></script>
```

Plus the platform extras: `nomodule` for legacy fallback, `crossorigin` for CORS, `integrity` for [SRI](/spec/security/subresource-integrity/), `fetchpriority` for prioritisation hints, `blocking="render"` for the rare case you genuinely need a blocking script.

## Why it matters

A `<script>` in `<head>` with no `async`, `defer`, or `type="module"` halts HTML parsing while it downloads *and* executes. On a slow network, that one tag can delay the first paint by seconds. Done wrong site-wide, render-blocking scripts are the single biggest cause of poor [LCP](/spec/performance/core-web-vitals/) and the most common Lighthouse failure on real sites.

The four modes:

- **Blocking** — parser stops, browser fetches, browser executes, parser resumes. Catastrophic in `<head>`. Acceptable only for tiny inline scripts that must run before paint (e.g. a critical CSP nonce setter, a colour-scheme fix).
- **`async`** — parser does not stop; script downloads in parallel; runs as soon as it arrives, *in arrival order*, possibly mid-parse. Right for self-contained third-party code that doesn't depend on your DOM (analytics, error reporters).
- **`defer`** — parser does not stop; script downloads in parallel; runs in document order *after* the parser finishes, before `DOMContentLoaded`. Right for your application code that depends on the DOM and on other scripts in order.
- **`type="module"`** — `defer` semantics by default; supports `import`; runs in strict mode; deduplicates by URL. Right for modern ES modules.

For first-party app code, the practical answer in 2026 is almost always `type="module"` or `defer`, placed in `<head>`.

## How to implement

**Default to `<script defer src="…">` in `<head>` for app code.** It starts downloading early (parallel with HTML), runs in order, and runs before `DOMContentLoaded`. Cleaner than placing scripts at the end of `<body>`, equally non-blocking, and works in every browser that matters.

```html
<head>
  <script src="/app.js" defer></script>
  <script src="/widget.js" defer></script>
</head>
```

`app.js` runs before `widget.js`. Both run before `DOMContentLoaded`.

**Use `async` for independent third-party.** Analytics, A/B tooling, chat widgets — anything that doesn't depend on your code or DOM order. Always pair with [Subresource Integrity](/spec/security/subresource-integrity/) and `crossorigin="anonymous"` so a compromised CDN cannot ship modified code to your visitors:

```html
<script src="https://cdn.example.com/widget.js" async
        integrity="sha384-OqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
```

Some vendors (rolling-release analytics, A/B platforms) ship a script whose contents change at the vendor's discretion and therefore cannot be pinned with SRI. In that case the integrity guarantee becomes "I trust this vendor with my origin" — make that an explicit risk decision, document it, and consider a [strict CSP](/spec/security/content-security-policy/) with a per-deploy allow-list as compensating control.

If two third-party scripts depend on each other, neither can be `async`. Use `defer` on both.

**Use `type="module"` for modern code.** It's `defer` by default, supports `import`, and gives you a single canonical place for tree-shaking, code-splitting, and dynamic `import()` for route-level lazy loading.

```html
<script type="module" src="/app.js"></script>
```

**Preload module dependencies.** Modules fetched via `import` are discovered lazily — preload them so the browser starts fetching during initial parse:

```html
<link rel="modulepreload" href="/lib/router.js">
<link rel="modulepreload" href="/lib/store.js">
<script type="module" src="/app.js"></script>
```

See [resource hints](/spec/performance/resource-hints/) for the decision table.

**Drop the legacy `nomodule` shim.** Every shipping browser in 2026 supports `type="module"`. The `nomodule` fallback was useful in 2018; it now ships a second bundle for users who don't exist.

**Inline tiny critical scripts in `<head>` if and only if** they must run before paint and are small enough that the cost of inlining is less than the cost of a separate request. Theme colour application, CSP setup, FOUC prevention — yes. A 50 KB framework runtime — no.

**Combine with `fetchpriority`** for the rare case you have a script that's deferred but critical:

```html
<script src="/critical.js" defer fetchpriority="high"></script>
```

**Set CSP allow-listing and SRI** ([subresource integrity](/spec/security/subresource-integrity/)) on every third-party script. The loading attribute does not change those obligations.

## Common mistakes

- `<script src="…">` in `<head>` with no attribute. Blocks paint until the script downloads and executes.
- Scripts at the end of `<body>` instead of `<head>` with `defer`. Modern advice is `<head>` + `defer`: the browser discovers the URL earlier and starts the fetch sooner. The body-end pattern is a hold-over from when `defer` was unreliable.
- `async` on a script that depends on another `async` script. Order is racy; you may get a working build by luck on your machine and broken in production.
- Shipping the same module both as `type="module"` *and* via a separate `defer` `<script>`. It downloads and runs twice.
- Forgetting `defer` on the second of two ordered scripts. The first defers, the second is blocking — parser stops mid-execution, partial DOM exposed.
- Inline `<script>` for tracking pixels under a strict [CSP](/spec/security/content-security-policy/) without a nonce or hash. CSP blocks the inline script, the tracker doesn't fire, "why is data missing?" three months later.
- Treating `type="module"` as "must use `import`." It works fine for a single-file module too, and inherits the `defer` behaviour for free.

## Verification

- View source on every page — every `<script src>` should have `defer`, `async`, or `type="module"` unless it is a tiny inline script with a documented reason.
- Chrome DevTools → Network → JS — column "Initiator" should show the script started loading during the initial HTML parse, not after.
- Lighthouse "Eliminate render-blocking resources" reports zero offending scripts.
- WebPageTest filmstrip — the first paint should not be delayed by JavaScript download/execution.
- For CSP compatibility, run [CSP Evaluator](https://csp-evaluator.withgoogle.com/) on production headers and confirm every `<script>` is allowed.
