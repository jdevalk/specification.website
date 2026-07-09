---
title: "Well-known URIs"
slug: well-known-overview
category: well-known
summary: "The /.well-known/ path prefix is a standardised place to publish site-level metadata. RFC 8615 defines it; IANA keeps the registry of allowed names."
status: recommended
order: 10
appliesTo: [all]
relatedSlugs: [change-password, openid-configuration, oauth-authorization-server, oauth-protected-resource, webfinger, apple-app-site-association, assetlinks-json, nodeinfo, api-catalog, webauthn]
updated: "2026-07-09T12:00:00.000Z"
sources:
  - title: "RFC 8615 — Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615"
    publisher: "IETF"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

A well-known URI is a resource served from a fixed path under `/.well-known/` on your origin. RFC 8615 reserves this prefix so that protocols and tools can probe a site for capabilities without guessing URLs or polluting the root namespace.

```
https://example.com/.well-known/change-password
https://example.com/.well-known/security.txt
https://example.com/.well-known/webfinger?resource=acct:user@example.com
```

The names allowed under `/.well-known/` are not arbitrary. IANA maintains a public registry; new names go through a review process. If you publish at a name that is not registered, you are claiming a path that may later be assigned to someone else.

## Why it matters

- **Discoverability.** Clients, browsers, password managers, federated servers, mobile operating systems and crawlers know exactly where to look. They do not need configuration per site.
- **Interoperability.** Standardised paths are what let Mastodon, Apple, Google, OpenID Connect, ACME (Let's Encrypt) and others work across millions of sites without coordination.
- **Stability.** The reserved prefix keeps protocol metadata out of the way of your application's routing. You will not accidentally collide with `/security.txt` if it lives under `/.well-known/`.

Some capabilities span **several** well-known URIs that reference each other, so a client can follow the chain with no prior configuration. OAuth 2.0 discovery is the clearest example: a protected resource describes itself at [`/.well-known/oauth-protected-resource`](/spec/well-known/oauth-protected-resource/) and names its authorisation server(s), whose own metadata lives at [`/.well-known/oauth-authorization-server`](/spec/well-known/oauth-authorization-server/) — or [`/.well-known/openid-configuration`](/spec/well-known/openid-configuration/) for OpenID Connect.

## How to implement

- Serve the resource over **HTTPS** on the canonical host.
- Use the **exact path and filename** the spec defines. Case matters on most servers.
- Set the **correct Content-Type** (often `application/json`, sometimes plain text or JSON variants like `application/jrd+json`).
- Return **HTTP 200** with the body, or follow the spec where it allows a redirect (for example, `change-password`).
- Allow your CDN, firewall and authentication middleware to pass through. A well-known URI behind a login wall is invisible.
- **Do not invent new names.** If you need a new well-known URI, register it via the IETF process described in RFC 8615 §3.

## Common mistakes

- Publishing under `/well-known/` (no leading dot). The spec requires `/.well-known/`.
- Serving the file with `Content-Type: text/html` because a framework wrapped it.
- Requiring authentication, blocking by user-agent, or rate-limiting probes so aggressively that legitimate clients fail.
- Using a name not in the IANA registry. Custom names belong elsewhere.

## Verification

- `curl -I https://example.com/.well-known/<name>` should return `200` and the correct content type.
- Confirm the name appears in the [IANA registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml).
- Probe from a network outside your own to catch firewall and WAF rules.
