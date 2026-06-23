---
title: "Back/forward cache (BFCache)"
slug: bfcache
category: performance
summary: "Keep pages BFCache-eligible so back/forward navigation restores them instantly from memory, with no reload, no hydration, and no repaint."
status: recommended
order: 110
appliesTo: [all]
relatedSlugs: [core-web-vitals, cache-control, script-loading, speculation-rules]
updated: "2026-05-29T16:40:22.000Z"
sources:
  - title: "WHATWG HTML — Navigation and session history"
    url: "https://html.spec.whatwg.org/multipage/nav-history-apis.html"
    publisher: "WHATWG"
  - title: "web.dev — Back/forward cache"
    url: "https://web.dev/articles/bfcache"
    publisher: "Google"
  - title: "MDN — bfcache"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/bfcache"
    publisher: "MDN"
  - title: "Chrome for Developers — Test back/forward cache in DevTools"
    url: "https://developer.chrome.com/docs/devtools/application/back-forward-cache"
    publisher: "Google"
---

## What it is

When the user navigates away from a page, the browser may snapshot the whole thing — DOM, JavaScript heap, scroll position, in-flight timers — into memory. On back or forward navigation, that snapshot is restored. No network request. No HTML parse. No script execution. No paint beyond compositing the existing frame.

Chrome, Firefox, and Safari all ship a BFCache (Safari has had it the longest, as "page cache"). The eligibility rules differ in the corners but the broad shape is the same: pages that look like they can be safely frozen and thawed are cached; pages that hold open connections, listen for `unload`, or are explicitly marked uncacheable are not.

This page is mostly about *not breaking* a feature you get for free.

## Why it matters

- **It is the fastest navigation the platform has.** A BFCache restore is faster than a prerendered page, faster than a service-worker cache hit, faster than anything you can build. The frame is already composited.
- **It feeds Core Web Vitals.** Field metrics count BFCache restores. A site that ships BFCache-eligible pages reports better LCP, CLS, and INP at the 75th percentile than an otherwise-identical site that disqualifies itself.
- **It costs nothing if you don't break it.** Most of the work is removing legacy patterns — an old `unload` listener, a blanket `Cache-Control: no-store` — not adding new code.

## How to implement

**Never listen for `unload`.** This is the single most common disqualifier. Use `pagehide` for cleanup and `visibilitychange` for "user left the tab" semantics. Both fire reliably and neither blocks BFCache.

**Do not set `Cache-Control: no-store` on HTML.** All major browsers refuse to cache `no-store` responses for BFCache. `no-cache` is fine — it forces revalidation on a real navigation, but the page is still eligible to be restored from memory on back/forward. See [Cache-Control](/spec/performance/cache-control/).

**Close stateful connections in `pagehide`.** Open IndexedDB transactions, WebSockets, and `BroadcastChannel`s can block eligibility or get torn down on eviction. Close them when the page hides; reopen them in `pageshow` if the page is restored.

**Handle the restore.** The `pageshow` event fires with `event.persisted === true` when the page comes back from BFCache. Treat it as "I was frozen — re-sync":

```js
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  // Restored from BFCache — re-run analytics, refresh stale UI, restart polling.
  window.dataLayer?.push({ event: "bfcache_restore" });
});
```

**Watch `window.opener` and same-origin iframes.** A page that holds a live reference to another window, or that contains a same-origin iframe with its own disqualifiers, may inherit ineligibility.

## Common mistakes

- A single `addEventListener("unload", ...)` anywhere on the page — often from a legacy analytics shim or a third-party widget. One listener disqualifies the whole document.
- `Cache-Control: no-store` applied site-wide to "be safe". It silently turns off the fastest navigation the browser has.
- Running analytics only on `DOMContentLoaded`. BFCache restores skip it, so session metrics under-report back navigations. Send a pageview on `pageshow` when `persisted` is true.
- Assuming the cache is permanent. Browsers evict aggressively under memory pressure and after a timeout (Chrome currently caps around 10 minutes). Design for "usually instant", not "always instant".
- Third-party scripts that register their own `unload` handler. Audit them; some vendors offer a `pagehide`-based mode.

## Verification

- Chrome DevTools → **Application** → **Back/forward cache** → **Test back/forward cache** runs an eligibility check on the current page and lists every disqualifying reason by name.
- The [`NotRestoredReasons` API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/notRestoredReasons) on `PerformanceNavigationTiming` reports why a back/forward navigation was *not* served from BFCache. Send it from real-user monitoring to find disqualifiers you can't reproduce locally.
- Lighthouse flags **"Page prevented back/forward cache restoration"** as a discrete audit, with the failure reason.
- Manual smoke test: load the page, navigate to any other origin, hit back. If you see a network request in DevTools, BFCache did not restore.
