---
title: "Clickjacking protection (frame-ancestors / X-Frame-Options)"
slug: frame-ancestors
category: security
summary: "Tell browsers who is allowed to embed your pages in an iframe. Use CSP frame-ancestors. X-Frame-Options is the legacy fallback."
status: required
order: 60
appliesTo: [all]
relatedSlugs: [content-security-policy, x-content-type-options, permissions-policy, cross-origin-isolation]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "OWASP — Clickjacking Defense Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html"
    publisher: "OWASP"
  - title: "MDN — CSP: frame-ancestors"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors"
    publisher: "MDN"
  - title: "MDN — X-Frame-Options"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options"
    publisher: "MDN"
---

## What it is

A clickjacking attack loads your site inside an invisible iframe on an attacker-controlled page, then tricks a logged-in user into clicking buttons they cannot see. The defence is to tell the browser which origins are allowed to embed your page.

CSP `frame-ancestors` is the modern mechanism:

```http
Content-Security-Policy: frame-ancestors 'none'
```

`X-Frame-Options` is the legacy header, still respected by browsers for compatibility:

```http
X-Frame-Options: DENY
```

CSP Level 2 onwards specifies that `frame-ancestors` supersedes `X-Frame-Options` when both are present in conformant browsers.

## Why it matters

Without an embedding policy, any site on the web can wrap yours in an iframe and overlay invisible controls. A user thinks they are clicking "Win a prize" on attacker.example; in reality they are clicking "Transfer money" or "Delete account" on your site, with their session cookie attached. The attack works against any authenticated action that can be triggered with a single click.

`frame-ancestors` makes the browser refuse to render the embedded page at all, which neutralises the whole class of attacks.

## How to implement

Default to refusing all framing, then loosen only where needed.

Refuse all embedding:

```http
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
```

Allow same-origin embedding (for example, an admin app that frames its own pages):

```http
Content-Security-Policy: frame-ancestors 'self'
X-Frame-Options: SAMEORIGIN
```

Allow specific external embedders:

```http
Content-Security-Policy: frame-ancestors 'self' https://partner.example.com
```

`X-Frame-Options` cannot express a list of allowed origins — the historic `ALLOW-FROM` value is not supported in any current browser. If you need a list, rely on `frame-ancestors` and accept that very old browsers fall back to "deny all" via `X-Frame-Options`.

Send the headers on every HTML response. Send them even on pages that "wouldn't make sense" framed; attackers will frame anything that performs an authenticated action.

Combine with `SameSite` cookies (see [Cookie attributes](/spec/security/cookie-attributes/)) for defence in depth.

## Common mistakes

- **Setting only `X-Frame-Options`.** Modern policies, including allow-lists, live in CSP. Set both for now.
- **`ALLOW-FROM`.** Deprecated and unsupported. Use `frame-ancestors`.
- **Allowing too broad a parent.** `frame-ancestors https:` is barely better than nothing.
- **Setting the headers on the API but not the HTML.** Only the HTML response matters — the iframe is the HTML document.
- **Forgetting login and OAuth screens.** These are the highest-value pages to clickjack.

## Verification

- `curl -sI https://example.com | grep -iE 'frame-ancestors|x-frame-options'`.
- Build a tiny test page with `<iframe src="https://example.com">` on a different origin. The frame should refuse to load and the console should log a violation.
- Run the site through [securityheaders.com](https://securityheaders.com/).
- Check that the headers are present on every HTML route, not just the homepage.
