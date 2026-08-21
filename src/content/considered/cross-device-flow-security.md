---
title: "Cross-device flow security (RFC 10027 / BCP 247)"
date: "2026-08-21"
reason: out-of-scope
revisit: "If a site-published artefact grows around it — a well-known document, a header, or metadata declaring which cross-device flows an origin will accept — that artefact is the topic, and it would earn a page in `well-known` or `security`."
sources:
  - title: "RFC 10027 — Best Current Practice for Security of Cross-Device Flows"
    url: "https://www.rfc-editor.org/rfc/rfc10027.html"
    publisher: "IETF"
  - title: "RFC 8628 — OAuth 2.0 Device Authorization Grant"
    url: "https://www.rfc-editor.org/rfc/rfc8628"
    publisher: "IETF"
---

A cross-device flow is one where authentication starts on one device and finishes on another: scanning a QR code with a phone to sign in on a TV, or typing a short code shown on a console into a laptop. RFC 10027, published in August 2026 as BCP 247, catalogues the attacks these flows invite — largely variants of persuading someone to authorise a session they did not start — and sets out the mitigations: establish proximity where you can, keep codes short-lived and single-use, rate-limit and watch for anomalies at the authorization server, and prefer FIDO2/WebAuthn over a device authorization grant when the choice is available.

It is good advice, and it is not advice to a website. The document names its audience — architects, fraud analysts, and engineers building authentication systems — and every mitigation lands inside an authorization server or a native client. Nothing here is visible at an origin: there is no header to send, no element to emit, no resource to publish, and so nothing an outside observer could check. A site that consumes a well-implemented identity provider satisfies the BCP without doing anything, and a site that runs its own cannot express its compliance in any form this spec could describe.

This is the same line drawn for [the HTTP QUERY method](/considered/): a real standard, correctly aimed at the people who build protocol infrastructure, with no property of a good website at the other end of it. Where authentication *does* surface at the origin — the passkey-reuse assertion at [`/.well-known/webauthn`](/spec/well-known/webauthn/), the password-change hint at [`/.well-known/change-password`](/spec/well-known/change-password/), the cognitive-load rules in [accessible authentication](/spec/accessibility/accessible-authentication/) — this spec already covers it.
