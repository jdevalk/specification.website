---
title: "419 Purpose Declined (draft-ietf-httpbis-pre-denied)"
date: "2026-09-11"
reason: too-early
revisit: "Registration of 419 at IANA and documented deployments using it to distinguish deliberate refusals of speculative requests in logs and monitoring. Operational adoption can establish its usefulness without new browser behaviour."
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
  - title: "HTTP Status Code Registry"
    url: "https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml"
    publisher: "IANA"
---

The draft defines status code 419 (Purpose Declined): the server is refusing a request because of the purpose it declared in its `Sec-Purpose` header. Today that purpose is `prefetch`, so in practice it means "I am declining this speculative request". The draft recommends empty responses that cannot be reused from a cache, since no one is supposed to see them. It is an HTTP Working Group document, adopted in April 2026 and revised on 9 September, intended for Proposed Standard.

The intended benefit is operational. Servers already refuse speculative requests with codes such as 503 or 403, but those responses can look like service failures or access errors in logs and monitoring. A dedicated code lets operators distinguish deliberate refusals. The draft explicitly introduces no new client capability: its usefulness does not depend on a browser handling 419 differently. Clearer diagnostics are a valid benefit in their own right.

The reason for `too-early` is its status and limited deployment evidence. It remains a draft, 419 is unassigned in the IANA registry, and we have not found documented deployments using it to make that operational distinction. The request signal also has support limits: Chromium sends `Sec-Purpose` for speculation-rules prefetches, Firefox for `<link rel="prefetch">`, and Safari only behind a flag. This site reads the header to keep prefetches out of its crawler statistics (see [speculation rules](/spec/performance/speculation-rules/)). Registration and operational adoption would justify revisiting a recommendation.
