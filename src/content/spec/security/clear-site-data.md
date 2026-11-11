---
title: "Clear-Site-Data"
slug: clear-site-data
category: security
summary: "Clear-Site-Data lets a response tell the browser to wipe cookies, storage, and caches for your origin. Send it on logout so a shared device keeps nothing behind."
status: optional
order: 105
appliesTo: [all]
relatedSlugs: [cookie-attributes, content-security-policy, https-tls]
updated: "2026-06-22T00:00:00.000Z"
sources:
  - title: "Clear Site Data (W3C Working Draft)"
    url: "https://www.w3.org/TR/clear-site-data/"
    publisher: "W3C"
  - title: "MDN — Clear-Site-Data"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data"
    publisher: "MDN"
  - title: "OWASP Secure Headers Project — Clear-Site-Data"
    url: "https://owasp.org/projects/secure-headers-project"
    publisher: "OWASP"
---

## What it is

`Clear-Site-Data` is a response header that tells the browser to throw away data it holds for your origin — cookies, DOM storage, caches, and more. Each value is a quoted token, and you can send several at once.

```http
Clear-Site-Data: "cache", "cookies", "storage"
```

The header is defined by the W3C Clear Site Data specification and has been Baseline widely available across browsers since September 2023. It only works in a secure context (HTTPS).

The directives:

- **`"cookies"`** — removes all cookies and HTTP auth credentials for the registered domain, including subdomains.
- **`"storage"`** — clears `localStorage`, `sessionStorage`, IndexedDB, and unregisters service workers.
- **`"cache"`** — clears the HTTP cache, and often the back/forward cache and prerendered pages.
- **`"clientHints"`** — drops stored client hints (also cleared by `cookies`, `cache`, or `*`).
- **`"prefetchCache"` / `"prerenderCache"`** — discard speculation-rules prefetches and prerenders.
- **`"executionContexts"`** — reloads open browsing contexts for the origin.
- **`"*"`** — everything, including data types added in future revisions.

## Why it matters

When a user signs out, the session is over on the server — but the browser still holds their cookies, cached pages, and whatever you wrote to storage. On a shared or public machine, the next person can hit the back button onto a cached account page, or a stale token can linger. `Clear-Site-Data` closes that gap in a single header, without you having to enumerate and expire each cookie and storage key by hand.

It is also the cleanest way to recover from a compromised or rotated credential: serve the header once and the client state is reset.

## How to implement

Send the header on the response that confirms the sign-out — the `/logout` redirect or its landing page — listing the data types you actually want gone:

```http
Clear-Site-Data: "cache", "cookies", "storage", "executionContexts"
```

Scope it to the exact responses that should clear data. Never send it site-wide: a stray `Clear-Site-Data` on every response wipes the user's session on each request.

## Common mistakes

- **Omitting the quotes.** `Clear-Site-Data: cookies` is invalid; the value must be `"cookies"`.
- **Sending it over plain HTTP.** It is ignored outside a secure context.
- **Expecting cross-origin reach.** It only clears data for the origin of the response, not third parties.
- **`"cookies"` surprises.** It clears the whole registered domain, including every subdomain — intended, but easy to forget.

## Verification

- `curl -sI https://example.com/logout | grep -i clear-site-data` should show the header on the sign-out response only.
- Sign in, sign out, then check DevTools → Application: cookies and storage for the origin should be empty.
