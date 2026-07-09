---
title: "Web app manifest"
slug: pwa-manifest
category: resilience
summary: "A web app manifest is a small JSON file that tells browsers how the site should appear when installed — its name, icons, start URL, theme colour, and display mode."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [offline-support, favicons]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "W3C — Web Application Manifest"
    url: "https://www.w3.org/TR/appmanifest/"
    publisher: "W3C"
  - title: "MDN — Web app manifest"
    url: "https://developer.mozilla.org/en-US/docs/Web/Manifest"
    publisher: "MDN"
  - title: "web.dev — Add a web app manifest"
    url: "https://web.dev/articles/add-manifest"
    publisher: "web.dev"
---

## What it is

A web app manifest is a JSON document linked from the HTML head that describes how the site should behave when installed to a device's home screen or app launcher. It is declarative metadata and nothing more: it never runs, caches nothing, and intercepts no requests. What it unlocks is how the site looks and installs: installability, splash screens, themed UI, and maskable icons that render correctly on every platform. It does not make the site work offline. That is the job of a separate [service worker](/spec/resilience/offline-support/), and the two are independent despite both wearing the "PWA" label. You can ship either without the other.

Serve it at `/site.webmanifest` or `/manifest.webmanifest` and link it from the page:

```html
<link rel="manifest" href="/site.webmanifest">
```

## Why it matters

Without a manifest, browsers cannot offer to install the site, and on Android the "Add to Home Screen" prompt falls back to a generic browser icon and the page title. With a manifest, the installed site gets a proper icon, a controlled start URL, and a window mode that can hide browser chrome. The same icons feed Android shortcuts, iOS home screen entries, Windows jump lists, and Chrome OS launchers.

The theme colour also lets browsers tint the status bar and the address bar to match the brand, which makes the site feel native even when it isn't installed.

## How to implement

A minimal manifest:

```json
{
  "name": "The Website Specification",
  "short_name": "WebSpec",
  "start_url": "/?utm_source=pwa",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0b5fff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Required fields for installability in Chromium browsers:

- `name` and `short_name` — the long form for splash screens, the short form for the home screen.
- `start_url` — usually `/`. Add a tracking parameter if you want to count installed launches separately.
- `display` — `standalone` hides browser chrome; `minimal-ui` keeps a tiny bar; `browser` opens in a regular tab.
- `icons` — at least one 192×192 and one 512×512 PNG. Add a separate icon with `"purpose": "maskable"` so Android can apply its adaptive icon mask without cropping content.
- `theme_color` and `background_color` — the first themes the OS chrome, the second paints the splash screen before the page loads.

The fields alone are not enough: installability also requires the page be served over HTTPS (or `localhost` in development). Serve the manifest file itself with `Content-Type: application/manifest+json`.

## Common mistakes

- Linking the manifest but serving it as `text/html` or with a missing file — installability silently fails.
- One square icon with the logo touching the edge, used as the maskable icon. Android crops it into a circle and chops the brand.
- `start_url` pointing to a 404 because someone changed the URL structure.
- Setting `display: fullscreen` and breaking the user's ability to leave the site.
- Forgetting `theme_color`, leaving the status bar bright white.

## Verification

- DevTools → **Application** → **Manifest**: every field parses, every icon loads.
- The "Install" affordance appears in the address bar in Chromium browsers.
- Test the maskable icon with [maskable.app](https://maskable.app).
- `curl -I https://example.com/site.webmanifest` returns `200` and `application/manifest+json`.
