---
title: Added pages on OAuth 2.0 discovery metadata
date: "2026-07-08"
type: added
relatedSlugs: [oauth-protected-resource, oauth-authorization-server]
---

Added two pages completing the OAuth 2.0 discovery set: [`/.well-known/oauth-protected-resource`](/spec/well-known/oauth-protected-resource/) (RFC 9728), the metadata document naming the authorisation server(s) that issue tokens for a protected resource — now required of authenticated MCP servers — and [`/.well-known/oauth-authorization-server`](/spec/well-known/oauth-authorization-server/) (RFC 8414), the plain-OAuth sibling of [`openid-configuration`](/spec/well-known/openid-configuration/) for authorisation servers with no OpenID Connect layer. Both are `optional`: they apply only if you expose an OAuth-protected resource or run an authorisation server.
