---
title: "Permissions-Policy"
slug: permissions-policy
category: security
summary: "Permissions-Policy lets you turn off powerful browser features — camera, microphone, geolocation, payment, USB — for your own pages and for any iframes you embed."
status: recommended
order: 80
appliesTo: [all]
relatedSlugs: [content-security-policy, frame-ancestors, referrer-policy, cross-origin-isolation, reporting-endpoints]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "Permissions Policy (W3C Working Draft)"
    url: "https://www.w3.org/TR/permissions-policy/"
    publisher: "W3C"
  - title: "MDN — Permissions-Policy"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy"
    publisher: "MDN"
  - title: "web.dev — Permissions Policy"
    url: "https://developer.chrome.com/docs/privacy-security/permissions-policy"
    publisher: "Chrome for Developers"
---

## What it is

`Permissions-Policy` is the response header that succeeds the older `Feature-Policy`. It tells the browser which powerful features may be used by the current document and by any documents embedded in iframes. Features include camera, microphone, geolocation, payment, USB, fullscreen, autoplay, accelerometer, and many others.

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

An empty allow-list `()` disables the feature entirely. `(self)` allows it on the current origin. `(self "https://embed.example.com")` allows it on the current origin and one named third party.

## Why it matters

The default state of the web grants pages access to many powerful APIs as soon as the user accepts a prompt. If you do not use the camera on your marketing site, there is no reason for an embedded ad iframe to be able to ask for it. Permissions-Policy lets you turn off features you do not need, both for your own code (defence against XSS expanding into hardware access) and for embedded third parties (defence against ad networks and trackers).

It is also a useful privacy signal: a site that explicitly disables geolocation is announcing it does not collect location data.

## How to implement

Send the header on every HTML response. Start by denying everything you do not use:

```http
Permissions-Policy: accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()
```

Then enable only the features you actually need, scoped as narrowly as possible:

```http
Permissions-Policy: camera=(self), microphone=(self), geolocation=(self), fullscreen=(self)
```

To allow a specific third party — say, a video embed:

```http
Permissions-Policy: fullscreen=(self "https://player.vimeo.com"), autoplay=(self "https://player.vimeo.com")
```

You can also constrain a single iframe with the `allow` attribute:

```html
<iframe src="https://player.vimeo.com/video/123" allow="fullscreen; autoplay"></iframe>
```

The iframe's effective permissions are the intersection of the page policy and the `allow` attribute.

## Common mistakes

- **Using the older `Feature-Policy` syntax.** Permissions-Policy uses structured headers with `()` lists, not space-separated origins.
- **Forgetting to allow features you actually use.** If `camera=()` is set, your own WebRTC code stops working.
- **Allowing `*` to "fix" a broken iframe.** Narrow it to the specific origin instead.
- **Setting the header on the API but not the HTML.** Only the top-level HTML response counts.

## Verification

- `curl -sI https://example.com | grep -i permissions-policy` should print the header.
- Visit [permissionspolicy.com](https://permissionspolicy.com/) or use Chrome DevTools → Application → Frames → Permissions Policy to see the effective policy.
- Try `navigator.mediaDevices.getUserMedia({camera: true})` from the console on a page where camera is denied — it should reject with a permissions error.
- Audit embedded iframes; check that their `allow` attributes match what they actually need.
