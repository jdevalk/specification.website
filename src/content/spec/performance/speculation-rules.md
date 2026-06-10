---
title: "Speculation Rules"
slug: speculation-rules
category: performance
summary: "Tell the browser which links to prefetch or prerender before the user clicks. Done well, navigations feel instant; done carelessly, you burn bandwidth on pages nobody visits."
status: recommended
order: 95
appliesTo: [all]
relatedSlugs: [core-web-vitals, preload-prefetch-preconnect, view-transitions, http3, resource-hints, no-vary-search]
updated: "2026-06-10T00:00:00.000Z"
sources:
  - title: "MDN — Speculation Rules API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API"
    publisher: "MDN"
  - title: "WHATWG HTML — Speculative loading"
    url: "https://html.spec.whatwg.org/multipage/speculative-loading.html#speculative-loading"
    publisher: "WHATWG"
  - title: "Chrome for Developers — Speculation Rules"
    url: "https://developer.chrome.com/docs/web-platform/prerender-pages"
    publisher: "Google"
  - title: "web.dev — Prefetching, prerendering, and service worker precaching"
    url: "https://web.dev/learn/performance/prefetching-prerendering-precaching"
    publisher: "web.dev"
---

> **This site ships it.** Every page emits a `<script type="speculationrules">` block from `BaseLayout.astro` — `prerender` on `moderate` for HTML same-origin links, `prefetch` on `conservative` as a fallback. The CSP allows the block via `'inline-speculation-rules'` (no `'unsafe-inline'`), and our bot logger drops requests with `Sec-Purpose: prefetch` so the stats stay honest.

## What it is

Speculation Rules let a page declare, in a structured way, which URLs the browser should **prefetch** (download the response in advance) or **prerender** (download *and* render the full page in a hidden background tab). When the user actually clicks, the navigation can complete in milliseconds because the work is already done.

The rules live in a `<script type="speculationrules">` block:

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": { "href_matches": "/spec/*" },
    "eagerness": "moderate"
  }],
  "prefetch": [{
    "where": { "href_matches": "/*" },
    "eagerness": "conservative"
  }]
}
</script>
```

`eagerness` ranges from `conservative` (only on hover/touch) to `eager` (as soon as the rule is parsed). `moderate` is the sensible default — Chromium triggers on hover-with-intent and pointerdown.

This supersedes the older `<link rel="prerender">` hint, which has been removed from the platform.

## Why it matters

- **Sub-100ms navigations.** A prerendered page activates in single-digit milliseconds when the user clicks. It feels like the same page, not a navigation.
- **Improved INP and LCP on the next page.** Because the work is already done, the metrics on the destination page record near-zero delay.
- **Declarative.** No JavaScript event handlers, no IntersectionObserver, no custom hover-detection — the browser implements the heuristics.

Cross-site prerender is gated on Chrome's [No-Vary-Search](https://developer.chrome.com/blog/no-vary-search) and additional restrictions; same-site is the realistic target for most sites.

## How to implement

**Start small.** Prerender only the obvious next pages — the main nav links from the homepage, the next page in a paginated list, the most-clicked CTA. Prerendering everything wastes data on links nobody clicks.

**Prefer `moderate` eagerness over `eager`.** It limits speculation to links the user is about to interact with.

**Combine prefetch + prerender.** Prefetch broadly (cheap), prerender narrowly (expensive). The rules above show the pattern.

**Handle JavaScript correctly.** Prerendered pages run their JS in a hidden, non-active context. Wait for the [`prerenderingchange`](https://developer.mozilla.org/en-US/docs/Web/API/Document/prerenderingchange_event) event before running analytics, starting media, or anything user-visible:

```html
<script>
if (document.prerendering) {
  document.addEventListener('prerenderingchange', () => init(), { once: true });
} else {
  init();
}
</script>
```

**Pair with [view transitions](/spec/performance/view-transitions/)** for cross-document animations on prerendered navigations — together they make MPA navigations feel like an SPA.

**Don't speculate on URLs with side effects.** Logout endpoints, "delete" actions, payment flows. Use `urls`/`href_matches` carefully and exclude them.

## Common mistakes

- `eagerness: "eager"` on every link in the nav. Burns bandwidth and DB load.
- Prerendering pages whose analytics fire on script load instead of `prerenderingchange` — every prerender now counts as a fake pageview.
- Speculation rules that prefetch a page the server treats as cacheable but personalises silently (e.g. session-dependent content). The user lands on stale data.
- Forgetting that prerender is currently Chromium-only. Other browsers ignore the rules entirely — there is no regression, but the upside is browser-specific. Don't take a hard dependency on it.
- Conflicting `Cache-Control: no-store` headers on the target page. Browsers refuse to prerender no-store responses by design.

## Verification

- Chrome DevTools → Application → Speculative Loads. Lists every rule, what it matched, and whether the prerender succeeded.
- `chrome://prerender-internals` for low-level state.
- After implementation, the "Next-page navigation" line in Chrome User Experience Report drops sharply.
- Lighthouse does not yet score speculation rules directly, but field LCP/INP on landing pages reached via speculated navigations should improve.
