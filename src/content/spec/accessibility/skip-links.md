---
title: "Skip links"
slug: skip-links
category: accessibility
summary: "A 'skip to main content' link as the first focusable element lets keyboard and screen-reader users jump past repeated navigation on every page."
status: required
order: 60
appliesTo: [all]
relatedSlugs: [keyboard-navigation, semantic-html, focus-indicators, inert-attribute]
updated: "2026-06-08T00:00:00.000Z"
sources:
  - title: "WCAG 2.4.1 — Bypass Blocks (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html"
    publisher: "W3C"
  - title: "W3C WAI — Skip Links"
    url: "https://www.w3.org/WAI/WCAG22/Techniques/general/G1"
    publisher: "W3C WAI"
  - title: "WebAIM — Skip Navigation Links"
    url: "https://webaim.org/techniques/skipnav/"
    publisher: "WebAIM"
---

## What it is

A skip link is an in-page anchor — usually the first focusable element in `<body>` — that jumps to the start of the main content. It is hidden until it receives focus, so it stays out of the sighted user's way but is the first thing a keyboard or screen-reader user hits.

## Why it matters

Every page on a site usually starts with the same header, navigation, search box, and notification bar. Without a skip link, a keyboard user tabs through twenty controls before reaching the article they came for, on every single page. Screen-reader users have heading and landmark shortcuts, but switch-device and Tab-only users have nothing. WCAG 2.4.1 (Level A) requires a mechanism to bypass blocks of repeated content; a skip link is the most widely supported way to satisfy it.

## How to implement

Put the link first in the document order and target the main content container:

```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>…</header>
  <nav>…</nav>
  <main id="main" tabindex="-1">
    <!-- page content -->
  </main>
</body>
```

Style it so it is invisible by default and visible on focus:

```css
.skip-link {
  position: absolute;
  inset-inline-start: 1rem;
  inset-block-start: -3rem;
  background: #000;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  z-index: 1000;
  transition: inset-block-start 0.15s;
}

.skip-link:focus {
  inset-block-start: 1rem;
}
```

Notes:

- **Use `display: none` is wrong.** It removes the link from the accessibility tree. Use offscreen positioning instead.
- **`tabindex="-1"`** on `<main>` ensures focus actually moves to it when the link is followed; some browsers otherwise just scroll the page.
- **One link is usually enough.** A second link to the navigation is fine if the nav is also long.
- **Keep the text plain.** "Skip to main content" is well understood.

## Common mistakes

- Skip link present but never visible on focus (no `:focus` style).
- Skip link points to a `<div>` with no `id`, or the target has been renamed.
- Skip link hidden with `display: none`, so it never receives focus.
- Decorative banners or cookie modals sit between the skip link and the main content and steal focus.

## Verification

- Load the page and press Tab once. The skip link must appear.
- Press Enter. Focus must move into the main content, not just scroll the page.
- Confirm the link is reachable on every template, not only on the homepage.
