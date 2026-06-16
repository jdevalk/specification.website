---
title: "Cross-origin isolation (COOP / COEP / CORP)"
slug: cross-origin-isolation
category: security
summary: "Three response headers — Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy, and Cross-Origin-Resource-Policy — that sever risky cross-window and cross-origin links and defend against side-channel leaks."
status: recommended
order: 65
appliesTo: [all]
relatedSlugs: [frame-ancestors, content-security-policy, permissions-policy, referrer-policy, reporting-endpoints]
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

- **`Cross-Origin-Opener-Policy` (COOP)** severs the `window.opener` link between your page and the page that opened it, placing your document in its own browsing context group. Values: `unsafe-none` (default), `same-origin-allow-popups`, `same-origin`, and the newer `noopener-allow-popups`.
- **`Cross-Origin-Resource-Policy` (CORP)** tells the browser which origins may embed a resource — your images, scripts, fonts — as a `no-cors` subresource. Values: `same-origin`, `same-site`, `cross-origin`.
- **`Cross-Origin-Embedder-Policy` (COEP)** requires every subresource your document loads to opt in via CORP or CORS. Values: `unsafe-none`, `require-corp`, `credentialless`.

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

## Why it matters

When a user follows a link off your site — or arrives on your site from someone else's link — the two pages can keep a live connection through the `window.opener` handle. A malicious page can abuse that connection: the moment the user's attention is elsewhere, it can silently swap the tab it opened to a pixel-perfect fake of your login screen (a "tabnabbing" attack), or quietly probe which sites the user is signed in to. The user notices nothing and types their password into the impostor. COOP cuts that connection, so a page on another origin can no longer reach back into yours.

CORP guards your resources from the opposite direction, and the threat it answers needs a word of background. **Spectre** is a family of processor flaws, disclosed in 2018, that let code read areas of memory it should never be allowed to see — including data belonging to _other_ websites that happen to be running in the same browser process. A page could exploit it to read your signed-in user's private data — their email, their account balance — without ever making a normal request for it. The browser's defence is to keep each origin's data out of processes that have no business touching it; CORP is how a resource declares "only my own site may embed me," so it is never pulled into an attacker's process in the first place. ([web.dev — Why you need cross-origin isolation](https://web.dev/articles/why-coop-coep) explains the attack and the fix in depth.)

The practical payoff is high and the cost is near zero: setting COOP and CORP closes off a whole category of invisible cross-site snooping — no consent prompt, no broken functionality, no measurable performance hit. The user is simply safer and never has to know the headers exist.

Setting COOP `same-origin` together with COEP additionally unlocks **cross-origin isolation** (`crossOriginIsolated === true`) — the browser's confirmation that your page is fully walled off from other origins. Only once that holds will the browser hand your page the powerful, isolation-gated APIs such as `SharedArrayBuffer` and unthrottled high-resolution timers.

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
