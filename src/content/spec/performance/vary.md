---
title: "Vary — the cache key contract"
slug: vary
category: performance
summary: "Vary lists the request headers your server branched on when it chose this representation. Get it wrong and a cache hands one visitor's response to another; list too much and the cache stops working at all."
status: recommended
order: 51
appliesTo: [all]
relatedSlugs:
  [
    cache-control,
    conditional-requests,
    compression,
    no-vary-search,
    markdown-source-endpoints,
  ]
updated: "2026-09-10T00:00:00.000Z"
sources:
  - title: "RFC 9110 §12.5.5 — Vary"
    url: "https://www.rfc-editor.org/rfc/rfc9110#name-vary"
    publisher: "IETF"
  - title: "RFC 9111 §4.1 — Calculating Cache Keys with the Vary Header Field"
    url: "https://www.rfc-editor.org/rfc/rfc9111#name-calculating-cache-keys-with"
    publisher: "IETF"
  - title: "MDN — Vary"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary"
    publisher: "MDN"
---

## What it is

`Vary` is a response header naming the request header fields your server consulted when it picked which representation to send:

```http
Content-Type: text/markdown; charset=utf-8
Vary: Accept, Accept-Encoding
```

That response can be reused only for requests whose `Accept` and `Accept-Encoding` match the original request, allowing semantics-preserving normalisation. If no stored variant matches, the cache must forward the request.

**`Vary` is not a sibling of `Cache-Control`, and it does not mean "this changes often".** That is the belief most people arrive with, and it is the source of nearly every mistake below. `Cache-Control` decides *whether and for how long* a response may be stored. `Vary` decides *which stored response may be handed back*. Adding `Vary` does not make a response fresher, shorter-lived, or less cacheable — it files it under a longer key. Which is why getting `Vary` wrong does not show up as stale content. It shows up as a cache serving one visitor the response that was built for a different one.

RFC 9111 §4.1 spells out the matching rule: a stored response is only reusable if, for every field named in its `Vary`, the new request's value matches the original request's. `Vary: *` never matches anything, so it means "never reuse", not "vary on everything".

## Why it matters

Content negotiation without `Vary` is broken by construction. Suppose the same URL returns HTML to a browser and Markdown to an agent that sent `Accept: text/markdown`. If the response omits `Vary: Accept`, the first representation a shared cache stores is the one it returns to everybody — so either agents get HTML they asked not to receive, or visitors get raw Markdown in the browser. The origin is negotiating perfectly the whole time; only the cache in front of it is wrong, which is exactly why this survives local testing and appears in production.

The same failure with `Accept-Encoding` is uglier: a client that cannot decode Brotli is handed a Brotli body and renders nothing.

The opposite failure is cache fragmentation. Each additional field can increase the number of variants stored for a URL. Fields with many distinct values, such as `User-Agent`, can divide requests among many entries and reduce reuse. Keep the list limited to fields that affect the response, and measure the cache hit rate. RFC 9110 §12.5.5 discusses the performance cost of expanding the cache key; it does not set a maximum number of fields.

## How to implement

**List exactly what you branched on — no more, no less.** If the server chose this body by reading `Accept-Encoding`, list `Accept-Encoding`. If it did not read `Accept-Language`, do not list it because the site happens to be translated.

**Set it on every representation, including the default.** A cache that stored the HTML response *without* `Vary: Accept` will happily reuse it for a request that asked for Markdown. Both branches of a negotiation need the header, not just the interesting one.

**Verify how your cache normalises values.** RFC 9111 §4.1 permits normalisation that preserves a field's semantics, including reordering values where order is insignificant. `Accept-Encoding: gzip, br` and `Accept-Encoding: br, gzip` therefore need not create different cache entries. Whether your cache merges them depends on its implementation. If you configure a smaller set of cache-key values, make sure that requests mapped to the same key can safely receive the same response.

**Prefer distinct URLs when the representations differ substantially.** `Vary` earns its place for encodings and for format mirrors of the same document. It is a poor way to serve different languages — give each locale its own URL and wire them together with [hreflang](/spec/i18n/hreflang/), so the content is linkable, shareable, and indexable. See [international URL structure](/spec/i18n/international-url-structure/).

**Treat `Vary: Cookie` on a public page as a bug report.** It nearly always means personalisation has leaked into a document that should have been cacheable. Either mark the response `private`, or move the personal fragment to a separate client-side request and keep the page shared.

**Avoid `Vary: User-Agent`.** The one context where it is conventionally sanctioned is serving separate mobile markup from a single URL, and it costs you most of your shared caching to do it. Responsive markup removes the need entirely.

This site ships `Vary: Accept` on every spec page, because each canonical URL returns HTML or Markdown depending on what the client asked for — see [per-page Markdown source endpoints](/spec/agent-readiness/markdown-source-endpoints/).

## Common mistakes

- Negotiating on a header that is not listed in `Vary`. The most damaging error here, and invisible until a cache is in front of you.
- Adding `Vary` to the negotiated response but not to the default one.
- `Vary: User-Agent` on a responsive site. Nothing about the response actually varies; only the hit rate does.
- Assuming the CDN adds `Vary: Accept-Encoding` for you. Many normalise encoding themselves and strip or rewrite the header — verify what leaves the edge, not what leaves the origin.
- Reading `Vary: *` as "varies on everything". It means the response can never be reused from cache.
- Listing fields defensively "in case we negotiate on them later". Every unused field is a permanent tax on the hit rate.

## Verification

- `curl -sI -H 'Accept: text/markdown' https://example.com/page/` and the same request without the header: the `Content-Type` should differ and *both* responses should carry `Vary: Accept`.
- Request the same URL through your CDN with `Accept-Encoding: gzip` and `Accept-Encoding: br`, in both orders. Each response must use an encoding the client accepts; an unencoded response can also be valid. Confirm that cache reuse or edge recompression never serves an incompatible encoding, rather than assuming the CDN stores two separate bodies.
- Scan your responses for `Vary` values listing more than two fields. Each one should trace to a branch that genuinely exists in the server code.
