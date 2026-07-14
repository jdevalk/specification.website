---
title: "X-Redirect-By header"
slug: redirect-by
category: resilience
summary: "The X-Redirect-By response header names the software that issued a redirect, so anyone debugging a redirect chain can see at a glance which system to fix."
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

`X-Redirect-By` is a response header set on a redirect. Its value names the software that generated that redirect:

```http
HTTP/1.1 301 Moved Permanently
X-Redirect-By: specification.website
Location: https://specification.website/.well-known/security.txt
```

It has no effect on the redirect itself. The browser, the crawler, and the ranking signals all behave exactly as they would without it. It is metadata for whoever is reading the response, not an instruction to the client. That is the point: a single URL is often redirected several times over by different layers (a CDN edge rule, a reverse proxy, an application redirect, a plugin), and when one of them is wrong there is nothing in an ordinary `3xx` response that says which one did it. `X-Redirect-By` labels the culprit at the moment it acts.

It is a non-standard header: it is not registered with IANA and no RFC defines it. It is, however, widely deployed. WordPress core has emitted it on every `wp_redirect()` since version 5.1 (exposed through the `x_redirect_by` filter so themes and plugins can set their own value, such as `Yoast SEO`), and other systems including TYPO3 follow the same convention. Wikipedia lists it among the common non-standard response fields.

## Why it matters

Debugging a redirect you did not write is one of the more thankless tasks in web operations. You see the request land on the old URL and bounce to the new one, but the stack between them is opaque: was it the edge, the load balancer, the framework, a redirect-manager plugin, an `.htaccess` rule someone added three years ago? Without attribution you bisect by disabling layers one at a time. With `X-Redirect-By` the answer is in the response header, and the search that used to take an afternoon takes seconds.

The header earns its keep most on sites assembled from parts you do not fully control: a managed host, a CDN, a CMS, and a stack of plugins, each capable of issuing its own redirect. It is cheap to add and it costs nothing at request time, so the return on a few bytes per redirect is high.

## How to implement

On every redirect your software issues, set an `X-Redirect-By` response header whose value names the component responsible. Keep the value to a stable product or service name, the thing a maintainer would recognise, and emit it alongside the `Location` header.

This is a convention, not a specification, so there is no algorithm to follow: the only rule is that every layer that redirects should sign its work. A CDN edge rule labels itself; the application labels itself; a redirect-manager plugin labels itself. When several layers each set the header, the value you see is the one from the layer that actually produced the response you are holding, which is exactly the layer you want to find.

This site ships it. The short-URL aliases in [`functions/_middleware.ts`](https://github.com/jdevalk/specification.website/blob/main/functions/_middleware.ts) are served as 301s carrying `X-Redirect-By: specification.website`, rather than from Cloudflare Pages' `_redirects` file, which cannot attach custom response headers.

## Common mistakes

**Treating it as a request header.** `X-Redirect-By` is set by the server on a redirect response. Clients do not send it, and there is nothing for a browser to do with it.

**Leaking detail into the value.** Name the software, not its version, its file path, or the internal rule that matched. `X-Redirect-By: WordPress` is useful; `X-Redirect-By: WordPress 6.5.2 via wp-content/plugins/acme/redirects.php:214` hands an attacker a fingerprint for free. Attribution should identify the layer, not describe your infrastructure.

**Waiting for the perfect name.** RFC 6648 discourages new headers carrying an `X-` prefix, and the header has been proposed for eventual standardisation as `Redirect-By`. That day has not arrived: the deployed reality across WordPress, Yoast SEO, and others is `X-Redirect-By`, so emitting that name is what actually interoperates today. Send `X-Redirect-By` now; adopt `Redirect-By` if and when it is registered.

## Verification

Request one of your redirects and inspect the response headers:

```
curl -sI https://specification.website/security.txt | grep -i redirect-by
```

A correctly configured redirect returns the `X-Redirect-By` line next to `Location`. If several layers redirect in sequence, follow the chain (`curl -sIL`) and confirm each hop names itself.
