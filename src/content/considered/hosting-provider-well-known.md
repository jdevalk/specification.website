---
title: "The /.well-known/hosting-provider URI"
date: "2026-09-13"
reason: out-of-scope
revisit: "Evidence of independent consumers using the endpoint in a website-facing workflow, such as routing abuse reports or identifying a support provider, with guidance for checking the hint against other evidence. That would establish a practical reason for website operators to request or publish it."
sources:
  - title: "IANA — Well-Known URIs registry (hosting-provider, provisional, registered 2020-07-21)"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "hosting-provider Well-Known Resource Identifier"
    url: "https://github.com/Automattic/hosting-provider"
    publisher: "Automattic"
  - title: "RFC 8615 — Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615"
    publisher: "IETF"
---

A CDN can obscure which hosting provider actually serves a site's content. `/.well-known/hosting-provider` is Automattic's convention for exposing that information: a participating host returns a `text/plain` string containing its URL, domain or business name, optionally identifying a reseller. The specification describes combining that hint with hostname and IP checks to identify the provider actively serving the content, even when reseller records are stale. IANA carries the suffix as provisional, registered in July 2020.

That is a concrete operational use case. The endpoint has an observable response, and an operator who controls the server can publish it or ask their hosting provider to do so. Its value is self-reported and can be spoofed, so consumers must check it against other evidence; this limits the confidence they can place in it without making the hint useless. Being configured by a host is also no reason by itself to exclude a website feature.

We leave it outside this specification because its documented purpose is provider and reseller attribution, a specialised hosting-management concern. The cited sources do not establish an independently implemented visitor or agent workflow that website operators should support by publishing it. That is a scope decision about the outcome we would recommend, rather than a claim that attribution has no benefit. A demonstrated use such as routing reports to the responsible provider would justify revisiting it, including how consumers handle incorrect or missing values.
