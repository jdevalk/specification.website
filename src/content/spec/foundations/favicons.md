---
title: "Favicons and app icons"
slug: favicons
category: foundations
summary: "Ship an SVG favicon, an ICO fallback at /favicon.ico, an apple-touch-icon, and a maskable PWA icon. Five files cover every browser and home-screen surface."
status: recommended
order: 80
appliesTo: [all]
relatedSlugs: [theme-color, open-graph, html-lang]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "MDN — The <link> element (rel=icon)"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link"
    publisher: "MDN"
  - title: "HTML Living Standard — Link type: icon"
    url: "https://html.spec.whatwg.org/multipage/links.html#rel-icon"
    publisher: "WHATWG"
  - title: "W3C — Web App Manifest, maskable icons"
    url: "https://www.w3.org/TR/appmanifest/#icons-member"
    publisher: "W3C"
---

## What it is

A favicon is the small icon that represents your site in browser tabs, bookmarks, history, home-screen shortcuts, and OS task switchers. Modern sites need a small set of icons in different formats to cover every surface that displays them.

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

## Why it matters

The favicon is one of the most visible pieces of branding on the web. Tab strips, bookmark bars, and history menus are full of them, and a missing or broken icon looks unfinished. It also affects:

- **Recognition** — users scan tab strips visually, not by reading title text.
- **Home-screen installs** — when a user adds your site to their phone, the icon is what they see every day.
- **Search results** — Google shows a favicon next to mobile search results.
- **OS surfaces** — pinned tabs, recent apps, share sheets, and notification icons all pull from the icon set.

A single 16×16 ICO from 2008 still works, but looks terrible on a high-DPI screen, and is wrong on a phone home screen.

## How to implement

Aim for five files. They cover every browser, every platform, and every density:

1. **`/favicon.svg`** — the modern default. One vector file, infinitely scalable, supports light- and dark-mode variants via CSS inside the SVG. Most browsers since 2021 prefer it.
2. **`/favicon.ico`** — a multi-resolution ICO containing 16×16, 32×32, and 48×48 PNGs. Older browsers and crawlers expect this at the root path.
3. **`/apple-touch-icon.png`** — 180×180 PNG used by iOS when the user adds the site to their home screen. iOS does not honour the SVG favicon for home screens.
4. **`/icon-192.png` and `/icon-512.png`** — referenced from the web app manifest, used by Android and PWA installs.
5. **A maskable variant** — a 512×512 PNG with the important content inside an 80% safe zone, so platforms can crop it to round, squircle, or other masks without clipping your logo.

Wire them up in the head:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

And declare the maskable icons in the manifest:

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Even with explicit `<link rel="icon">` tags, browsers and crawlers still request `/favicon.ico` from the site root. Always serve a real ICO at that path. A 404 there shows up in every server log forever.

Design the icon to read at 16×16. Logos with thin text or fine detail disappear; bold marks survive. Test in both light and dark browser themes.

## Common mistakes

- Only shipping a 16×16 PNG. Looks blurry on every modern screen.
- No `/favicon.ico` at the root, so crawlers and old browsers 404 endlessly.
- An apple-touch-icon with transparency. iOS used to add its own rounded background; modern iOS does not, and transparent gaps look broken.
- A maskable icon with the logo at the very edge. The platform crops it; design for an 80% safe zone.
- Forgetting to update the icon when rebranding. Stale icons cached by browsers persist for months.

## Verification

- Open the site in a browser. The tab should show a sharp icon, not a blank page.
- Visit `https://yoursite.example/favicon.ico` directly — it should return 200.
- On iOS Safari, use "Add to Home Screen" and check the icon is crisp and well-cropped.
- On Android Chrome, install the PWA and confirm the launcher icon uses the maskable variant.
- Check server logs for `/favicon.ico` 404s.
