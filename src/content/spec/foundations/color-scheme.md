---
title: "<meta name=\"color-scheme\">"
slug: color-scheme
category: foundations
summary: "Tells the browser which colour schemes your page is designed for. Prevents the white flash that dark-mode users see before your CSS loads, and lets the browser style scrollbars, form controls, and the page background to match."
status: recommended
order: 95
appliesTo: [all]
relatedSlugs: [theme-color, favicons, pwa-manifest, forced-colors, text-wrap]
updated: "2026-05-29T17:40:31.000Z"
sources:
  - title: "HTML Living Standard — Standard metadata names: color-scheme"
    url: "https://html.spec.whatwg.org/multipage/semantics.html#meta-color-scheme"
    publisher: "WHATWG"
  - title: "CSS Color Adjustment Module Level 1 — the color-scheme property"
    url: "https://www.w3.org/TR/css-color-adjust-1/#color-scheme-prop"
    publisher: "W3C"
  - title: "MDN — <meta name=\"color-scheme\">"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/color-scheme"
    publisher: "MDN"
  - title: "web.dev — Improve dark mode default with color-scheme"
    url: "https://web.dev/articles/color-scheme"
    publisher: "web.dev"
---

## What it is

`color-scheme` declares which colour schemes your page is designed for — light, dark, or both. The browser uses that information to pick sensible defaults for things you didn't style yourself: the canvas background it paints before your CSS loads, scrollbars, native form controls, and the white-space around `<input>` and `<textarea>` elements.

There are two places to set it. The HTML meta tag sets the document-level default:

```html
<meta name="color-scheme" content="light dark" />
```

The CSS property sets it on any element (and is the only form that participates in the cascade):

```css
:root { color-scheme: light dark; }
```

Ship both. The meta tag takes effect before any stylesheet parses, so it prevents the white flash dark-mode users would otherwise see during page load. The CSS property is the authoritative source once styles arrive, and lets you scope schemes to subtrees if you ever need to.

**This site ships it.** [`HeadMeta.astro`](https://github.com/jdevalk/specification.website/blob/main/src/components/HeadMeta.astro) emits `<meta name="color-scheme" content="light dark">` plus a matched pair of `theme-color` tags with `media="(prefers-color-scheme: ...)"`, and [`global.css`](https://github.com/jdevalk/specification.website/blob/main/src/styles/global.css) flips the `--color-ink-*` token scale inside `@media (prefers-color-scheme: dark)` so every utility that references those tokens — backgrounds, borders, body text, code blocks — switches with the user's OS preference. Accent green is held constant and lifted for text contrast on dark surfaces.

## Why it matters

Without `color-scheme`, the browser assumes the page is light-only. A dark-mode user opening your site sees a blink of white background before your CSS paints — even if your stylesheet is perfectly dark-mode-ready. Native form controls, date pickers, and scrollbars also stay in their light defaults until you restyle every one by hand.

With `color-scheme: light dark` (or just `dark` if your site is dark-only), the browser:

- paints the initial canvas in a colour matching the user's preference;
- renders `<input type="date">`, `<select>`, file pickers, and other form controls in the right scheme;
- gives scrollbars the right contrast against your background;
- treats `currentColor` defaults sensibly for things you forgot to style.

It is distinct from [`<meta name="theme-color">`](/spec/foundations/theme-color/). `theme-color` paints the **browser chrome around** the page (address bar, task switcher, PWA title bar). `color-scheme` styles the **page surface itself** and its native controls. Both should ship; neither replaces the other.

## How to implement

The valid values for the `content` attribute are `normal`, `light`, `dark`, `light dark`, `dark light`, and `only light`. List the preferred scheme first; the others are acceptable fallbacks. `only dark` is explicitly not allowed by the HTML spec — there is no way to forbid light mode, because forcing a page into dark mode the page wasn't built for produces unreadable contrast.

```html
<head>
  <meta name="color-scheme" content="light dark" />
  <link rel="stylesheet" href="/styles.css" />
</head>
```

```css
:root {
  color-scheme: light dark;
  --bg: light-dark(#ffffff, #0b1020);
  --fg: light-dark(#0b1020, #ffffff);
}

body { background: var(--bg); color: var(--fg); }
```

CSS's `light-dark()` function reads the *used* colour scheme from `color-scheme` and picks the matching value. It replaces most cases where you would have reached for `@media (prefers-color-scheme: dark)`.

If your site has a theme switcher independent of the OS preference, update both the meta tag and the root CSS dynamically — or use a CSS custom property for the scheme and toggle it.

## Common mistakes

- Setting `<meta name="theme-color">` for dark mode but forgetting `color-scheme`. The browser chrome is dark; the page underneath still flashes white on load.
- Using `only dark` — invalid; pick `dark` and accept the light fallback.
- Setting `color-scheme: dark` on a site that has not been audited in dark mode. Form controls and scrollbars will recolour and you will discover broken contrast in production.
- Forgetting `light dark` order matters. The first value is the *preferred* scheme when the user has no preference set.

## Verification

- `curl -s https://example.com/ | grep -i 'name="color-scheme"'` returns the meta tag.
- In Chrome DevTools → Rendering, toggle "Emulate CSS prefers-color-scheme: dark" and reload. The page background should switch immediately, with no white flash.
- View a page with a native form control (`<input type="date">`) in both schemes — the picker UI itself should match.
- Run `getComputedStyle(document.documentElement).colorScheme` in the console — it should return the value you set, not `normal`.
