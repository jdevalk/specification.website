---
title: "Server-Timing header"
slug: server-timing
category: performance
summary: "Server-Timing surfaces backend metrics — database time, cache hits, edge processing — in browser DevTools and to RUM via the PerformanceServerTiming API. Send it when you measure server-side latency, and keep the values free of sensitive infrastructure detail."
status: optional
order: 145
appliesTo: [all]
relatedSlugs: [core-web-vitals, cache-control, conditional-requests]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "Server Timing — the Server-Timing header field"
    url: "https://w3c.github.io/server-timing/#the-server-timing-header-field"
    publisher: "W3C"
  - title: "MDN — Server-Timing"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing"
    publisher: "MDN"
  - title: "MDN — PerformanceServerTiming"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceServerTiming"
    publisher: "MDN"
---

## What it is

`Server-Timing` is an HTTP response header that carries one or more performance metrics about how the server produced the response. Each metric has a name and optional `dur` (duration in milliseconds) and `desc` (label):

```http
Server-Timing: db;dur=53, cache;desc="hit";dur=0.4, edge;dur=12
```

The metrics show up in the browser DevTools network panel against the request, and — for same-origin responses — are readable from JavaScript through the [`PerformanceServerTiming`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceServerTiming) interface, so real-user monitoring (RUM) can collect them alongside [Core Web Vitals](/spec/performance/core-web-vitals/).

> **This site ships it.** Every response sets `Server-Timing: edge;desc="…";dur=…`, measured in the Cloudflare Pages middleware (`functions/_middleware.ts`). Open DevTools → Network, click the document request, and read the Timing tab.

## Why it matters

Browser timing APIs measure the request from the client's side — DNS, connection, time to first byte. They cannot see *why* the server took 600 ms. `Server-Timing` is the only standard channel for the server to attribute that time: how much was the database, how much was a cache miss, how much was rendering. It turns an opaque TTFB into a breakdown you can act on, both interactively in DevTools and in aggregate through RUM.

## How to implement

Emit the header from whatever produces the response — origin server, edge function, or CDN. Measure the work, then format the metrics:

```http
Server-Timing: app;desc="render";dur=42, db;dur=53, cache;desc="miss"
```

Keep names and descriptions short — they are shipped on every response, so verbosity is pure overhead. A metric may carry just a name (`cache;desc="hit"`), a duration, or both.

To read the metrics from JavaScript for RUM:

```js
const [nav] = performance.getEntriesByType("navigation");
for (const { name, duration, description } of nav.serverTiming) {
  // send {name, duration, description} to your analytics endpoint
}
```

## Common mistakes

- **Expecting cross-origin metrics to appear in JavaScript.** `PerformanceServerTiming` is same-origin only. For a CDN or third-party host, the response must send [`Timing-Allow-Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Timing-Allow-Origin) naming your origin, or `nav.serverTiming` is empty — the DevTools display still works, but automated collection silently does not.
- **Leaking infrastructure detail.** The header is visible to anyone. Internal service names, query counts, and host identifiers are an information-disclosure surface; the [spec warns about this](https://w3c.github.io/server-timing/#privacy-and-security). Send coarse labels publicly, or gate richer metrics behind authentication.
- **Sending it as a trailer expecting the Fetch API to read it.** `Server-Timing` as an HTTP trailer is consumed only by DevTools, not by `fetch()` or the Performance API.
