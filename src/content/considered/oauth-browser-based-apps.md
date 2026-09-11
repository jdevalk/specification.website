---
title: "OAuth 2.0 for Browser-Based Applications (RFC 10017 / BCP 212)"
date: "2026-09-11"
reason: out-of-scope
revisit: "If the BCP's advice grows an artefact a site publishes — metadata declaring that its tokens are held server-side or sender-constrained, say — that artefact would be the topic. Separately, the `__Host-Http-` cookie prefix it recommends earns a line on the cookie attributes page once browsers are confirmed to enforce it."
sources:
  - title: "RFC 10017 — OAuth 2.0 for Browser-Based Applications"
    url: "https://www.rfc-editor.org/rfc/rfc10017.html"
    publisher: "IETF"
  - title: "RFC 9700 — Best Current Practice for OAuth 2.0 Security"
    url: "https://www.rfc-editor.org/rfc/rfc9700"
    publisher: "IETF"
---

RFC 10017, published in August 2026 as BCP 212, is the IETF's guidance for single-page applications that use OAuth. It ranks three architectures. In a backend-for-frontend (BFF), the server holds every token and the browser only ever sees a session cookie. A token-mediating backend obtains the tokens but hands access tokens to the browser. A purely browser-based client holds everything itself. The BCP strongly recommends the BFF for business applications, sensitive applications and anything handling personal data, and requires PKCE and rotating or sender-constrained refresh tokens whichever pattern is used.

Its central question — where the tokens live — cannot be answered from outside a site. Nothing in a response tells an observer whether an access token sits in a server session or in JavaScript memory. The document is written for the people building the OAuth client, and they are the only ones who can check it. The parts that do surface at the origin are already covered here. The BFF's cookie must be `Secure` and `HttpOnly`, and should be `SameSite=Strict` ([cookie attributes](/spec/security/cookie-attributes/)). Injected script is to be stopped with a nonce- or hash-based policy ([Content Security Policy](/spec/security/content-security-policy/)). A site that meets those two pages has done the half of the BCP that anyone else can see; the rest is architecture.

This is the line drawn for [cross-device flow security](/considered/#cross-device-flow-security): a sound best-practice document aimed at authentication engineers, with nothing of its own at the origin. One detail may still reach this spec by another route. For the BFF's cookie, the RFC recommends the `__Host-Http-` prefix, which marks a cookie as set over HTTP rather than by script. It is newer than the `__Host-` and `__Secure-` prefixes the cookie attributes page describes, and browser support for it has not yet been confirmed here.
