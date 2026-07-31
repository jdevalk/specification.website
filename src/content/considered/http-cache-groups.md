---
title: "HTTP Cache Groups (RFC 9875)"
date: "2026-07-23"
reason: too-early
revisit: "A mainstream cache — a browser, or any CDN — honouring the headers. Cloudflare adopting them in place of, or alongside, its proprietary Cache-Tag header would be the clearest signal."
sources:
  - title: "RFC 9875 — HTTP Cache Groups"
    url: "https://www.rfc-editor.org/rfc/rfc9875.html"
    publisher: "IETF"
  - title: "IANA — HTTP Field Name Registry"
    url: "https://www.iana.org/assignments/http-fields/http-fields.xhtml"
    publisher: "IANA"
---

RFC 9875 defines two response headers: `Cache-Groups` tags a response as belonging to one or more named groups, and `Cache-Group-Invalidation` declares a group stale. Together they let a server say "these seven URLs are one thing" — something HTTP has never been able to express, since invalidation has always been per-URL.

It is a genuinely good idea, and it is finished: Proposed Standard, published October 2025, with both field names registered permanently at IANA. The problem is that nothing appears to implement it. There is no MDN page and no Browser Compatibility Data key, no Chrome Platform Status entry, and no mention in Cloudflare's cache documentation or changelog — Cloudflare still purges by proprietary `Cache-Tag` through its dashboard and API, with no in-band header path. Fastly, Varnish, nginx and Squid show no sign of it either. The one candidate implementation, the Go cache Souin, describes its support against the pre-RFC draft.

So a page today would recommend a header that no cache on any reader's path would read. That is the opposite of what this spec is for. The standard is not the problem; the deployment is, and that can change quickly.
