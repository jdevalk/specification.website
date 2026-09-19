---
title: 'The "dpp" link relation (Digital Product Passport)'
date: "2026-08-01"
reason: out-of-scope
revisit: "A product page on the open web advertising its passport directly — an HTTP `Link` header, a `<link rel=\"dpp\">`, or schema.org's `hasDigitalProductPassport` in the page's structured data — rather than only a resolver behind a QR code. The vocabulary for the third route now exists; what is missing is anyone emitting it. ESPR delegated acts for textiles, footwear or batteries requiring a web-discoverable passport would produce that quickly."
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

IANA has registered `dpp` as a link relation type: "a link from a context URI that identifies a product to its digital product passport", on the authority of the UN Transparency Protocol. A Digital Product Passport is the machine-readable record of a product's materials, provenance and sustainability data that EU Ecodesign regulation will require for a widening list of categories, starting with textiles, footwear and batteries in 2026–2027. Three separate signals arrived within a few months of each other: the IANA registration, schema.org 30.0 adding EU Digital Product Passport examples aligned to UN/CEFACT codes, and the UNECE/ISO joint initiative. On the face of it that looks like a topic arriving.

The problem is where the link actually lives. UNTP does not put `rel="dpp"` on the product's web page. It puts it in a **linkset** — RFC 9264, the same media type this spec already covers under [the api-catalog](/spec/well-known/api-catalog/) — returned by an identity resolver, extending the GS1 Digital Link resolver schema. The context URI is a GS1 product identifier, the client is a scanner following a QR code on physical packaging, and the passport itself comes back as a verifiable credential. None of that is a property of a website. A spec page here would have to recommend that ordinary product pages emit a `Link: <…>; rel="dpp"` header, and nobody is doing that, because the protocol does not ask them to.

So this is not the usual too-early case of a good header nothing reads yet. It is a registered relation that is genuinely in use, in a place this spec does not describe. That could change: the regulation lands on manufacturers who already run product pages, and the cheapest way to make a passport discoverable to a crawler rather than a barcode scanner is to advertise it from the page. If that becomes the convention, it is a page — and the [`Link` header](/spec/agent-readiness/link-headers/) and [structured data](/spec/seo/structured-data/) topics are where it would connect.

**Updated 19 September 2026.** Half of that has now happened. schema.org 30.1, released on 16 September 2026, added a `DigitalProductPassport` type and a `hasDigitalProductPassport` property on both `Product` and `Offer`, alongside `EnvironmentalProductDeclaration`, `DeclarationOfConformity`, `recycledContentPercentage` and `substanceOfConcern`. That is precisely the route this entry said was missing: a product page pointing at its own passport, in markup a crawler already parses, with no resolver and no barcode in the loop. What has not happened is anyone using it. The terms sit in schema.org's pending area rather than the core vocabulary, published three days ago, and no search engine documents consuming them. The decision therefore stands — the mechanism arriving is not the same as the convention arriving — but the condition above is now one step closer to being met, and it is worth checking again when the terms graduate to core or the first ESPR delegated act bites.
