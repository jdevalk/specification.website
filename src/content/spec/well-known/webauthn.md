---
title: "/.well-known/webauthn"
slug: webauthn
category: well-known
summary: "A JSON document at /.well-known/webauthn lists the origins allowed to use passkeys scoped to a single Relying Party ID. It enables WebAuthn Related Origin Requests — one passkey shared across several domains you own. Only applicable if the site uses passkeys across more than one origin."
status: optional
appliesTo: [all]
relatedSlugs: [well-known-overview, change-password, https-tls]
order: 25
updated: "2026-06-08T12:00:00.000Z"
sources:
  - title: "Web Authentication: An API for accessing Public Key Credentials — Level 3"
    url: "https://www.w3.org/TR/webauthn-3/"
    publisher: "W3C Web Authentication Working Group"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Allow passkey reuse across your sites with Related Origin Requests"
    url: "https://web.dev/articles/webauthn-related-origin-requests"
    publisher: "web.dev"
---

## What it is

`/.well-known/webauthn` is a JSON document that lists the origins permitted to create and use [passkeys](https://www.w3.org/TR/webauthn-3/) scoped to a single Relying Party ID (RP ID). It is the discovery file behind **Related Origin Requests (ROR)**, a feature added in WebAuthn Level 3.

A passkey is normally bound to one RP ID, which must match the registrable domain of the site using it. That breaks down when one organisation operates several domains — `example.com`, `example.co.uk`, `example.de` — and wants a single passkey to work across all of them. ROR lets a browser treat a request from a listed origin as valid for the RP ID, after fetching and checking this file.

```json
{
  "origins": [
    "https://example.com",
    "https://example.co.uk",
    "https://example.de"
  ]
}
```

## Why it matters

- **One credential, many domains.** Users register a passkey once and sign in across every related property, instead of one passkey per ccTLD or brand domain.
- **No shared secret or redirect dance.** The allowlist is a static, publicly fetchable file. The browser, not your servers, enforces it.
- **It is a platform feature, not a vendor one.** ROR is in the W3C standard and ships in Chrome, Safari, and Firefox (152+), so the behaviour is consistent across browsers.

## How to implement

- Host the file at `https://<rp-id>/.well-known/webauthn` — on the RP ID's origin, served over **HTTPS**.
- Serve it as `application/json` with HTTP **200**.
- Include an `origins` array of the full origins (scheme + host) allowed to use this RP ID's passkeys.
- Pass an `RP ID` to `navigator.credentials.get()` that differs from the requesting origin; the browser then fetches this file to authorise the cross-origin use.
- The browser fetches it **without credentials and without a `Referer` header**, so do not gate it behind cookies, authentication, or a WAF rule that blocks header-less requests.

**Applies only if you use passkeys across more than one origin.** A site with a single domain, or no passkey authentication at all, has nothing to list and should not publish this file.

## Common mistakes

- Listing more registrable domains than the browser will honour. Implementations cap the number of distinct registrable domains processed (five in current browsers) — order the array so the important origins come first.
- Serving the file with `Content-Type: text/html` because a framework wrapped the route.
- Blocking the credential-less, `Referer`-less fetch with a firewall rule, which makes the file invisible to the browser.
- Putting the file on the requesting origin instead of the RP ID's origin.

## Verification

```
curl -I https://example.com/.well-known/webauthn
```

Expect `200` with `Content-Type: application/json`. Confirm the `origins` array contains every property that should share the RP ID's passkeys, and test a real sign-in from each listed origin.
