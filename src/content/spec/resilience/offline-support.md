---
title: "Offline support and service workers"
slug: offline-support
category: resilience
summary: "A service worker can serve a cached offline fallback page when the network fails, keeping the site usable on flaky connections and turning hard failures into graceful ones."
status: optional
order: 30
appliesTo: [all]
relatedSlugs: [pwa-manifest, error-pages, graceful-degradation]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "MDN — Service Worker API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API"
    publisher: "MDN"
  - title: "MDN — Using Service Workers"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers"
    publisher: "MDN"
  - title: "web.dev — Offline cookbook"
    url: "https://web.dev/articles/offline-cookbook"
    publisher: "web.dev"
  - title: "W3C — Service Workers"
    url: "https://www.w3.org/TR/service-workers/"
    publisher: "W3C"
---

## What it is

A service worker is a JavaScript file that the browser runs in the background, separate from any page. It sits between the page and the network and can intercept requests, return cached responses, and respond when the network is unavailable. The minimum useful offline feature is a single cached fallback page that the worker serves when a navigation request fails.

A service worker is not an ordinary script. A normal `<script>` runs when the page loads and is gone on reload; a service worker installs once and keeps controlling later visits to the origin, mediating their requests, until the browser fetches and activates a replacement. That persistence is what makes offline support possible. It is also the catch: a bug in the worker is not fixed by deploying new HTML, because the browser keeps serving through the installed worker until a corrected one takes over. Ship a worker you can roll back.

## Why it matters

Connections drop. Mobile users walk into lifts and tunnels. Captive portals block traffic until the user logs in. Without a service worker, every one of these turns into the browser's generic "no internet" screen, with your brand nowhere in sight. A fallback page keeps the site present and gives users a clear message instead of a dead tab.

For content-heavy sites, caching previously visited pages lets users re-read articles offline. For applications, careful caching of shell HTML, CSS, and JavaScript turns the second visit into an instant load even on slow networks.

## How to implement

Register the worker once from the page:

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

The worker pre-caches a fallback page on install and serves it when a navigation request fails:

```js
// sw.js
const CACHE = 'v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    );
  }
});
```

Pick a caching strategy per resource type:

- **Cache-first** for fonts, icons, and versioned static assets. Fast, no network round-trip, fine because the URL changes on update.
- **Network-first** for HTML pages and API responses. Fresh by default, with the cache as the fallback.
- **Stale-while-revalidate** for images and non-critical content. Serve cached, then update in the background.

Always include a version string in the cache name and clean up old caches on `activate`, or you'll ship stale code on the next deploy.

## Common mistakes

- Caching the whole site indiscriminately and serving stale HTML for weeks.
- Forgetting to bump the cache version on deploy, so users never see new content.
- Registering the service worker before the page is interactive and blocking first paint.
- Caching responses with `Cache-Control: no-store` or authenticated API calls.
- No way to unregister a shipped worker. Because it outlives the deploy, plan the kill switch before you launch, not after it misbehaves.

## Verification

- DevTools → **Application** → **Service Workers**: confirm the worker is active for the scope you want.
- DevTools → **Network**: tick "Offline" and reload. The fallback page should render.
- Lighthouse PWA audit reports the offline behaviour.
- Ship a `?sw=off` kill switch that unregisters the worker, in case you need to disable it in production.
