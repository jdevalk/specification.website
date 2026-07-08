---
title: "/.well-known/oauth-authorization-server"
slug: oauth-authorization-server
category: well-known
summary: "A JSON metadata document describing a plain OAuth 2.0 authorisation server's endpoints and capabilities. The non-OIDC sibling of openid-configuration; only needed if you run an authorisation server."
status: optional
order: 31
appliesTo: [all]
relatedSlugs: [openid-configuration, oauth-protected-resource, well-known-overview]
updated: "2026-07-08T00:00:00.000Z"
sources:
  - title: "RFC 8414 — OAuth 2.0 Authorization Server Metadata"
    url: "https://www.rfc-editor.org/rfc/rfc8414"
    publisher: "IETF"
  - title: "RFC 9728 — OAuth 2.0 Protected Resource Metadata"
    url: "https://www.rfc-editor.org/rfc/rfc9728"
    publisher: "IETF"
  - title: "OpenID Connect Discovery 1.0"
    url: "https://openid.net/specs/openid-connect-discovery-1_0.html"
    publisher: "OpenID Foundation"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

`/.well-known/oauth-authorization-server` is a JSON metadata document, defined by **RFC 8414**, that an OAuth 2.0 **authorisation server** publishes to describe itself: where to send authorisation requests, where to exchange tokens, which scopes and grant types it supports, and where its signing keys live (`jwks_uri`).

It is the plain-OAuth sibling of [`/.well-known/openid-configuration`](/spec/well-known/openid-configuration/). The two carry almost the same fields — OpenID Connect Discovery came first, and RFC 8414 was modelled on it — but they describe different servers. Publish `openid-configuration` if you are an **OpenID Connect** provider (you issue `id_token`s and expose a UserInfo endpoint); publish `oauth-authorization-server` if you are a **plain OAuth 2.0** authorisation server with no OIDC layer. A server that is both may publish both.

## Why it matters

- **Zero hand-configuration.** A client needs only your issuer URL and discovers every endpoint from this document.
- **It completes the discovery chain.** A protected resource's [`oauth-protected-resource`](/spec/well-known/oauth-protected-resource/) metadata (RFC 9728) lists its `authorization_servers`; the client fetches this document from each to find the token endpoint. Resource metadata says _who_ issues tokens; this says _how_ to get one.
- **Key rotation and capability negotiation.** `jwks_uri` is the canonical key source, and `scopes_supported` / `grant_types_supported` tell clients what you allow.

Only publish it if you actually run an authorisation server. An application that merely _consumes_ OAuth — "sign in with someone else's provider" — is a client, not a server, and has nothing to advertise here.

## How to implement

Serve the document as `application/json` over HTTPS. A minimal payload:

```json
{
  "issuer": "https://login.example.com",
  "authorization_endpoint": "https://login.example.com/oauth2/authorize",
  "token_endpoint": "https://login.example.com/oauth2/token",
  "jwks_uri": "https://login.example.com/oauth2/jwks",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "scopes_supported": ["read", "write"]
}
```

The one rule that trips people up: for an issuer that has a **path component**, RFC 8414 _inserts_ the well-known segment before the path — issuer `https://example.com/tenant1` → `https://example.com/.well-known/oauth-authorization-server/tenant1` — whereas OIDC _appends_ it (`https://example.com/tenant1/.well-known/openid-configuration`). Get this wrong and multi-tenant clients cannot find you.

Otherwise the mechanics match [`openid-configuration`](/spec/well-known/openid-configuration/): keep `issuer` an exact match for the URL clients use, serve over HTTPS, return `200`, cache for minutes-to-hours, and let it through any authentication middleware.

## Common mistakes

- An `issuer` value that does not match the URL clients use — differing by a trailing slash, port, or hostname casing. The single most common "invalid issuer" cause.
- Using OIDC's _append_ rule instead of RFC 8414's _insert_ rule for path-bearing issuers.
- Publishing it when you only consume OAuth. That makes you a client, not a server.
- Serving it as `text/html` or behind authentication.

## Verification

```
curl -s https://login.example.com/.well-known/oauth-authorization-server | jq .
```

The response should be valid JSON with at least `issuer`, `authorization_endpoint`, `token_endpoint`, and `jwks_uri`. The `issuer` value must equal the URL prefix you advertise to clients.
