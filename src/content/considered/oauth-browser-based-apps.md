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

RFC 10017, published in August 2026 as BCP 212, is the IETF's guidance for single-page applications that use OAuth. It ranks three architectures. A backend-for-frontend (BFF) keeps tokens out of application JavaScript; the browser authenticates to it with a session cookie. A token-mediating backend obtains the tokens but hands access tokens to the browser. A purely browser-based client holds everything itself. The BCP strongly recommends the BFF for business applications, sensitive applications and anything handling personal data. Public browser clients must use PKCE and, if issued refresh tokens, those tokens must be rotated or sender-constrained. The refresh-token requirement in [RFC 9700 §2.2.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.2) applies to public clients; confidential backends authenticate when using their refresh tokens and are not universally required to rotate or sender-constrain them.

Its central recommendations concern how the OAuth client obtains, stores and uses tokens. Assessing those choices requires inspecting the application's authentication flow and implementation; published origin metadata alone does not establish compliance. Some website-level controls are already covered here. The BFF's cookie must be `Secure` and `HttpOnly`, and should be `SameSite=Strict` ([cookie attributes](/spec/security/cookie-attributes/)). A nonce- or hash-based policy helps prevent injected script from executing ([Content Security Policy](/spec/security/content-security-policy/)). These are useful checks, but meeting them does not establish compliance with the whole BCP.

This is the line drawn for [cross-device flow security](/considered/#cross-device-flow-security): a sound best-practice document aimed at authentication engineers, with nothing of its own at the origin. One detail may still reach this spec by another route. For the BFF's cookie, the RFC recommends the `__Host-Http-` prefix, which marks a cookie as set over HTTP rather than by script. It is newer than the `__Host-` and `__Secure-` prefixes the cookie attributes page describes, and browser support for it has not yet been confirmed here.
