---
title: "419 Purpose Declined (draft-ietf-httpbis-pre-denied)"
date: "2026-09-11"
reason: too-early
revisit: "The draft reaching RFC with 419 registered at IANA, and a client — a browser, or a declared-purpose crawler — treating a 419 differently from any other refusal. `Sec-Purpose` gaining a purpose beyond prefetch that sites have real reason to decline would make that far more likely."
sources:
  - title: "draft-ietf-httpbis-pre-denied — the 419 (Purpose Declined) status code"
    url: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-pre-denied/"
    publisher: "IETF"
  - title: "Fetch Standard — `Sec-Purpose` header"
    url: "https://fetch.spec.whatwg.org/#sec-purpose-header"
    publisher: "WHATWG"
  - title: "MDN — Sec-Purpose"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Purpose"
    publisher: "MDN"
---

The draft defines status code 419 (Purpose Declined): the server is refusing a request because of the purpose it declared in its `Sec-Purpose` header. Today the only purpose that header carries is `prefetch`, so in practice this is a way for a server to say "I will serve this page when someone navigates to it, but not speculatively". The response is meant to be empty and uncacheable, since no one is supposed to see it. It is an HTTP Working Group document — adopted in April 2026 and revised on 9 September — intended for Proposed Standard.

It is too early on three counts. First, it is a draft: 419 is still unassigned in the IANA status-code registry. Second, no client acts on it. A browser already discards a speculative response that is not a success, so a 419 today does exactly what a 503 or a 403 does, and no browser, CDN or crawler documents treating it any differently. Third, the header it hangs off is itself limited: `Sec-Purpose` is sent by Chromium for speculation-rules prefetches and by Firefox for `<link rel="prefetch">`, and not by Safari except behind a flag. The number carries baggage too. Laravel has long answered a failed CSRF check with an unofficial "419 Page Expired", so most 419s on the web today mean something else entirely, and the draft does not yet address that.

A site that wants to refuse speculative loads can do it now, without waiting: `Sec-Purpose` lets it tell those requests apart, and any non-success status declines them. This site reads the header for exactly that reason, to keep prefetches out of its crawler statistics (see [speculation rules](/spec/performance/speculation-rules/)). The entry is the reference case for a narrower rule than "is it final": a status code earns a recommendation only when some client behaves differently on receiving it. A new code that every client treats like an existing one gives the refusal a name, but nothing yet responds to that name.
