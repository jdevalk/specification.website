---
title: 'The "_for-sale" DNS node name (RFC 10023)'
date: "2026-08-02"
reason: too-narrow
revisit: "Registrars, parking providers or domain marketplaces publishing it by default, and buyer-side tooling reading it. At that point it becomes a discovery convention with an audience, and the page would sit alongside the other DNS-level signals."
sources:
  - title: 'RFC 10023 — The "_for-sale" Underscored and Globally Scoped DNS Node Name'
    url: "https://www.rfc-editor.org/rfc/rfc10023.html"
    publisher: "IETF"
  - title: "RFC 8552 — Scoped Interpretation of DNS Resource Records through Underscored Node Names"
    url: "https://www.rfc-editor.org/rfc/rfc8552"
    publisher: "IETF"
---

RFC 10023, published as Informational in July 2026 by SIDN Labs, reserves the underscored node name `_for-sale` so a domain holder can advertise that the parent domain is available for purchase. A TXT record at `_for-sale.example.com` carries tag-value pairs — `ftxt=` for human-readable text, `furi=` for a contact URI, `fval=` for an asking price, `fcod=` for a proprietary code. It needs no protocol change and can sit on a domain that is still in active use.

It is externally checkable, which is the test this spec normally applies to DNS-level conventions, and on that count it passes where an HTTP method or a CSS feature would not. What it does not pass is the question of who it is for. Every other signal we spec — CAA, DNSSEC, DNS-AID — tells a visitor, a resolver or an agent something about the site that is there. This one tells a prospective buyer something about the domain, which is a fact about a commercial transaction happening beside the website rather than a property of the website. A good website is not improved by being for sale.

Adoption is the second problem and currently the simpler one: the RFC documents a proposed convention rather than an established practice, and states no deployments. Both objections would have to fall away together — a registrar ecosystem publishing it, and a reason to describe it as something a site does rather than something its owner does — before this is a page. The narrow-audience objection is the one that would need the better argument.
