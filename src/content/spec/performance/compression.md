---
title: "Compression (gzip, brotli, zstd)"
slug: compression
category: performance
summary: "Compress text responses with brotli where supported, gzip everywhere else. zstd is emerging. Don't compress already-compressed media."
status: required
order: 60
appliesTo: [all]
relatedSlugs: [cache-control, http3, conditional-requests, compression-dictionary-transport]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "RFC 7932 — Brotli Compressed Data Format"
    url: "https://www.rfc-editor.org/rfc/rfc7932"
    publisher: "IETF"
  - title: "MDN — Accept-Encoding"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding"
    publisher: "MDN"
  - title: "MDN — Content-Encoding"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding"
    publisher: "MDN"
  - title: "RFC 8878 — Zstandard Compression"
    url: "https://www.rfc-editor.org/rfc/rfc8878"
    publisher: "IETF"
---

## What it is

HTTP content encoding compresses response bodies on the server and decompresses them in the browser. The client advertises supported algorithms in `Accept-Encoding`; the server picks one and announces it in `Content-Encoding`.

```http
Request:
Accept-Encoding: br, gzip, zstd

Response:
Content-Encoding: br
Vary: Accept-Encoding
```

The common algorithms:

- **gzip** — universally supported since the late 1990s. Good ratio, fast.
- **brotli (br)** — Google, standardised as RFC 7932. 15–25% smaller than gzip for text. Supported by all modern browsers.
- **zstd** — RFC 8878. Comparable ratio to brotli with faster decompression. Supported by Chrome 123+, Firefox 126+, and Safari 26.3+ (earlier Safari cannot decode Zstandard responses).
- **deflate** — avoid. Ambiguity between raw deflate and zlib wrapping has bitten implementations for decades.

## Why it matters

Text resources — HTML, CSS, JavaScript, JSON, SVG, XML — compress to 20–30% of their original size. On a 200KB JavaScript bundle, that is 140KB saved per request, multiplied by every user. Compression is one of the cheapest performance wins available, and a Lighthouse audit failure if missing.

## How to implement

**Compress all text.** HTML, CSS, JS, JSON, SVG, XML, plain text, and most fonts (WOFF2 is already compressed; WOFF is not).

**Negotiate via `Accept-Encoding`.** Most servers and CDNs do this automatically. Configure them to prefer brotli, fall back to gzip:

- nginx: `brotli on; brotli_static on; gzip on;`
- Apache: `mod_brotli` and `mod_deflate`.
- Cloudflare, Fastly, Cloudfront: enable in the dashboard.

**Pre-compress static assets.** For files that don't change (your bundled JS), compress at build time to maximum level (brotli quality 11, gzip level 9) and let the server serve the `.br` or `.gz` file directly. Runtime compression usually runs at level 5–6 for CPU reasons.

**Set `Vary: Accept-Encoding`.** Tells CDNs to keep a separate cache entry per encoding. Without it, gzip clients may receive a brotli body they can't decode.

**Don't double-compress.** Images (JPEG, PNG, WebP, AVIF), video, fonts (WOFF2), and zip files are already compressed. Re-encoding wastes CPU and often grows the file.

## Common mistakes

- Compression off entirely. Lighthouse "Enable text compression" fails immediately.
- gzip only — a 20% saving left on the table for every brotli-capable browser.
- Compressing images or video. Pure waste.
- Missing `Vary: Accept-Encoding` behind a CDN. Cache poisoning waiting to happen.
- Brotli at quality 11 on dynamic responses. The encode cost erases the wire saving.

## Verification

- `curl -H "Accept-Encoding: br, gzip" -I https://example.com/main.css` — check `Content-Encoding`.
- DevTools → Network → response headers should show `content-encoding: br`.
- Compare Network "Size" (over the wire) vs "Resources" (decompressed). The ratio shows compression is working.
