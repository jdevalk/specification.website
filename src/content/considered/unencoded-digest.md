---
title: "Unencoded-Digest and Want-Unencoded-Digest"
date: "2026-09-10"
reason: too-early
revisit: "Reassess a general recommendation when browser support extends beyond Chromium, or a documented server/client deployment provides a practical use case to cover alongside the existing Digest Fields page."
sources:
  - title: "draft-ietf-httpbis-unencoded-digest — HTTP Unencoded Digest"
    url: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-unencoded-digest/"
    publisher: "IETF HTTP Working Group"
  - title: "IANA — HTTP Field Name Registry"
    url: "https://www.iana.org/assignments/http-fields/http-fields.xhtml"
    publisher: "IANA"
  - title: "MDN browser compatibility data — Unencoded-Digest"
    url: "https://github.com/mdn/browser-compat-data/blob/main/http/headers/Unencoded-Digest.json"
    publisher: "MDN"
  - title: "Signature-based Integrity — Unencoded-Digest validation"
    url: "https://wicg.github.io/signature-based-sri/#unencoded-digest-validation-for-sri"
    publisher: "W3C Web Incubator Community Group"
---

`Unencoded-Digest` hashes representation data before content coding, so the same digest can describe a resource served with different compression encodings. `Want-Unencoded-Digest` lets a client express its digest preferences. They complement the [Digest Fields](/spec/security/digest-fields/) page: `Content-Digest` covers message content, while `Repr-Digest` covers the selected representation, including any content coding.

Both names are **permanently registered** in IANA's HTTP Field Name Registry. Implementations also exist: MDN's compatibility data, checked on 10 September 2026, records `Unencoded-Digest` support in Chrome and Edge from version 141, with Firefox and Safari unsupported. The signature-based integrity specification defines browser validation of the field. This evidence concerns `Unencoded-Digest`; it does not establish support for its request-side companion or adoption by servers and CDNs.

The deferral is about recommending the pair generally while support remains uneven, not an absence of working code. Registration, client support and deployment answer different questions: a registry establishes the field's name and reference, compatibility data identifies supporting clients, and an operational deployment shows what a site can use today. The current evidence supports a narrower Chromium use case; revisit the scope as interoperability or documented deployment broadens.
