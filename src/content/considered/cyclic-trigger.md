---
title: "/.well-known/cyclic-trigger"
date: "2026-08-21"
reason: out-of-scope
revisit: "Evidence that this is something public sites publish for callers they do not already control, rather than a private hook between an orchestrator and its own services — and an error model that uses HTTP status codes. Both would have to change; adoption alone would not move it."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Cyclic Trigger specification"
    url: "https://github.com/SmartStandards/.well-known.cyclic-trigger"
    publisher: "SmartStandards Community"
  - title: "RFC 8615 — Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615.html"
    publisher: "IETF"
---

IANA registered `cyclic-trigger` as a provisional well-known URI suffix on 17 August 2026. The idea behind it is a reasonable one for a certain kind of deployment: rather than every service keeping a timer or a background worker alive, a service exposes `/.well-known/cyclic-trigger/go`, and external infrastructure POSTs an empty JSON object to it on whatever schedule the ecosystem decides. The trigger carries no parameters at all — it says only "here is an opportunity to run", and the receiving service decides for itself whether anything happens. In a serverless estate where idle workers cost money, that is a sensible inversion.

It is not, however, a property of a website. Nothing a visitor, a crawler or an agent does is affected by whether this endpoint exists, and nobody outside the operator's own control plane is meant to call it. The `/.well-known/` prefix makes it look like the discovery documents this spec normally covers — [security.txt](/spec/security/security-txt/), [the api-catalog](/spec/well-known/api-catalog/), [an agent card](/spec/agent-readiness/a2a-agent-cards/) — but those are files a third party fetches to learn something about the site. This is a remote procedure call that happens to have a fixed name, addressed by infrastructure that already knows the service is there. Registering a suffix reserves a path; it does not make what lives at that path a website concern, and [the well-known overview](/spec/well-known/well-known-overview/) is where that distinction is drawn.

The second problem would keep it out even if the first went away. The specification requires that failures return `200 OK` with a `fault` property in the body, explicitly to spare orchestrators from transport-level error handling. That is the [soft-404](/spec/seo/soft-404/) antipattern — which this spec marks `avoid` — generalised from one status code to all of them, and it contradicts what [error pages](/spec/resilience/error-pages/) says about signalling failure in the status line where every intermediary can see it. We would be recommending a convention that teaches the opposite of a page we already publish.

Adoption does not rescue it either. The registered reference is a two-commit GitHub repository created on 23 June 2026 and untouched since, with no stars, forks, watchers or issues, no named implementers, and no security section for an endpoint whose entire purpose is to make a service perform work on an unauthenticated POST. This entry is our reference case for a narrower rule than the usual one about adoption: a `/.well-known/` name is not automatically a website property. Some registrations are private machinery wearing a public prefix.
