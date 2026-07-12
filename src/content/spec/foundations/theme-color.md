---
title: "<meta name=\"theme-color\">"
slug: theme-color
category: foundations
summary: "Tints the browser chrome and OS surfaces to match your brand. Use the media attribute to ship one colour for light mode and another for dark mode."
status: recommended
order: 90
appliesTo: [all]
relatedSlugs: [color-scheme, favicons, meta-viewport, open-graph]
updated: "2026-06-08T00:00:00.000Z"
sources:
  - title: "MDN — <meta name=\"theme-color\">"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color"
    publisher: "MDN"
  - title: "HTML Living Standard — Other metadata names: theme-color"
    url: "https://html.spec.whatwg.org/multipage/semantics.html#meta-theme-color"
    publisher: "WHATWG"
  - title: "W3C — Web App Manifest, theme_color"
    url: "https://www.w3.org/TR/appmanifest/#theme_color-member"
    publisher: "W3C"
---

## What it is

`theme-color` suggests a colour for the browser or OS to use when rendering surfaces around the page — the address bar on mobile, the title bar of an installed PWA, the task switcher card, and notification accents.

```html
<meta name="theme-color" content="#0b1020" />
```

The value is any valid CSS colour: hex, `rgb()`, `hsl()`, or a named colour.

## Why it matters

Mobile browsers render a thin strip above the page — the URL bar in Safari and Chrome on iOS and Android. By default it is grey or white. With `theme-color`, that strip can match your brand, so the page and the chrome around it look like one continuous surface.

The same value is used by:

- **iOS Safari** to tint the status bar area when scrolled.
- **Chrome on Android** for the address bar and the task switcher card.
- **PWAs and installed web apps** for the system title bar.
- **macOS Safari 15+** to tint the tab bar of the focused tab.

A page without `theme-color` is not broken, but the visual seam between page content and browser chrome is more obvious. With it, the page feels polished and "native-ish" on mobile.

## How to implement

Set one value for light mode and one for dark mode using the `media` attribute:

```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0b1020" media="(prefers-color-scheme: dark)" />
```

Browsers pick the value whose `media` query matches the user's current colour scheme. If only one tag is present, it is used in every mode — fine for sites with a single fixed palette.

Pick colours that match the **edges** of your page, not the centre. The strip sits flush against your `<body>` background; if your header is dark and the rest of the page is light, the theme colour should match the header.

For an installed PWA, the manifest's `theme_color` and `background_color` are used at launch. Set both for a smooth splash:

```json
{
  "name": "The Website Specification",
  "theme_color": "#0b1020",
  "background_color": "#0b1020"
}
```

The manifest value is used once at install/launch time; the meta tag is consulted on every page load. They can differ if you want a different colour during the splash than during normal browsing, but matching them avoids a visible jump.

### When you ship a manual theme toggle

The `media`-based tags follow the **operating system**, not an in-page switcher. If you let users force dark mode independently of the OS, a visitor on a light OS who picks dark gets a dark page with a *light* address bar — the `(prefers-color-scheme: light)` tag still matches. The chrome and the content disagree.

Fix it in script: write a single `theme-color` value that reflects the *resolved* theme, and make sure it wins. Browsers read the **first** `theme-color` meta in document order whose `media` matches, so insert your dynamic tag ahead of the media ones:

```js
function syncThemeColor(theme) {
  let m = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!m) {
    m = document.createElement('meta');
    m.name = 'theme-color';
    document.head.prepend(m); // ahead of the media-based tags, so it wins
  }
  m.content = theme === 'dark' ? '#0b1020' : '#ffffff';
}
```

Set it **before paint** in the same inline script that restores the stored theme, then keep it in sync whenever the user toggles. Leave the two `media` tags in place as the no-JS fallback. This site does exactly that — see the early-init script in `BaseLayout.astro` and `theme-toggle.js`.

## Common mistakes

- A theme colour with low contrast against the address-bar text. Safari and Chrome render the URL in dark or light text based on the luminance of `theme-color`; an unreadable URL is a real bug.
- Setting only the dark-mode value, so light-mode users see the default grey.
- Relying on the `media`-based tags alone while shipping an in-page dark-mode toggle. They track the OS, so a manual override leaves the chrome out of step — drive `theme-color` from the resolved theme instead.
- Forgetting to update the value when redesigning. The address bar starts looking off-brand months before anyone notices.
- Animating it on scroll. It is metadata, not a paint surface — leave it static.
- Putting hex values with alpha (`#0b1020aa`). Browsers ignore the alpha channel; use an opaque colour.

## Verification

- Open the site on iOS Safari or Chrome on Android. The address bar should be tinted to match your site.
- Toggle the OS between light and dark mode. The strip should change.
- Install the site as a PWA and check the title bar and splash screen colours.
- In DevTools, run `document.querySelector('meta[name="theme-color"]').content` and confirm the value.
