---
title: "Content Security Policy (CSP)"
slug: content-security-policy
category: security
summary: "A CSP tells browsers which sources of script, style, image, and frame content to trust. A good policy stops most XSS and data-exfiltration attacks dead."
status: recommended
order: 30
appliesTo: [all]
relatedSlugs: [https-tls, frame-ancestors, subresource-integrity, permissions-policy, mixed-content, cross-origin-isolation, reporting-endpoints]
updated: "2026-06-08T20:15:00.000Z"
sources:
  - title: "Content Security Policy Level 3"
    url: "https://www.w3.org/TR/CSP3/"
    publisher: "W3C"
  - title: "MDN — Content-Security-Policy"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy"
    publisher: "MDN"
  - title: "OWASP — Content Security Policy Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html"
    publisher: "OWASP"
  - title: "Google — Strict CSP"
    url: "https://web.dev/articles/strict-csp"
    publisher: "web.dev"
---

## What it is

Content Security Policy is a response header that restricts which resources a page may load and execute. Level 3 is the current specification. The browser enforces the policy; any script, style, image, frame, or fetch from a source the policy does not allow is blocked, and a report is sent if a reporting endpoint is configured.

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; report-to csp-endpoint
```

## Why it matters

The single biggest class of web vulnerabilities is cross-site scripting. A solid CSP turns a successful XSS injection from "attacker runs JavaScript in your origin" into "browser blocks the script and logs a violation". CSP also limits where data can be exfiltrated to, prevents your site from being framed, and disables dangerous legacy features like inline event handlers.

## How to implement

Build a strict, nonce-based policy. The recommended pattern from Google's strict CSP guidance:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-{random}' 'strict-dynamic' https: 'unsafe-inline';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  report-to csp-endpoint
```

Key directives:

- **`default-src 'self'`** — fallback for all fetch directives. Allow your own origin by default.
- **`script-src`** — controls JavaScript. Use a per-response nonce; the `strict-dynamic` keyword lets a trusted script load further trusted scripts.
- **`style-src`** — controls CSS. Same nonce model where possible.
- **`img-src`, `font-src`, `connect-src`, `media-src`** — list the third parties you actually use.
- **`frame-ancestors 'none'`** — replaces `X-Frame-Options`. See [Clickjacking protection](/spec/security/frame-ancestors/).
- **`object-src 'none'`** — kills Flash and plugin embeds.
- **`base-uri 'none'`** — blocks `<base>` tag injection attacks.
- **`report-to`** — endpoint that receives violation reports as JSON.

Generate a fresh nonce per response and embed it in every inline `<script>` tag.

## Common mistakes

- **`unsafe-inline` and `unsafe-eval`.** Either one neutralises most of the protection. Use nonces or hashes instead.
- **Wildcards like `script-src *` or `https:` alone.** Almost as bad as no policy at all.
- **No `frame-ancestors`.** Leaves clickjacking open.
- **Forgetting the nonce on server-rendered inline scripts.** The browser will block them and the page breaks.
- **Shipping a report-only policy forever.** Use `Content-Security-Policy-Report-Only` to test, then switch to enforcing.

## Verification

- `curl -sI https://example.com | grep -i content-security-policy` should return the header.
- Run the page through [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/).
- Open DevTools → Console. CSP violations appear as `Refused to load …` errors.
- Wire up a reporting endpoint and watch for unexpected blocks before tightening.
