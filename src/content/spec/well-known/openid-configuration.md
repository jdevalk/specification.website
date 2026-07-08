---
title: "/.well-known/openid-configuration"
slug: openid-configuration
category: well-known
summary: "A JSON discovery document that describes an OpenID Connect provider's endpoints and capabilities. Only required if you are an OIDC identity provider."
status: optional
order: 30
appliesTo: [all]
relatedSlugs: [well-known-overview, oauth-authorization-server, oauth-protected-resource]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "OpenID Connect Discovery 1.0"
    url: "https://openid.net/specs/openid-connect-discovery-1_0.html"
    publisher: "OpenID Foundation"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "RFC 8414 — OAuth 2.0 Authorization Server Metadata"
    url: "https://www.rfc-editor.org/rfc/rfc8414"
    publisher: "IETF"
---

## What it is

`/.well-known/openid-configuration` is a JSON document published by an OpenID Connect (OIDC) provider that describes how clients can interact with it. A relying party fetches this URL, parses the response, and then knows where to send authorisation requests, where to exchange tokens, how to verify signatures, and which features the provider supports.

The format is defined by **OpenID Connect Discovery 1.0**. A closely related document for plain OAuth 2.0 lives at `/.well-known/oauth-authorization-server` (RFC 8414).

## Why it matters

- **Zero hand-configuration.** A client only needs your issuer URL. It discovers everything else from this document.
- **Key rotation works.** The `jwks_uri` is the canonical source for signing keys. Rotate keys there and every client picks up the change.
- **Capability negotiation.** Clients see which scopes, claims, response types and signing algorithms you support, and behave accordingly.
- **Standardisation.** Every major identity library (Auth0, Okta, Keycloak, Microsoft Entra, Google, etc.) consumes this format. You do not have to write client SDKs.

Only publish this if you actually run an OIDC identity provider. A site that uses "Sign in with Google" is a relying party, not a provider, and should not expose this URL.

## How to implement

Serve the file as `application/json` from your issuer's origin. The minimum useful payload looks roughly like this:

```json
{
  "issuer": "https://login.example.com",
  "authorization_endpoint": "https://login.example.com/oauth2/authorize",
  "token_endpoint": "https://login.example.com/oauth2/token",
  "userinfo_endpoint": "https://login.example.com/oauth2/userinfo",
  "jwks_uri": "https://login.example.com/oauth2/jwks",
  "response_types_supported": ["code", "id_token", "code id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"]
}
```

Rules:

- The `issuer` value must **exactly match** the URL clients use, including scheme and absence of trailing slash. Mismatches are the single most common cause of "invalid issuer" errors.
- Always serve over **HTTPS**.
- Set `Cache-Control` sensibly — minutes to hours, not days. Clients re-fetch on errors.
- The `jwks_uri` must be reachable and return current signing keys.

## Common mistakes

- Publishing the file but having clients fail with "issuer mismatch" because the URL differs by a trailing slash, port number, or hostname casing.
- Exposing a stale `jwks_uri` after rotating keys.
- Marking the file as `text/html` because a framework rendered it as a page.
- Treating the file as static when endpoints actually move. If you change endpoints, change the file.

## Verification

```
curl -s https://login.example.com/.well-known/openid-configuration | jq .
```

The response should be valid JSON with at least `issuer`, `authorization_endpoint`, `token_endpoint` and `jwks_uri`. The `issuer` value must equal the URL prefix you advertise to clients.
