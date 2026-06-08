---
title: "/.well-known/change-password"
slug: change-password
category: well-known
summary: "A standard redirect endpoint that points password managers and users at your real change-password page. Only applicable if the site has user accounts — sites without logins have nothing to point at and should not implement it."
status: optional
order: 20
appliesTo: [all]
relatedSlugs: [well-known-overview, webauthn]
updated: "2026-06-08T12:00:00.000Z"
sources:
  - title: "A Well-Known URL for Changing Passwords"
    url: "https://w3c.github.io/webappsec-change-password-url/"
    publisher: "W3C Web Application Security Working Group"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "MDN — Well-known URIs"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security"
    publisher: "MDN"
---

## What it is

`/.well-known/change-password` is a fixed URL that resolves, by redirect, to the page where a user can change their password. The W3C Web Application Security Working Group defined it so that password managers, browsers and security tooling can jump a user from a breach alert or rotation prompt to the right form in one click.

It is not a form itself. It is a discoverable pointer.

**Applies only if your site has user accounts.** A marketing site, documentation site, or any other site without a login flow has no change-password page to point at and should not implement this URL — see the note at the end of the implementation section.

## Why it matters

- **Password managers** (1Password, Bitwarden, iCloud Keychain, Chrome, Edge, Firefox) probe this URL when they detect a weak or breached credential. If it works, the "change password" button takes the user straight there.
- **Users** who type `example.com/.well-known/change-password` into the address bar get to the right place without hunting through account menus.
- **Security teams** can use it as part of incident response: send everyone to one URL and the redirect resolves the rest.

It costs almost nothing to implement and removes a step from one of the highest-friction user journeys on the web.

## How to implement

Serve an HTTP **302** (or **303**) redirect from `/.well-known/change-password` to your actual change-password page.

```http
GET /.well-known/change-password HTTP/1.1
Host: example.com

HTTP/1.1 302 Found
Location: https://example.com/account/security/password
```

Rules:

- Serve it over **HTTPS** on the canonical host (the same host users log in to).
- The destination must be the page where a logged-in user can **change their existing password** — not the password reset flow for forgotten passwords, and not the sign-up page.
- The destination should work for an unauthenticated user too: redirect them to sign in first, then back to the change-password page.
- Do not return **404**. A 404 tells password managers the feature is not supported.

If you do not have accounts at all (a static marketing site, a documentation site, a brochure-ware site), do not implement this URL. There is nothing for it to redirect to, and a broken or placeholder destination is worse than the absence of the endpoint — password managers treat a 404 here as "feature unsupported" and move on, which is the correct outcome for a site without logins.

## Common mistakes

- Pointing at the password **reset** flow instead of the **change** flow. Reset is for forgotten passwords; change is for known-good users rotating credentials.
- Returning a 200 with an HTML page instead of a redirect. Some clients follow it; the spec says redirect.
- Hiding it behind a `noindex` requirement or a WAF rule that blocks non-browser user agents.
- Forgetting the leading dot in `/.well-known/`.

## Verification

```
curl -I https://example.com/.well-known/change-password
```

You should see a `302` or `303` response with a `Location:` header pointing at your real change-password page. Test in a password manager: trigger a weak-password warning and confirm the "Change password" button works.
