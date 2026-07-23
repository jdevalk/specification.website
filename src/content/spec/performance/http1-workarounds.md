---
title: "HTTP/1.1 workarounds: sharding, sprites, and bundling"
slug: http1-workarounds
category: performance
summary: "Domain sharding and image sprites were workarounds for HTTP/1.1's connection limit; under HTTP/2 and HTTP/3 they hurt — drop them. Bundling is the nuanced one: stop concatenating to cut requests, start doing it to cut bytes."
status: avoid
order: 92
appliesTo: [all]
relatedSlugs: [http3, image-optimization, critical-css, script-loading, compression-dictionary-transport]
updated: "2026-06-20T00:00:00.000Z"
sources:
  - title: "RFC 9113 — HTTP/2"
    url: "https://www.rfc-editor.org/rfc/rfc9113"
    publisher: "IETF"
  - title: "MDN — Evolution of HTTP"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP"
    publisher: "MDN"
  - title: "MDN — Connection management in HTTP/1.x"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x"
    publisher: "MDN"
---

## What it is

Three habits were invented to dodge one HTTP/1.1 limitation: a browser opens only about six parallel connections per origin, and each connection carries one request at a time.

- **Domain sharding** — splitting assets across extra hostnames (`cdn1.example.com`, `cdn2.example.com`, `assets.example.com`) so the browser opens more connections in total.
- **Image sprites** — combining many small images into one big sheet and using CSS `background-position` to show slices, turning dozens of requests into one.
- **Concatenation** — bundling many CSS or JS files into one file, again to cut the request count.

[HTTP/2 and HTTP/3](/spec/performance/http3/) multiplex unlimited concurrent requests over one connection, so the request count is no longer the thing to optimise for. **Sharding and sprites are now net-negative — drop them. Bundling is different**: the old reason for it is gone, but a new one — compression — has taken its place.

## Why it matters

Sharding and sprites actively fight a multiplexed connection:

- **Sharding** adds DNS lookups, TLS handshakes, and connections, and defeats HTTP/2's single-connection coalescing — the very thing that makes it fast. QUIC's connection migration and 0-RTT only help when traffic stays on one origin.
- **Sprites** force every page to download every icon, including ones it never shows, and bust the whole sheet when one icon changes. Individual images, inline SVG, or an icon font are smaller and cache better.

Bundling is the nuanced case. Stop concatenating to cut requests; that is free now. But compression ratio rises sharply with input size — Brotli and Zstd share a dictionary across the whole stream — so many tiny files each compress in their own weak context and lose to a few larger ones, which also cut per-file parse and decompression overhead. Set against that, one giant bundle busts its cache entry on every edit and ships code for routes the visitor never opens.

## How to implement

Drop sharding (consolidate onto one origin) and sprites (use individual images, inline SVG, or an icon font; [lazy-load](/spec/performance/lazy-loading/) what is below the fold). For bundling, decide by **what blocks paint and what busts the cache, not by request count**:

- **Inline what blocks paint.** Put the [critical, above-the-fold CSS](/spec/performance/critical-css/) in the `<head>` so first paint needs zero extra requests.
- **Concatenate what compresses.** Bundle JS — and the non-critical CSS — into a few files; bigger inputs compress better and parse with less overhead.
- **Split what changes.** Keep frequently-changing code out of long-lived bundles (a stable vendor bundle separate from app code, large routes split out) so one edit does not invalidate the whole download. [Compression Dictionary Transport](/spec/performance/compression-dictionary-transport/) gives cross-version redundancy without a single monolith.

**The default, for most sites: inline all your CSS and ship one JS bundle.** Only split CSS once it grows large enough that re-shipping it inline on every page costs more than the request you save, and only split JS once one bundle is big enough that per-deploy cache-busting or unused-route code costs more than the compression win. Bias toward inlining and concatenating; break the default on measurement, not by reflex.

## Common mistakes

- Carrying a sprite sheet or domain-sharding config forward from an old build without re-checking whether it still helps. It doesn't.
- Splitting JS into hundreds of tiny modules "because HTTP/2 makes requests free" — true for the request, but you lose compression efficiency and add parse overhead.
- Inlining *all* CSS on a large multi-page site — inlined bytes are never cached across navigations, so past a few kilobytes you want the non-critical part in a cached file.

## Verification

- Count hostnames serving static assets. More than one origin for the same site is a sharding smell.
- Look for a single large `sprite.png` / `icons.png` — a candidate to split into real images.
- Check that critical CSS is inline in the HTML and that JS ships as a small number of bundles, not one monolith and not a swarm of modules.
