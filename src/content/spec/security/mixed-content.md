---
title: "Mixed content and upgrade-insecure-requests"
slug: mixed-content
category: security
summary: "An HTTPS page that loads any subresource over HTTP is mixed content. Serve every subresource over HTTPS, and send the upgrade-insecure-requests CSP directive as a safety net."
status: recommended
order: 25
appliesTo: [all]
relatedSlugs: [https-tls, content-security-policy, hsts, subresource-integrity]
updated: "2026-06-08T20:15:00.000Z"
sources:
  - title: "W3C — Mixed Content"
    url: "https://www.w3.org/TR/mixed-content/"
    publisher: "W3C"
  - title: "W3C — Upgrade Insecure Requests"
    url: "https://www.w3.org/TR/upgrade-insecure-requests/"
    publisher: "W3C"
  - title: "MDN — Mixed content"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content"
    publisher: "MDN"
  - title: "MDN — CSP: upgrade-insecure-requests"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/upgrade-insecure-requests"
    publisher: "MDN"
---

## What it is

Mixed content is an HTTPS page that pulls in a subresource — script, stylesheet, image, font, iframe, or `fetch`/XHR — over plain HTTP. The address bar says secure, but part of what the page loads travels unencrypted and unauthenticated.

Browsers split it in two:

- **Active mixed content** (scripts, stylesheets, iframes, `fetch`, XHR) can rewrite the whole page, so browsers **block it outright**.
- **Passive mixed content** (images, audio, video) can only affect itself, so browsers block it or silently upgrade it to HTTPS.

The W3C *Mixed Content* specification defines this behaviour, and the `upgrade-insecure-requests` CSP directive is the standard tool for fixing it in bulk.

## Why it matters

A single `http://` script on an `https://` page is a hole in the encryption. A network attacker — anyone on the same Wi-Fi, a malicious ISP, a compromised router — can read or rewrite that request and inject code that runs in your secure origin with full access to cookies and the DOM. That is why browsers block active mixed content rather than merely warn: there is no safe way to allow it.

The everyday cost is breakage. A site migrated to HTTPS that still references `http://` assets gets blocked scripts and styles, a broken layout, and a "not fully secure" padlock — a degraded page and lost trust.

## How to implement

1. **Serve every subresource over HTTPS.** The real fix is correct URLs: absolute `https://` or root-relative paths (`/app.js`), never hard-coded `http://` or protocol-relative `//`.
2. **Send `upgrade-insecure-requests` as a safety net.** This CSP directive tells the browser to rewrite every `http://` subresource request (and same-origin navigation) to `https://` before it is sent:

   ```http
   Content-Security-Policy: upgrade-insecure-requests
   ```

   It is invaluable for large or legacy sites and for user-generated content whose embedded URLs you cannot audit. It upgrades requests; it weakens nothing.
3. **Don't reach for the deprecated `block-all-mixed-content`** — it is obsolete now that passive mixed content is blocked or upgraded by default.

This site sends `upgrade-insecure-requests` in its [Content-Security-Policy](/spec/security/content-security-policy/) for exactly this reason. Getting the subresources right in the first place is part of serving everything over [HTTPS](/spec/security/https-tls/).

## Common mistakes

- Hard-coded `http://` URLs in templates, CMS content, or third-party embeds.
- Expecting `upgrade-insecure-requests` to force a third party onto HTTPS — it rewrites the request, but if the target has no HTTPS endpoint the upgraded request simply fails.
- Treating the padlock as proof of no mixed content — passive resources may have been silently upgraded or blocked with no visible warning.
- Using protocol-relative URLs (`//example.com/x.js`) and calling it solved; current guidance is explicit `https://`.

## Verification

- Open DevTools → Console on each template; mixed-content warnings and blocks are logged there.
- `curl -sI https://example.com | grep -i content-security-policy` and confirm `upgrade-insecure-requests` is present.
- The DevTools Security panel reports whether the page loaded any non-secure resources.
- Grep the rendered HTML and CSS for `http://` subresource URLs.
