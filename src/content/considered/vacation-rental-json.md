---
title: "/.well-known/vacation-rental.json"
date: "2026-09-05"
reason: too-early
revisit: "Someone using it. A booking platform, channel manager, or property-management system that publishes the file, or a consumer that fetches it — plus a specification past v0.1 with an implementers list. Adoption is the whole question here; scope is not in doubt."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615.html"
    publisher: "IETF"
  - title: "So You Want To Define a Well-Known URI"
    url: "https://mnot.net/blog/2026/well_known_uris"
    publisher: "Mark Nottingham"
---

`vacation-rental.json` was added to the IANA Well-Known URIs registry on 19 August 2026, as a **provisional** entry pointing at a v0.1 document on `vacationrentalprotocol.com` and naming an individual as change controller. The stated purpose is discovery and configuration for vacation-rental applications: a holiday-let site would publish the file so that booking software could find out how to talk to it.

Unusually for a turn-down here, the scope test passes cleanly. This is not another piece of infrastructure that happens to speak HTTP — it is a file an ordinary content origin would serve, in the same shape as [`api-catalog`](/spec/well-known/api-catalog/) or [`nodeinfo`](/spec/well-known/nodeinfo/), and a vacation-rental site that published it would be a slightly better-behaved one. It failed the other test instead: **adoption**. We could find no implementation, no consumer, and no third-party discussion of the format anywhere — the registration and the specification document appear to be the entire public footprint. The document itself was not reachable from the environment this scan runs in, so everything above is drawn from the registry entry rather than from the specification.

That combination — a website-shaped idea with nothing yet using it — is what `too-early` is for, and it is worth separating from the pile of `out-of-scope` registry entries this register has accumulated. A provisional registration is a claim on a name, not evidence that anyone answered the call; the registry records intent, and intent is not deployment. Mark Nottingham's guidance on defining well-known URIs makes the adjacent point that designers reach for the `/.well-known/` prefix partly because it makes a protocol look official — which is a good reason to read a fresh registration as an aspiration rather than a fact about the web. If a page here recommended `vacation-rental.json` today, it would be recommending that sites publish a file no software reads.
