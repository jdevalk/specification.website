---
title: "Cookie attributes — Secure, HttpOnly, SameSite"
slug: cookie-attributes
category: security
summary: "Every cookie should be Secure, HttpOnly where possible, and have an explicit SameSite. Use __Host- and __Secure- prefixes for session cookies."
status: required
order: 100
appliesTo: [all]
relatedSlugs: [https-tls, hsts, frame-ancestors, referrer-policy, clear-site-data]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "draft-ietf-httpbis-rfc6265bis — Cookies: HTTP State Management Mechanism"
    url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis"
    publisher: "IETF"
  - title: "MDN — Set-Cookie"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie"
    publisher: "MDN"
  - title: "OWASP — Session Management Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"
    publisher: "OWASP"
  - title: "web.dev — SameSite cookies explained"
    url: "https://web.dev/articles/samesite-cookies-explained"
    publisher: "web.dev"
---

## What it is

Cookies carry session state, authentication, and preferences. The `Set-Cookie` response header has a handful of attributes that decide how much the cookie can be abused if something goes wrong. Setting them correctly is one of the cheapest, highest-impact security wins on any site.

```http
Set-Cookie: __Host-session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax
```

The attributes below are specified in RFC 6265bis (the in-progress update to RFC 6265).

## Why it matters

A cookie without `Secure` can leak over plain HTTP. A cookie without `HttpOnly` can be read by any JavaScript that runs in the page — including XSS payloads. A cookie without `SameSite` is attached to cross-site requests, which is exactly what CSRF needs. Modern browsers default `SameSite` to `Lax` when not set, but relying on the default leaves older clients and edge cases unprotected.

## How to implement

Set these attributes on every cookie unless you have a specific reason not to.

- **`Secure`** — sent only over HTTPS. Mandatory on any cookie that carries identity. Required for `SameSite=None`.
- **`HttpOnly`** — not exposed to `document.cookie`. Use on every session cookie. Skip it on cookies your JavaScript genuinely needs to read (preferences, A/B test bucket).
- **`SameSite=Lax`** — sent on top-level navigations to your site but not on cross-site iframes, images, or `fetch`. Sensible default for session cookies.
- **`SameSite=Strict`** — sent only on requests originating from your own site. Strongest CSRF defence; breaks the common pattern of arriving via an external link while already logged in.
- **`SameSite=None; Secure`** — required for cross-site cookies (third-party widgets, SSO, embedded checkouts). Use sparingly.

### Cookie prefixes

Two browser-enforced prefixes raise the bar further:

- **`__Secure-`** — the cookie name must start with `__Secure-`, and the browser only accepts the cookie if it has the `Secure` attribute.
- **`__Host-`** — name starts with `__Host-`, the cookie must be `Secure`, must have `Path=/`, and must not have a `Domain` attribute. Pins the cookie to the exact host.

Use `__Host-` for session cookies whenever you can. It blocks subdomain takeover from rewriting the session cookie.

```http
Set-Cookie: __Host-session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax
Set-Cookie: __Secure-prefs=dark; Path=/; Secure; SameSite=Lax; Max-Age=31536000
```

Always set an explicit `Path`, `Max-Age` or `Expires`, and a sensible value length. Avoid `Domain=example.com` unless you really need the cookie on subdomains.

## Common mistakes

- **No `Secure`.** A single HTTP request leaks the cookie.
- **No `HttpOnly` on session cookies.** Any XSS becomes an account takeover.
- **`SameSite=None` without `Secure`.** Modern browsers reject the cookie outright.
- **Putting `__Host-` on a cookie with `Domain` set.** Browser ignores it.
- **Sharing one cookie across many subdomains by default.** Set `Domain` only when you actually need it.

## Verification

- DevTools → Application → Cookies. Each row shows the attributes. Confirm `Secure`, `HttpOnly`, and `SameSite` on every session cookie.
- `curl -sI https://example.com | grep -i set-cookie`.
- Try setting `__Host-foo=1; Path=/` from a page without `Secure` — the browser should refuse.
- Audit cookies served by third parties; their defaults are not your defaults.
