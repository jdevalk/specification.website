---
title: "The Cache-Status header (RFC 9211)"
date: "2026-08-21"
reason: too-early
revisit: "A default-on implementation at a CDN with real market share — Cloudflare emitting `Cache-Status` alongside or instead of `CF-Cache-Status`, or Fastly turning it on without a VCL recipe. Nginx shipping it would count too."
sources:
  - title: "RFC 9211 — The Cache-Status HTTP Response Header Field"
    url: "https://www.rfc-editor.org/rfc/rfc9211.html"
    publisher: "IETF"
  - title: "IANA — HTTP Field Name Registry"
    url: "https://www.iana.org/assignments/http-fields/http-fields.xhtml"
    publisher: "IANA"
  - title: "Informing HTTP Extension Design with Data"
    url: "https://mnot.net/blog/2026/linting_the_web"
    publisher: "Mark Nottingham"
---

RFC 9211 defines a single response header, `Cache-Status`, that lets every cache on the path say what it did with a request: whether it was a hit, why it was forwarded, how much freshness is left, whether the response was stored. `Cache-Status: ExampleCache; hit; ttl=376` replaces the pile of proprietary headers — `CF-Cache-Status`, `X-Cache`, `X-Cache-Status`, `X-Served-By` — that each express a slice of the same thing in a different vocabulary. It is a Standards Track document from June 2022, it uses structured fields, and its authors work at Cloudflare, Akamai and Fastly.

The problem is that the people who wrote it have largely not shipped it on by default. Mark Nottingham's August 2026 survey of 120 million responses from the Tranco top 100,000 found roughly 1.1 million `Cache-Status` instances against tens of millions of proprietary equivalents — about a thirtyfold gap. Squid and Caddy's cache handler have built-in support and Fastly can be made to emit it with a recipe, but Cloudflare still leads with `CF-Cache-Status` and nginx has no native path. A reader who followed our advice would be configuring a header by hand that their CDN does not produce and their monitoring does not parse.

There is a second, more interesting reason to wait, and it is the one that generalises. `Cache-Status` is a debugging channel: it explains the cache to whoever is looking at the response, which in practice is the operator, not the visitor. We already carry [Server-Timing](/spec/performance/server-timing/) on those grounds, so the shape is not disqualifying — but Server-Timing has no incumbent, and this does. A page that tells people to add a standard header their CDN will not emit, next to the proprietary one it already emits, asks them to run two vocabularies to describe one cache. That is worth recommending once the standard one wins, and not before.
