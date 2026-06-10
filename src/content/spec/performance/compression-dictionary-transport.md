---
title: "Compression Dictionary Transport"
slug: compression-dictionary-transport
category: performance
summary: "Use a previously served response, or a dedicated dictionary, as a Brotli/Zstandard dictionary so updated assets compress to a fraction of their size. Pure progressive enhancement over ordinary compression."
status: optional
order: 140
appliesTo: [all]
relatedSlugs: [compression, cache-control, http3]
updated: "2026-06-10T00:00:00.000Z"
sources:
  - title: "RFC 9842 — Compression Dictionary Transport"
    url: "https://www.rfc-editor.org/rfc/rfc9842.html"
    publisher: "IETF"
  - title: "MDN — Compression Dictionary Transport"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression_dictionary_transport"
    publisher: "MDN"
  - title: "MDN — Use-As-Dictionary"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Use-As-Dictionary"
    publisher: "MDN"
---

## What it is

Ordinary [compression](/spec/performance/compression/) (gzip, brotli, zstd) shrinks each response against a small built-in dictionary. Compression Dictionary Transport, standardised as [RFC 9842](https://www.rfc-editor.org/rfc/rfc9842.html), lets the server nominate a *custom* dictionary — usually an earlier version of the same resource — so the next response only has to encode what actually changed.

A response advertises that it may serve as a dictionary:

```http
Use-As-Dictionary: match="/app/*.js"
Content-Encoding: br
```

On a later request the browser sends the dictionary's hash, and the server replies with a dictionary-compressed body:

```http
Request:
Available-Dictionary: :pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=:
Accept-Encoding: dcb, dcz, br, gzip

Response:
Content-Encoding: dcb
Vary: Accept-Encoding, Available-Dictionary
```

The two new content codings are `dcb` (Dictionary-Compressed Brotli) and `dcz` (Dictionary-Compressed Zstandard).

## Why it matters

Most deploys change a few lines in a large bundle. Against the previous build as a dictionary, the diff can compress an order of magnitude smaller than a standalone brotli pass — bytes for what changed, not the whole file. It is also pure progressive enhancement: a client that does not send `Available-Dictionary` simply receives the normal `br` or `gzip` response, so there is no fallback path to maintain and nothing breaks.

## How to implement

**Pick a dictionary strategy.** Either let a versioned asset act as the dictionary for its own successor (`match` on the URL pattern), or ship a small dedicated dictionary referenced by a `<link rel="compression-dictionary">`.

**Scope it with `match` / `match-dest`.** Restrict each dictionary to the URL patterns and request destinations it actually helps, so the browser never offers an irrelevant dictionary.

**Always vary on `Available-Dictionary`.** A cache that ignores it will hand a dictionary-compressed body to a client that lacks the dictionary, which cannot decode it.

**Lean on your CDN.** This is server- and edge-layer behaviour; most sites enable it at the CDN rather than hand-rolling the headers.

## Common mistakes

- Omitting `Available-Dictionary` from `Vary`, poisoning shared caches with undecodable bodies.
- Treating it as a substitute for ordinary compression. It is a layer on top — keep brotli/gzip on for the first, dictionary-less request.
- Over-broad `match` patterns that nominate dictionaries the browser can never use, wasting a round of negotiation.

## Verification

- `curl -H "Accept-Encoding: dcb, dcz, br" -H "Available-Dictionary: :<hash>:" -I https://example.com/app.js` — check for `Content-Encoding: dcb`.
- DevTools → Network → response headers: look for `Use-As-Dictionary` on the seed response and `dcb`/`dcz` on the follow-up.
- Browser support is still limited (Chromium-led); confirm your real audience benefits before investing in dedicated dictionaries.
