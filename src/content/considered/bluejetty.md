---
title: "/.well-known/bluejetty"
date: "2026-09-18"
reason: too-narrow
revisit: "The descriptor becoming something other than a pointer to one vendor's integration. If the format is handed to a standards body, or a second, unrelated company starts publishing and consuming it under the same suffix, the scope argument changes and the topic is worth re-opening."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615.html"
    publisher: "IETF"
  - title: "Registration request: bluejetty"
    url: "https://github.com/protocol-registries/well-known-uris/issues/106"
    publisher: "Well-Known URIs registry (GitHub)"
---

`bluejetty` was added to the IANA Well-Known URIs registry on 16 September 2026 as a **provisional** entry. The change controller is PopUp Space Systems LLC, trading as Blue Jetty; the registered specification is a page on that company's own documentation site. A participating publisher serves the file so that Blue Jetty's software can find that publisher's integration with the product: the response is, in the registration's own words, a bounded JSON discovery descriptor pointing at the origin's Blue Jetty app packets.

It did not land here because the registration answers the scope question itself. Filed on 7 September 2026, it states that the suffix is "an application-specific name under RFC 8615" that "does not claim a generic app, manifest, metadata, AI, or agent namespace", and asks for provisional rather than permanent status because "this is a commercial-organization specification and broad community use has not yet been established". That is an accurate and well-behaved registration — it is exactly what RFC 8615 provisional status is for. It is also a description of something that is not a property of a good website. An origin that has no relationship with this vendor has nothing to publish, and no visitor, crawler, or agent is worse off for the file's absence.

This is the fourth registration in two months to fail a scope test, and it is worth separating from the other three. [`xregistry`](/considered/#xregistry) failed on which host was expected to answer; [`webhook-authorized-senders.json`](/considered/#webhook-authorized-senders) failed because IANA permanence says nothing about adoption; [`vacation-rental.json`](/considered/#vacation-rental-json) failed on thin implementation. `bluejetty` is the reference case for the easiest of the four to check: **read the registration text before investigating further.** A suffix whose registered specification is a single company's product documentation, and whose payload is a pointer back to that company's integration, is a vendor namespace using a shared registry for its intended purpose. When the request says so in as many words, the decision is already made.
