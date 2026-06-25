---
title: "HSTS (Strict-Transport-Security)"
slug: hsts
category: security
summary: "HSTS tells browsers to use HTTPS for your domain only, for a long time. Add max-age, includeSubDomains, and preload — but understand it is an irreversible commitment."
status: required
order: 20
appliesTo: [all]
relatedSlugs: [https-tls, content-security-policy, caa-records]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "RFC 6797 — HTTP Strict Transport Security (HSTS)"
    url: "https://www.rfc-editor.org/rfc/rfc6797"
    publisher: "IETF"
  - title: "MDN — Strict-Transport-Security"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security"
    publisher: "MDN"
  - title: "HSTS Preload List Submission"
    url: "https://hstspreload.org/"
    publisher: "Google Chrome"
  - title: "OWASP — HTTP Strict Transport Security Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html"
    publisher: "OWASP"
---

## What it is

HTTP Strict Transport Security, defined in RFC 6797, is a response header that tells the browser: from now on, never speak HTTP to this host — only HTTPS. The browser remembers the instruction for the duration of `max-age` and refuses plain HTTP even if the user types it, clicks a stale link, or has DNS hijacked.

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

## Why it matters

A 301 redirect from HTTP to HTTPS only protects the second request. The first request — and any cookies sent with it — already left the device in plain text. HSTS closes that gap. It also defends against active downgrade attacks where a network attacker strips the redirect and proxies the connection.

Without HSTS, every typed URL, bookmark, and external link to `http://example.com` is a moment when an attacker on the network can intercept the session.

## How to implement

Send the header on every HTTPS response. Browsers ignore it on plain HTTP.

Directives:

- **`max-age=<seconds>`** — required. How long the browser remembers. Start short (a few hours) to verify, then raise to two years (`63072000`) before preloading.
- **`includeSubDomains`** — applies the policy to every subdomain. Required for preload.
- **`preload`** — opts in to the browser preload list. Required for preload submission, and a commitment that you intend to stay on HTTPS.

Recommended production header:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

After running this header reliably for at least a few weeks, submit the domain at [hstspreload.org](https://hstspreload.org/). Preloaded domains are hard-coded into Chrome, Firefox, Safari, and Edge, so even the first visit on a fresh device uses HTTPS.

## Common mistakes

- **Sending HSTS over HTTP.** Browsers must ignore it. Send it on HTTPS responses only.
- **Setting `includeSubDomains` without auditing subdomains.** Every subdomain — including internal tools, staging, and legacy services — must work over HTTPS. If `dev.example.com` is HTTP-only, you have just broken it.
- **Setting `max-age=0` by accident.** That removes HSTS. Useful when rolling back, dangerous when copied from a tutorial.
- **Preloading too early.** Removal from the preload list takes months. Test thoroughly first.

## Verification

- `curl -sI https://example.com | grep -i strict-transport-security` should return the header.
- Check the preload status at [hstspreload.org](https://hstspreload.org/?domain=example.com).
- In Chrome DevTools, the Security panel shows HSTS state.
- After preload, `chrome://net-internals/#hsts` lists the domain as `static_sts_domain`.

HSTS is a commitment, not a switch. Plan the rollback path before you ship.
