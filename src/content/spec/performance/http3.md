---
title: "HTTP/2 and HTTP/3"
slug: http3
category: performance
summary: "Serve over HTTP/2 at minimum and HTTP/3 where you can. Multiplexing eliminates head-of-line blocking; QUIC removes TCP handshake delays."
status: recommended
order: 90
appliesTo: [all]
relatedSlugs: [http1-workarounds, cache-control, compression, preload-prefetch-preconnect, compression-dictionary-transport]
updated: "2026-06-20T00:00:00.000Z"
sources:
  - title: "RFC 9114 — HTTP/3"
    url: "https://www.rfc-editor.org/rfc/rfc9114"
    publisher: "IETF"
  - title: "RFC 9113 — HTTP/2"
    url: "https://www.rfc-editor.org/rfc/rfc9113"
    publisher: "IETF"
  - title: "MDN — Evolution of HTTP"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP"
    publisher: "MDN"
  - title: "MDN — Alt-Svc"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Alt-Svc"
    publisher: "MDN"
---

## What it is

- **HTTP/1.1** (1997) — one request at a time per connection. Browsers open six parallel connections per origin to compensate. Plain text framing.
- **HTTP/2** (RFC 9113) — binary framing over a single TLS-over-TCP connection. Multiple requests interleaved (multiplexing). Header compression with HPACK.
- **HTTP/3** (RFC 9114) — same semantics as HTTP/2, but over QUIC instead of TCP. QUIC is a UDP-based transport with built-in TLS 1.3 and per-stream flow control.

HTTP/3 is advertised to clients via the `Alt-Svc` header on an HTTP/2 response:

```http
Alt-Svc: h3=":443"; ma=86400
```

After the first HTTP/2 connection, the browser remembers `Alt-Svc` and uses HTTP/3 directly for subsequent requests.

## Why it matters

HTTP/2 fixed HTTP/1.1's head-of-line blocking at the application layer: a single slow response no longer holds up the others on the connection. Combined with header compression, it typically cuts overhead by 30–50% on resource-heavy pages.

HTTP/3 fixes TCP's head-of-line blocking at the transport layer. On a lossy mobile network, a single dropped packet in TCP stalls every stream until it's retransmitted. QUIC streams are independent, so the loss only affects the one stream. HTTP/3 also handles connection migration (e.g. Wi-Fi to cellular) without dropping the connection, and reduces handshake round-trips with 0-RTT.

For users on flaky networks — the majority of mobile users globally — the difference is large and measurable.

## How to implement

**Turn it on at the edge.** Most CDNs (Cloudflare, Fastly, CloudFront, Bunny, Akamai) support HTTP/3 with a single checkbox. The TLS certificate, HSTS, and origin setup don't change.

**Require TLS.** HTTP/2 and HTTP/3 are HTTPS-only in browsers. There is no path forward without a valid certificate.

**Drop HTTP/1.1 optimisations.** Domain sharding, image sprites, and CSS concatenation were workarounds for HTTP/1.1's 6-connection limit. Under HTTP/2 they hurt: they break caching, prevent prioritisation, and inflate transfer sizes. See [HTTP/1.1 workarounds](/spec/performance/http1-workarounds/) for what to drop and why.

**Keep one origin.** HTTP/2 and HTTP/3 reward consolidation. Splitting assets across `cdn1`, `cdn2`, `assets.` forces new connections; on a single origin everything reuses the same one.

**Verify `Alt-Svc`.** If you've enabled HTTP/3 but `Alt-Svc` isn't set, browsers will never upgrade. Most edge providers add it automatically.

## Common mistakes

- TLS 1.0 or 1.1 still configured — HTTP/2 needs TLS 1.2+; HTTP/3 needs TLS 1.3.
- Domain sharding left over from HTTP/1.1 days, forcing extra connections.
- Inlining everything (CSS, JS, SVG) into HTML because that "saves a request" — under HTTP/2 it doesn't save much and it kills caching.
- Firewall or load balancer blocking UDP/443. HTTP/3 won't work and there is no error message — the browser just silently falls back to HTTP/2.

## Verification

- DevTools → Network → right-click the columns header → enable "Protocol". You should see `h2` and ideally `h3` for repeat requests.
- `curl --http3 -I https://example.com` confirms HTTP/3 is reachable.
- [https://http3check.net](https://http3check.net) and Cloudflare Radar both probe HTTP/3 support.
