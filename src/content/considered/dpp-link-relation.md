---
title: "Digital Product Passport discovery"
date: "2026-09-23"
reason: too-early
revisit: "Documented use of passport links or schema.org's hasDigitalProductPassport on public product pages, together with an independent consumer that discovers and uses those links. A resolver implementation alone does not establish adoption of the on-page convention."
sources:
  - title: "IANA Link Relation Types registry — dpp"
    url: "https://www.iana.org/assignments/link-relations/link-relations.xhtml"
    publisher: "IANA"
  - title: "schema.org — hasDigitalProductPassport"
    url: "https://schema.org/hasDigitalProductPassport"
    publisher: "schema.org"
  - title: "UN Transparency Protocol — Identity Resolver"
    url: "https://untp.unece.org/docs/specification/IdentityResolver/"
    publisher: "UNECE"
  - title: "RFC 9264 — Linkset: Media Types and a Link Relation Type for Link Sets"
    url: "https://www.rfc-editor.org/rfc/rfc9264.html"
    publisher: "IETF"
---

Digital Product Passport discovery has two relevant forms. The registered `dpp` link relation connects a product identifier to its passport. The UN Transparency Protocol describes returning such links in an identity resolver's **linkset**, using RFC 9264, which this spec also covers under [the api-catalog](/spec/well-known/api-catalog/). That resolver workflow addresses specialised product infrastructure; it does not by itself establish what an ordinary product page should publish. UNTP is scheme-neutral: GS1 identifiers and QR codes are examples, not requirements for every resolver.

An on-page route is now available. [Schema.org 30.1](https://schema.org/docs/releases.html), released on 16 September 2026, added `DigitalProductPassport` and `hasDigitalProductPassport` for `Product` and `Offer`. The property accepts a URL or a nested passport object, so a product page can advertise a passport in its [structured data](/spec/seo/structured-data/). Schema.org currently marks the term as being in its “new” area and asks for implementation feedback. This makes website-level discovery relevant to the spec, even though the resolver-specific workflow remains outside its general recommendations.

The decision is now **too early** for a standalone page about on-page discovery. The sources reviewed establish the vocabulary and resolver mechanisms, but do not establish broad adoption by public product pages and independent consumers of their passport markup. That is an evidence gap, not proof that nobody uses it. Documented publisher and consumer implementations would justify revisiting a recommendation connected to the [Link header](/spec/agent-readiness/link-headers/) and structured-data topics.
