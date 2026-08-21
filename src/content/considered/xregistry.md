---
title: "/.well-known/xregistry"
date: "2026-08-21"
reason: out-of-scope
revisit: "The document moving from the registry server to the site. If the specification — or a consumer of it — starts expecting an ordinary content origin to answer /.well-known/xregistry, rather than the registry service itself, the file becomes something a website publishes and earns a page."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "xRegistry specifications"
    url: "https://github.com/xregistry/spec"
    publisher: "xRegistry (CNCF Serverless WG)"
  - title: "xRegistry"
    url: "https://www.cncf.io/projects/xregistry/"
    publisher: "Cloud Native Computing Foundation"
---

xRegistry — "extensible registry" — is a CNCF Serverless Working Group project, a sibling of CloudEvents built largely by the same people. It "defines an abstract model for how to manage metadata about resources and provides a REST-based interface for creating, modifying, deleting and discovering of those resources", with three concrete registries layered on that model: schemas, message definitions, and messaging endpoints. The core specification and all three domain specifications sit at v1.0-rc4. The `xregistry` suffix was added to the IANA Well-Known URIs registry on 19 August 2026, with the xRegistry Authors as change controller.

It did not land here because of whose origin is expected to answer. The well-known URIs this spec covers — [`security.txt`](/spec/security/security-txt/), [`change-password`](/spec/well-known/change-password/), [`api-catalog`](/spec/well-known/api-catalog/) — are published by the site a person or a crawler visits, and a site is better or worse for serving them. `/.well-known/xregistry` is answered by a registry server: a piece of messaging infrastructure whose clients are other services, discovering event schemas and endpoints. A content site that never serves it is not thereby a worse website, and there is no visitor, crawler, or agent outcome to phrase a "Why it matters" around. That the specification is still at release candidate is a second reason to wait, but not the operative one — a 1.0 would not change the scope argument.

This is the third registration in a month to fail the same test, after `/.well-known/scitt-keys` and `/.well-known/cyclic-trigger`, so treat it as the reference case for the general rule rather than one more instance: **the Well-Known URIs registry is not a to-do list for websites.** It is a namespace shared by everything that speaks HTTP, and much of what lands in it belongs to servers that no one browses. Before a suffix earns a page here, ask which host is meant to serve it. If the answer is "an API gateway", "a registry", or "a control plane", it is out of scope no matter how permanent the registration or how healthy the standards body behind it.
