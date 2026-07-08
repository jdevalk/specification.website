---
title: "/.well-known/oauth-protected-resource"
slug: oauth-protected-resource
category: well-known
summary: "A JSON metadata document that tells clients which authorisation server issues the tokens an OAuth-protected API accepts, and how to present them. Only needed if you expose an OAuth-protected resource."
status: optional
order: 32
appliesTo: [all]
relatedSlugs: [openid-configuration, oauth-authorization-server, well-known-overview, mcp-and-tool-discovery, webauthn]
updated: "2026-07-08T00:00:00.000Z"
sources:
  - title: "RFC 9728 — OAuth 2.0 Protected Resource Metadata"
    url: "https://www.rfc-editor.org/rfc/rfc9728"
    publisher: "IETF"
  - title: "RFC 8414 — OAuth 2.0 Authorization Server Metadata"
    url: "https://www.rfc-editor.org/rfc/rfc8414"
    publisher: "IETF"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Model Context Protocol — Authorization"
    url: "https://modelcontextprotocol.io/specification/draft/basic/authorization"
    publisher: "Anthropic / MCP"
---

## What it is

`/.well-known/oauth-protected-resource` is a JSON metadata document that an OAuth 2.0 **protected resource** — an API, or any endpoint that requires an access token — publishes so a client can discover, with no hand-configuration, which authorisation server issues the tokens it accepts and how to present them. It is defined by **RFC 9728**.

It is the resource-server counterpart to the authorisation-server documents at `/.well-known/oauth-authorization-server` (RFC 8414) and [`/.well-known/openid-configuration`](/spec/well-known/openid-configuration/). Those describe where to _get_ a token; this describes what a specific resource _expects_.

## Why it matters

- **Zero hand-configuration.** A client that receives a `401` from a protected resource can learn, from this one document, exactly which authorisation server to send the user to.
- **The 401 handshake.** The resource returns `WWW-Authenticate: Bearer resource_metadata="https://api.example.com/.well-known/oauth-protected-resource"`, so even a client that did not know the path is pointed straight at it.
- **Many issuers, one resource.** `authorization_servers` can list several trusted issuers; the client picks the right one instead of guessing.
- **Agent readiness.** The Model Context Protocol's authorization spec **requires** a remote (authenticated) MCP server to publish this document, and MCP clients use it to bootstrap OAuth. See [MCP and tool discovery](/spec/agent-readiness/mcp-and-tool-discovery/).

Only publish this if you actually expose an OAuth-protected resource. A public, unauthenticated API or MCP endpoint has nothing to advertise here — like `openid-configuration`, it is `optional` and applies only when the condition holds. (This site's own MCP endpoint is public and unauthenticated, so it does not serve this file.)

## How to implement

Serve the document as `application/json` from the resource's origin. A minimal payload:

```json
{
  "resource": "https://api.example.com",
  "authorization_servers": ["https://login.example.com"],
  "scopes_supported": ["read", "write"],
  "bearer_methods_supported": ["header"],
  "jwks_uri": "https://api.example.com/.well-known/jwks.json"
}
```

Rules:

- The `resource` value must **exactly match** the resource identifier that appears in the `aud` (audience) claim of issued tokens, scheme and all.
- List every issuer you accept in `authorization_servers`. The client fetches each one's own metadata (RFC 8414 / OIDC) to find the token endpoint.
- On a `401`, set `WWW-Authenticate` with a `resource_metadata` parameter pointing at this URL, so discovery works without out-of-band configuration.
- Serve over **HTTPS**, return **200**, and let it through any authentication middleware — a discovery document hidden behind the very login it describes is useless.

## Common mistakes

- A `resource` value that does not match the `aud` claim in issued tokens — clients reject the mismatch.
- Omitting the `WWW-Authenticate: … resource_metadata=…` pointer, so only clients that already know the path can find it.
- Confusing this (the **resource server**) with `oauth-authorization-server` / `openid-configuration` (the **authorisation server**). They describe different roles.
- Serving the file behind authentication, or as `text/html`.

## Verification

```
curl -s https://api.example.com/.well-known/oauth-protected-resource | jq .
```

The response should be valid JSON with at least `resource` and `authorization_servers`. Trigger a `401` from the resource and confirm the `WWW-Authenticate` header carries a `resource_metadata` link back to this document.
