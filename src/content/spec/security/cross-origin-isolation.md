---
title: "Cross-origin isolation (COOP / COEP / CORP)"
slug: cross-origin-isolation
category: security
summary: "Three response headers — Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy, and Cross-Origin-Resource-Policy — that sever risky cross-window and cross-origin links and defend against side-channel leaks."
status: recommended
order: 65
appliesTo: [all]
relatedSlugs: [frame-ancestors, content-security-policy, permissions-policy, referrer-policy]
updated: "2026-06-11T00:00:00.000Z"
sources:
  - title: "HTML Standard — Cross-Origin-Opener-Policy"
    url: "https://html.spec.whatwg.org/multipage/browsers.html#the-coop-headers"
    publisher: "WHATWG"
  - title: "Fetch Standard — Cross-Origin-Resource-Policy header"
    url: "https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header"
    publisher: "WHATWG"
  - title: "MDN — Cross-Origin-Opener-Policy"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy"
    publisher: "MDN"
  - title: "MDN — Cross-Origin-Resource-Policy"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy"
    publisher: "MDN"
---

## What it is

Three response headers that control how your documents and resources relate to other origins:

- **`Cross-Origin-Opener-Policy` (COOP)** severs the `window.opener` link between your page and the page that opened it (or one you open), placing your document in its own browsing context group.
- **`Cross-Origin-Resource-Policy` (CORP)** tells the browser which origins are allowed to embed a resource — your images, scripts, fonts — as a `no-cors` subresource.
- **`Cross-Origin-Embedder-Policy` (COEP)** requires every subresource your document loads to opt in (via CORP or CORS).

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

COOP accepts `unsafe-none` (the default), `same-origin-allow-popups`, `same-origin`, and the newer `noopener-allow-popups`. CORP accepts `same-origin`, `same-site`, or `cross-origin`. COEP accepts `unsafe-none`, `require-corp`, or `credentialless`.

## Why it matters

A page you open with `window.open()`, or one that opened you, keeps a live `opener` handle. That handle is the entry point for tabnabbing and a family of cross-window side-channel ("XS-Leaks") attacks that infer cross-origin state. COOP cuts the handle, so an attacker window cannot reach back into yours.

CORP defends the other direction: it stops other sites from pulling your authenticated resources into their pages as a side channel, a key mitigation against Spectre-style memory disclosure.

Together with COEP, COOP `same-origin` also unlocks **cross-origin isolation** (`crossOriginIsolated === true`), the precondition for powerful APIs like `SharedArrayBuffer` and unthrottled high-resolution timers.

This site ships `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-site` on every response — see [`public/_headers`](https://github.com/jdevalk/specification.website/blob/main/public/_headers).

## How to implement

Send COOP and CORP on every HTML response as a baseline:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

If your site relies on OAuth or payment pop-ups, relax COOP to `same-origin-allow-popups` so the pop-up flow keeps working while isolated pages stay protected.

Only add `Cross-Origin-Embedder-Policy: require-corp` if you actually need `SharedArrayBuffer` or other isolation-gated APIs — it forces every cross-origin subresource to opt in, which often breaks third-party embeds until each one sends CORP or CORS. Treat full isolation as opt-in, not a default.

## Common mistakes

- **Reaching for `require-corp` without needing isolation.** It breaks embeds for no benefit unless an isolation-gated API is in use.
- **`same-origin` COOP on pages that depend on pop-up callbacks.** Use `same-origin-allow-popups` there.
- **Serving CORP `same-origin` on assets meant to be hot-linked** (a public CDN, embeddable widget). Use `cross-origin` for genuinely public resources.
- **Setting the headers on HTML but not on the resources** other sites legitimately embed.

## Verification

- `curl -sI https://example.com | grep -iE 'cross-origin-(opener|resource|embedder)-policy'`.
- In DevTools, read `self.crossOriginIsolated` — `true` confirms COOP `same-origin` + COEP `require-corp` are both in force.
- Check the **Application → Frames** panel for COOP/COEP status reported per document.
