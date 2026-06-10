---
title: "Conditional requests (ETag, Last-Modified, 304)"
slug: conditional-requests
category: performance
summary: "Send a validator — ETag or Last-Modified — on every cacheable response, and honour If-None-Match / If-Modified-Since so unchanged resources return an empty 304 instead of the full body."
status: recommended
order: 52
appliesTo: [all]
relatedSlugs: [cache-control, compression, markdown-source-endpoints, stable-urls]
updated: "2026-06-09T11:00:00.000Z"
sources:
  - title: "RFC 9110 §13 — Conditional Requests"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-13"
    publisher: "IETF"
  - title: "RFC 9110 §8.8 — Validator Fields (ETag, Last-Modified)"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-8.8"
    publisher: "IETF"
  - title: "MDN — HTTP conditional requests"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests"
    publisher: "MDN"
  - title: "MDN — 304 Not Modified"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304"
    publisher: "MDN"
---

## What it is

A conditional request asks the server for a resource _only if it has changed_. The server attaches a **validator** to each response — an `ETag` (an opaque token identifying the body) or a `Last-Modified` date:

```http
ETag: "87d3702ef9500aacbb5164d5fb9d82a4"
Last-Modified: Mon, 09 Jun 2026 09:00:00 GMT
```

On the next fetch the client echoes that validator back:

```http
If-None-Match: "87d3702ef9500aacbb5164d5fb9d82a4"
If-Modified-Since: Mon, 09 Jun 2026 09:00:00 GMT
```

If the resource is unchanged, the server answers `304 Not Modified` with **empty body** and the client reuses its cached copy. If it changed, the server returns the full `200`. This is the revalidation step that `Cache-Control` defers to — see [Cache-Control headers](/spec/performance/cache-control/).

## Why it matters

`Cache-Control` decides _how long_ a cached copy stays fresh; validators decide _what revalidation costs_ once it goes stale. Without a validator, every revalidation re-downloads the whole body even when nothing changed. With one, an unchanged 2 MB asset becomes a sub-200-byte `304`. It is the difference between "is this still current?" costing a header exchange versus a full transfer.

It also matters for agents. A client polling this site's [Markdown mirrors](/spec/agent-readiness/markdown-source-endpoints/) can send `If-None-Match` and receive a `304` for content that has not changed, instead of re-parsing an identical page every cycle — cheap, polite re-fetching that pairs naturally with [stable URLs](/spec/agent-readiness/stable-urls/). This site emits validators on every response; a conditional `GET` of any unchanged asset returns `304`.

## How to implement

- **Emit a validator on cacheable responses.** Most servers and CDNs add `ETag` to static files automatically. Confirm it reaches the client and is not stripped by a proxy.
- **Prefer `ETag` over `Last-Modified`.** `Last-Modified` has one-second granularity and breaks for content that changes sub-second or has no meaningful file date. `ETag` is exact. When both are present, `If-None-Match` takes precedence.
- **Use weak ETags (`W/"…"`) for negotiated content.** A weak validator means "semantically equivalent", which is correct when the same URL is served gzip to one client and brotli to another. Pair with a correct `Vary` so caches do not cross the wires — see [compression](/spec/performance/compression/).
- **Keep the validator stable across identical bytes.** It must not change on every request (e.g. derived from a timestamp), or revalidation never short-circuits.

## Common mistakes

- No validator at all — revalidation re-downloads the full body every time.
- A **strong** ETag on content-negotiated responses, so a brotli client and a gzip client fight over one cache entry.
- ETags that vary per request (random or time-based), defeating every conditional request.
- Returning `200` with a body when the client's `If-None-Match` already matches — wasted bandwidth.

## Verification

- `curl -sI https://example.com/asset.js | grep -i etag` — confirm a validator is present.
- Re-request with it: `curl -s -o /dev/null -w "%{http_code}" -H 'If-None-Match: "…"' https://example.com/asset.js` — expect `304`.
- DevTools → Network → a revalidated resource shows status `304` and a tiny transfer size.
