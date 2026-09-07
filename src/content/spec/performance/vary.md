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
updated: "2026-09-07T00:00:00.000Z"
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
  - title: "Informing HTTP Extension Design with Data"
    url: "https://mnot.net/blog/2026/linting_the_web"
    publisher: "Mark Nottingham"
---

## What it is

`Vary` is a response header naming the request header fields your server consulted when it picked which representation to send:

```http
Content-Type: text/markdown; charset=utf-8
Vary: Accept, Accept-Encoding
```

That response says: the body you are holding is the right answer for a request whose `Accept` and `Accept-Encoding` looked like this one's. For any other combination, ask the origin again.

**`Vary` is not a sibling of `Cache-Control`, and it does not mean "this changes often".** That is the belief most people arrive with, and it is the source of nearly every mistake below. `Cache-Control` decides *whether and for how long* a response may be stored. `Vary` decides *which stored response may be handed back*. Adding `Vary` does not make a response fresher, shorter-lived, or less cacheable — it files it under a longer key. Which is why getting `Vary` wrong does not show up as stale content. It shows up as a cache serving one visitor the response that was built for a different one.

RFC 9111 §4.1 spells out the matching rule: a stored response is only reusable if, for every field named in its `Vary`, the new request's value matches the original request's. `Vary: *` never matches anything, so it means "never reuse", not "vary on everything".

## Why it matters

Content negotiation without `Vary` is broken by construction. Suppose the same URL returns HTML to a browser and Markdown to an agent that sent `Accept: text/markdown`. If the response omits `Vary: Accept`, the first representation a shared cache stores is the one it returns to everybody — so either agents get HTML they asked not to receive, or visitors get raw Markdown in the browser. The origin is negotiating perfectly the whole time; only the cache in front of it is wrong, which is exactly why this survives local testing and appears in production.

The same failure with `Accept-Encoding` is uglier: a client that cannot decode Brotli is handed a Brotli body and renders nothing.

The opposite failure is quieter and far more common. Every field you add to `Vary` multiplies the number of stored entries for that URL, and a cache entry that is never matched twice is worse than no cache at all — you paid the storage and still went to origin. `Vary: User-Agent` is the canonical example: user-agent strings are close to unique, so a shared cache ends up storing a copy per browser build and reusing almost none of them. RFC 9110 §12.5.5 is explicit that a `Vary` value "SHOULD NOT include an excessive number of fields", precisely because of this.

It is not a theoretical concern. Mark Nottingham's 2026 analysis of Common Crawl responses across the Tranco top 100,000 sites found around 26% of responses varying on more than one axis, roughly 3,000 sites listing four or more, and outliers reaching 47. At that width the cache is an expensive pass-through with a storage bill.

## How to implement

**List exactly what you branched on — no more, no less.** If the server chose this body by reading `Accept-Encoding`, list `Accept-Encoding`. If it did not read `Accept-Language`, do not list it because the site happens to be translated.

**Set it on every representation, including the default.** A cache that stored the HTML response *without* `Vary: Accept` will happily reuse it for a request that asked for Markdown. Both branches of a negotiation need the header, not just the interesting one.

**Normalise before you branch.** The comparison in RFC 9111 §4.1 permits only whitespace changes, combining repeated field lines, and normalisation the field's own specification defines as semantics-preserving. It does not reorder lists for you, so `Accept-Encoding: gzip, br` and `Accept-Encoding: br, gzip` are two keys for one answer. Where your CDN can collapse a header to a small set of buckets before the cache lookup, do that.

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
- Request the same URL twice through your CDN with `Accept-Encoding: gzip` and `Accept-Encoding: br`. Each response's `Content-Encoding` must match what was asked for, and the cache-status header should show two separate entries rather than one.
- Scan your responses for `Vary` values listing more than two fields. Each one should trace to a branch that genuinely exists in the server code.
