---
title: "/.well-known/vacation-rental.json"
date: "2026-09-11"
reason: too-early
revisit: "Independent implementations publishing and consuming the format beyond the project's own reference implementation, with documented interoperability. Scope is not in doubt; broader adoption is the missing evidence."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615.html"
    publisher: "IETF"
  - title: "Vacation Rental Protocol — reference implementation and adoption"
    url: "https://vacationrentalprotocol.com/"
    publisher: "Vacation Rental Protocol"
  - title: "Villa Åkerlyckan — live host discovery document"
    url: "https://villaakerlyckan.se/.well-known/vacation-rental.json"
    publisher: "Villa Åkerlyckan"
---

`vacation-rental.json` was added to the IANA Well-Known URIs registry on 19 August 2026, as a **provisional** entry pointing at a v0.1 document on `vacationrentalprotocol.com` and naming an individual as change controller. The stated purpose is discovery and configuration for vacation-rental applications: a holiday-let site would publish the file so that booking software could find out how to talk to it.

The scope test passes: this is a file an ordinary content origin would serve, like [`api-catalog`](/spec/well-known/api-catalog/) or [`nodeinfo`](/spec/well-known/nodeinfo/). There is also an implementation. The project documents a live reference implementation running on HemmaBo, and Villa Åkerlyckan's [discovery endpoint](https://villaakerlyckan.se/.well-known/vacation-rental.json) returned JSON when checked on 11 September 2026. That confirms publication of the file; it does not establish interoperability with independent booking software.

The remaining reason for `too-early` is limited independent adoption. The project's own site invites implementers to become its second independent node, and we have not found evidence of broader publishing and consumption beyond that reference implementation. A provisional registration and a working example justify watching the format. Independent implementations demonstrating that they can exchange and use the document would justify revisiting a recommendation.
