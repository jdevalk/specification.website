---
title: "Incremental forwarding of HTTP messages (RFC 10036)"
date: "2026-09-07"
reason: too-early
revisit: "An intermediary honouring the field — a CDN documenting it, or h2o or nginx shipping support. Given that one of the authors works on h2o at Fastly, an h2o release note would be the earliest credible signal."
sources:
  - title: "RFC 10036 — Incremental Forwarding of HTTP Messages"
    url: "https://www.rfc-editor.org/rfc/rfc10036.html"
    publisher: "IETF"
  - title: "IANA — HTTP Field Name Registry"
    url: "https://www.iana.org/assignments/http-fields/http-fields.xhtml"
    publisher: "IANA"
---

RFC 10036 registers one response and request header, `Incremental`, a Structured Fields boolean. `Incremental: ?1` tells every intermediary in the chain not to buffer the whole message before forwarding it. It fills a real gap: HTTP has never had a way for an origin to say "this body is meant to be consumed as it arrives", so proxies and CDNs decide by sniffing `Content-Type` or by vendor-specific configuration. Anything streamed — server-sent events, a progressively rendered response, a long-running tool call — is at the mercy of whatever heuristic sits in front of it.

It also clears the scope bar comfortably, which is why it is worth recording rather than dismissing. The field is set by the origin, it is visible on the wire, and the outcome is one a visitor feels directly: content that appears as it is generated instead of arriving in one lump at the end.

The problem is that it was published in August 2026 and nothing appears to read it yet. There is no MDN page or Browser Compatibility Data key, no Chrome Platform Status entry, and no mention in the CDN documentation or changelogs we checked. That is unsurprising a month after publication, and the RFC itself anticipates a transition period in which unaware intermediaries simply ignore the field — but it means a page today would recommend setting a header that changes nothing on any reader's path. The standard is not the problem; the deployment has not started.
