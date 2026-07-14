---
title: "Redirect-By header"
slug: redirect-by
category: resilience
summary: "The Redirect-By response header names the software that issued a redirect, so anyone debugging a redirect chain can see at a glance which system to fix. It is deployed today under the legacy name X-Redirect-By."
status: recommended
order: 60
appliesTo: [all]
relatedSlugs: [redirects, deprecation-and-sunset, stable-urls]
updated: "2026-07-14T00:00:00.000Z"
sources:
  - title: "WordPress Developer Reference — the x_redirect_by filter"
    url: "https://developer.wordpress.org/reference/hooks/x_redirect_by/"
    publisher: "WordPress"
  - title: "Yoast — Let's introduce the X-Redirect-By header"
    url: "https://yoast.com/developer-blog/x-redirect-by-header/"
    publisher: "Yoast"
  - title: 'RFC 6648 — Deprecating the "X-" Prefix'
    url: "https://www.rfc-editor.org/rfc/rfc6648"
    publisher: "IETF"
  - title: "Joost de Valk — The Redirect-By HTTP header"
    url: "https://joost.blog/redirect-by-http-headers/"
    publisher: "joost.blog"
---

## What it is

A redirect can carry a header that names the software that generated it. The recommended field name is `Redirect-By`:

```http
HTTP/1.1 301 Moved Permanently
Redirect-By: specification.website
Location: https://specification.website/.well-known/security.txt
```

It has no effect on the redirect itself. The browser, the crawler, and the ranking signals all behave exactly as they would without it. It is metadata for whoever is reading the response, not an instruction to the client. That is the point: a single URL is often redirected several times over by different layers (a CDN edge rule, a reverse proxy, an application redirect, a plugin), and when one of them is wrong there is nothing in an ordinary `3xx` response that says which one did it. `Redirect-By` labels the culprit at the moment it acts.

The field is not yet registered with IANA, and it is deployed in the wild under an older name: `X-Redirect-By`. WordPress core has emitted `X-Redirect-By` on every `wp_redirect()` since version 5.1 (exposed through the `x_redirect_by` filter so themes and plugins can set their own value, such as `Yoast SEO`), and other systems including TYPO3 follow suit. Because RFC 6648 discourages the `X-` prefix on new fields, this specification recommends the unprefixed `Redirect-By`. Treat the two names as one field: emit `Redirect-By`, and recognise `X-Redirect-By` when you read other people's responses.

## Why it matters

Debugging a redirect you did not write is one of the more thankless tasks in web operations. You see the request land on the old URL and bounce to the new one, but the stack between them is opaque: was it the edge, the load balancer, the framework, a redirect-manager plugin, an `.htaccess` rule someone added three years ago? Without attribution you bisect by disabling layers one at a time. With `Redirect-By` the answer is in the response header, and the search that used to take an afternoon takes seconds.

The header earns its keep most on sites assembled from parts you do not fully control: a managed host, a CDN, a CMS, and a stack of plugins, each capable of issuing its own redirect. It is cheap to add and it costs nothing at request time, so the return on a few bytes per redirect is high.

## How to implement

On every redirect your software issues, set a `Redirect-By` response header whose value names the component responsible. Keep the value to a stable product or service name, the thing a maintainer would recognise, and emit it alongside the `Location` header.

This is a convention, not yet a registered standard, so there is no algorithm to follow: the only rule is that every layer that redirects should sign its work. A CDN edge rule labels itself; the application labels itself; a redirect-manager plugin labels itself. When several layers each set the header, the value you see is the one from the layer that actually produced the response you are holding, which is exactly the layer you want to find.

Prefer `Redirect-By` over the older `X-Redirect-By`: RFC 6648 discourages new fields carrying an `X-` prefix. Most deployed software still emits and looks for `X-Redirect-By`, so a reader should treat the two names as equivalent, and a sender bridging the transition may send both. New implementations should send `Redirect-By`.

This site ships it. The short-URL aliases in [`functions/_middleware.ts`](https://github.com/jdevalk/specification.website/blob/main/functions/_middleware.ts) are served as 301s carrying `Redirect-By: specification.website`, rather than from Cloudflare Pages' `_redirects` file, which cannot attach custom response headers.

## Common mistakes

**Treating it as a request header.** `Redirect-By` is set by the server on a redirect response. Clients do not send it, and there is nothing for a browser to do with it.

**Leaking detail into the value.** Name the software, not its version, its file path, or the internal rule that matched. `Redirect-By: WordPress` is useful; `Redirect-By: WordPress 6.5.2 via wp-content/plugins/acme/redirects.php:214` hands an attacker a fingerprint for free. Attribution should identify the layer, not describe your infrastructure.

**Reaching for the `X-` prefix on new work.** The `X-Redirect-By` spelling persists only because it predates RFC 6648's guidance against `X-` prefixes and is now widely deployed. Recognise it when reading responses, but emit `Redirect-By`.

## Verification

Request one of your redirects and inspect the response headers:

```
curl -sI https://specification.website/security.txt | grep -i redirect-by
```

A correctly configured redirect returns the `Redirect-By` line next to `Location`; the `-i` flag also catches the legacy `X-Redirect-By`. If several layers redirect in sequence, follow the chain (`curl -sIL`) and confirm each hop names itself.
