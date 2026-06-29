---
title: "103 Early Hints"
slug: early-hints
category: performance
summary: "An informational HTTP response that carries Link headers — preload, preconnect — to the browser before the final response is ready, putting server think-time to work."
status: optional
order: 45
appliesTo: [all]
relatedSlugs: [resource-hints, preload-prefetch-preconnect, http3, server-timing]
updated: "2026-06-29T00:00:00.000Z"
sources:
  - title: "RFC 8297 — An HTTP Status Code for Indicating Hints"
    url: "https://www.rfc-editor.org/rfc/rfc8297.html"
    publisher: "IETF"
  - title: "RFC 8288 — Web Linking (the Link header field)"
    url: "https://www.rfc-editor.org/rfc/rfc8288.html"
    publisher: "IETF"
  - title: "MDN — 103 Early Hints"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/103"
    publisher: "MDN"
  - title: "Chrome for Developers — Faster page loads using server think-time with Early Hints"
    url: "https://developer.chrome.com/docs/web-platform/early-hints"
    publisher: "Google"
---

## What it is

`103 Early Hints` is an informational HTTP status code, defined in RFC 8297. The server sends it _before_ the final response, carrying `Link` header fields that point at resources the final page will need. The browser can act on those hints immediately — opening connections, fetching stylesheets and fonts — while the server is still assembling the real response.

```http
HTTP/2 103 Early Hints
Link: </style.css>; rel=preload; as=style
Link: <https://cdn.example.com>; rel=preconnect

HTTP/2 200 OK
Content-Type: text/html; charset=utf-8
Link: </style.css>; rel=preload; as=style
...
```

This is the over-the-wire counterpart to the `<link rel>` hints described in [resource hints](/spec/performance/resource-hints/): same `rel` keywords, sent ahead of the response instead of waiting in the document head.

## Why it matters

Most pages spend their first moments on _server think-time_ — the database query, the template render, the upstream API call — during which the connection is idle and the browser has nothing to do. Early Hints fills that gap. By the time the `200 OK` arrives, the critical CSS may already be cached and the CDN connection already open, so the browser parses straight through instead of stalling on round-trips. The win is largest exactly where it hurts most: slow backends and high-latency connections.

## How to implement

- Emit a `103` response carrying `Link: …; rel=preload` or `rel=preconnect` for the handful of resources the page genuinely needs first — the LCP image, the critical stylesheet, a font origin.
- Repeat the same `Link` headers on the final response, so clients that ignore `103` still get the hint.
- Only send `103` over **HTTP/2 or later**. Some HTTP/1.1 intermediaries mishandle informational responses, so most clients act on Early Hints only over [HTTP/2 or HTTP/3](/spec/performance/http3/).
- Hint sparingly. As with any preload, hinting twenty things just makes them fight for bandwidth.

Many CDNs and edge platforms can synthesise the `103` automatically from the `Link` headers you already set on the final response, so this is often a configuration toggle rather than application code.

## Common mistakes

- Hinting resources the page does not use early, wasting bandwidth and warming the wrong connections.
- Sending `103` over HTTP/1.1, where intermediaries may corrupt the response.
- Treating it as a replacement for in-document hints — it complements them; keep the `<link rel>` tags too.

## Verification

- DevTools → Network: a hinted resource starts loading before the document response completes, and its initiator is the Early Hints response.
- `curl -I --http2` against the URL shows the `103` block ahead of the `200`.
- Browser support is uneven — Chromium acts on `103`; other engines currently ignore it harmlessly — so measure the gain, treat it as a progressive enhancement, and never depend on it.
