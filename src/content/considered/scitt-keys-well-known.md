---
title: "The /.well-known/scitt-keys URI"
date: "2026-08-14"
reason: too-narrow
revisit: "If serving a transparency-service endpoint ever becomes a normal part of publishing a website rather than of running supply-chain infrastructure. The likelier neighbour is content provenance — a C2PA-style manifest attached to the images and text a site actually publishes — and that would be its own page, not this one."
sources:
  - title: "IANA — Well-Known URIs registry (scitt-keys, registered 2026-07-01)"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "draft-ietf-scitt-scrapi — SCITT Reference APIs"
    url: "https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/"
    publisher: "IETF"
  - title: "RFC 9943 — An Architecture for Trustworthy and Transparent Digital Supply Chains"
    url: "https://www.rfc-editor.org/rfc/rfc9943.html"
    publisher: "IETF"
---

SCITT — Supply Chain Integrity, Transparency and Trust — gives software supply chains an append-only, auditable record. A publisher signs a statement about an artefact, a transparency service records it on a verifiable data structure, and the publisher gets back a receipt proving the registration happened. RFC 9943 published that architecture as a Proposed Standard in June 2026; the companion SCITT Reference APIs draft defines `/.well-known/scitt-keys`, which a transparency service serves so that relying parties can fetch the public keys needed to verify those receipts. IANA registered the suffix on 1 July 2026.

The registration is what brought it into view here, because new well-known URIs are exactly what this spec watches for. But the registry is not a scope boundary — it holds well-known URIs for smart inverters and for job-posting feeds too. The question is who serves the file, and the answer is a transparency service: a piece of supply-chain infrastructure, operated by whoever runs the ledger. It is not something a website serves alongside its `security.txt`. A site that publishes to a transparency service is a *client* of one of these endpoints, never the host of one.

That distinction is the useful part, and it generalises past SCITT. `/.well-known/` is a shared namespace, not a list of things every origin should have, and a suffix landing in the registry says only that somebody needed a stable path — not that the somebody was a website. The test that matters is whether serving the file makes *this* origin better for its visitors, crawlers, or agents. For [`security.txt`](/spec/well-known/security-txt/) or [`change-password`](/spec/well-known/change-password/) it plainly does. For `scitt-keys` it plainly does not, and no amount of adoption among ledger operators would change that — which is why the reason here is scope, not timing.
