---
title: "Redirects (301/302/308)"
slug: redirects
category: seo
summary: "HTTP redirects send a client from one URL to another. Use 301 or 308 for permanent moves, 302 or 307 for temporary ones, and never chain more than necessary."
status: required
order: 60
appliesTo: [all]
relatedSlugs: [url-structure, canonical-url, soft-404, deprecation-and-sunset]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "RFC 9110 — HTTP Semantics, redirection 3xx"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx"
    publisher: "IETF"
  - title: "Redirects and Google Search"
    url: "https://developers.google.com/search/docs/crawling-indexing/301-redirects"
    publisher: "Google Search Central"
  - title: "MDN — Redirections in HTTP"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections"
    publisher: "MDN"
---

## What it is

A redirect is a `3xx` HTTP response that tells the client to fetch a different URL, named in the `Location` header. RFC 9110 defines the semantics of each status code.

```http
HTTP/1.1 301 Moved Permanently
Location: https://example.com/articles/csp
```

The four codes that matter in practice:

- **301 Moved Permanently** — the canonical URL has changed. Search engines transfer ranking signals to the target.
- **302 Found** — temporary redirect. The browser may switch the request method (a `POST` can become a `GET`). Use only for short-lived redirects.
- **307 Temporary Redirect** — like 302, but the method and body must be preserved. Safer for APIs.
- **308 Permanent Redirect** — like 301, but the method and body must be preserved.

For SEO, treat 301 and 308 as equivalent ("permanent"), and 302 and 307 as equivalent ("temporary").

## Why it matters

When you move a page, every link, bookmark, and search result pointing at the old URL becomes a problem. A permanent redirect tells crawlers to forget the old URL and consolidate ranking signals onto the new one. A temporary redirect tells them the old URL is the canonical one and will return.

Getting this wrong is one of the most common SEO mistakes. A 302 on a URL that has actually moved permanently can take months to be reinterpreted as a 301, during which the site loses traffic.

## How to implement

Rules of thumb:

- **URL has moved for good → 301 (or 308 if the method matters).**
- **Site is in maintenance, A/B test, or geo-redirect → 302 (or 307).**
- **HTTPS upgrade → 301** from `http://` to `https://`.
- **Trailing-slash or case canonicalisation → 301.**
- **Old domain → new domain → 301.** Keep the old domain registered indefinitely so the redirect keeps working.

Keep chains short. Each hop is a fresh request, costs latency, and risks a crawler giving up. `A → B → C` should be flattened to `A → C` and `B → C` wherever you control both rules.

```
Bad:  /old-name  → 301 → /new-name  → 301 → /new-name/
Good: /old-name  → 301 → /new-name/
      /new-name  → 301 → /new-name/
```

Other practical points:

- Redirect at the edge (web server, CDN, or origin) — not with `<meta http-equiv="refresh">` or JavaScript. Crawlers handle HTTP redirects reliably; meta-refresh and JS redirects are slower and ambiguous.
- For 301 chains across a migration, write the redirect map from your old URL inventory, not by guessing.
- Preserve query strings if the destination needs them.

## Common mistakes

- Using 302 for a permanent move.
- Redirecting every removed page to the home page. That hides the loss and confuses crawlers — return 410 or 404 instead.
- Redirect loops (`A → B → A`).
- Chains longer than three hops. Google stops following after about ten; users feel the latency long before that.

## Verification

- `curl -sI https://example.com/old-url` and check the status code and `Location` header.
- Use Search Console's URL inspection tool. It reports the redirect chain Google followed.
- Crawl the site to find chains and loops.
