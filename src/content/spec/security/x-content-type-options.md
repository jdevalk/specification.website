---
title: "X-Content-Type-Options: nosniff"
slug: x-content-type-options
category: security
summary: "The nosniff header stops browsers from guessing a response's content type. It blocks a class of attacks where a benign-looking file is interpreted as script or stylesheet."
status: required
order: 50
appliesTo: [all]
relatedSlugs: [content-security-policy, frame-ancestors, referrer-policy]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "MDN — X-Content-Type-Options"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options"
    publisher: "MDN"
  - title: "Fetch Standard — MIME type checks"
    url: "https://fetch.spec.whatwg.org/#x-content-type-options-header"
    publisher: "WHATWG"
  - title: "OWASP Secure Headers Project"
    url: "https://owasp.org/www-project-secure-headers/"
    publisher: "OWASP"
---

## What it is

`X-Content-Type-Options: nosniff` is a response header that tells the browser to trust the `Content-Type` you sent and not to guess. It takes exactly one value: `nosniff`.

```http
X-Content-Type-Options: nosniff
```

The Fetch Standard makes this behaviour normative: when `nosniff` is present, the browser blocks script and stylesheet responses whose declared MIME type does not match the request.

## Why it matters

Historically, browsers performed "MIME sniffing" — looking at the bytes of a response and second-guessing the server's `Content-Type`. That convenience was also an attack surface. An attacker who could upload a file to a user-content directory could craft something that looked like an image to the server but executed as JavaScript when included with `<script src=…>`. The same trick worked for stylesheets, fonts, and Flash.

`nosniff` shuts that door. A `text/plain` response is not treated as script. A `text/html` response is not loaded as a stylesheet. The header is small, costs nothing, and removes an entire category of "the upload form is also an XSS vector" bugs.

## How to implement

Send the header on every response. Most web servers and CDNs let you set it globally; there is no reason to be selective.

Nginx:

```
add_header X-Content-Type-Options "nosniff" always;
```

Apache:

```
Header always set X-Content-Type-Options "nosniff"
```

Express (Node.js) — Helmet sets it by default.

In a CDN or edge worker, add the header to every response. There is no separate "report-only" mode — it is enforce-only.

Pair `nosniff` with correct `Content-Type` headers on every response. The directive only helps if your server actually labels responses properly. JavaScript files must be served as `application/javascript` (or `text/javascript`), CSS as `text/css`, JSON as `application/json`, and so on.

## Common mistakes

- **Multiple values.** The header takes one token, `nosniff`. Anything else is ignored or rejected.
- **Sending the wrong `Content-Type`.** With `nosniff` on, mislabelling a script as `text/plain` breaks the page. Fix the label, not the header.
- **Skipping it on uploads or user-content subdomains.** Those are exactly the responses where it matters most.
- **Assuming a CDN sets it.** Many do not. Check the actual headers from production.

## Verification

- `curl -sI https://example.com | grep -i x-content-type-options` should print `X-Content-Type-Options: nosniff`.
- Run [securityheaders.com](https://securityheaders.com/) against the site and check the score.
- Try fetching a JSON or text endpoint with `<script src=…>`. The browser console should report a MIME-type mismatch and refuse to execute it.
- Audit your CDN, static host, and origin separately — each layer can strip or override headers.
