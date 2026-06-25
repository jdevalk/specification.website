---
title: "Referrer-Policy"
slug: referrer-policy
category: security
summary: "Referrer-Policy controls how much URL information your site leaks when users follow a link or load a subresource. strict-origin-when-cross-origin is the sensible default."
status: recommended
order: 70
appliesTo: [all]
relatedSlugs: [content-security-policy, permissions-policy, cookie-attributes]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "Referrer Policy (W3C Editor's Draft)"
    url: "https://www.w3.org/TR/referrer-policy/"
    publisher: "W3C"
  - title: "MDN — Referrer-Policy"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy"
    publisher: "MDN"
  - title: "web.dev — A new default Referrer-Policy for Chrome"
    url: "https://web.dev/articles/referrer-best-practices"
    publisher: "web.dev"
---

## What it is

When a browser navigates from one page to another, or loads an image, script, or fetch, it normally sends the URL of the originating page in the `Referer` header. `Referrer-Policy` lets you control exactly how much of that URL is shared, per response.

```http
Referrer-Policy: strict-origin-when-cross-origin
```

The header is defined by the W3C Referrer Policy specification. Modern Chrome, Edge, Firefox, and Safari use `strict-origin-when-cross-origin` as the default when none is set.

## Why it matters

URLs leak. A path like `/account/reset?token=abc123` or `/internal/customers/4711/edit` should never end up in the access logs of an unrelated third party. Without a referrer policy, every outbound link and every third-party subresource carries the full URL of the page the user was on.

A sensible policy keeps internal URLs internal, hands cross-site requests only the origin (`https://example.com`), and gives partners and analytics tools enough context to be useful without exposing path or query parameters.

## How to implement

Send the header on every HTML response. The recommended baseline is the modern browser default:

```http
Referrer-Policy: strict-origin-when-cross-origin
```

This sends the full URL on same-origin requests, only the origin on cross-origin requests over HTTPS, and nothing at all on HTTPS-to-HTTP downgrades.

Available values, from most permissive to most restrictive:

- **`unsafe-url`** — always sends the full URL. Avoid.
- **`no-referrer-when-downgrade`** — legacy default. Sends the full URL except on HTTPS-to-HTTP.
- **`origin`** — always sends just the origin.
- **`origin-when-cross-origin`** — full URL same-origin, origin cross-origin.
- **`same-origin`** — full URL same-origin, nothing cross-origin.
- **`strict-origin`** — origin only, never on downgrades.
- **`strict-origin-when-cross-origin`** — recommended default.
- **`no-referrer`** — never send the header.

You can also override per element:

```html
<a href="https://partner.example.com" referrerpolicy="no-referrer">Partner</a>
<meta name="referrer" content="strict-origin-when-cross-origin">
```

Use a stricter policy (`same-origin` or `no-referrer`) on pages with sensitive URLs — password reset, account settings, internal tools.

## Common mistakes

- **Relying on the browser default.** Different browsers historically used different defaults. Be explicit.
- **Setting `no-referrer` site-wide.** Some partners legitimately need the origin to attribute traffic.
- **Forgetting per-page overrides.** A single `<meta name="referrer">` on a reset-password page is worth more than a generic header everywhere else.
- **Leaking tokens in URLs in the first place.** Referrer policy reduces blast radius — it does not fix the underlying mistake.

## Verification

- `curl -sI https://example.com | grep -i referrer-policy` should show the header.
- Open DevTools → Network, click an outbound request, and check the `Referer` value matches the policy.
- Audit the URLs of authenticated pages for tokens, IDs, or anything that would embarrass you in a partner's logs.
