---
title: "Forced colours mode"
slug: forced-colors
category: accessibility
summary: "Respect forced colours mode (Windows High Contrast and similar). The `forced-colors` media feature lets you repair UI the user's palette would otherwise flatten — without overriding their choice."
status: recommended
order: 15
appliesTo: [all]
relatedSlugs: [color-contrast, color-scheme, reduced-motion, contrast-color]
updated: "2026-06-22T00:00:00.000Z"
sources:
  - title: "CSS Media Queries Level 5 — forced-colors"
    url: "https://drafts.csswg.org/mediaqueries-5/#forced-colors"
    publisher: "W3C"
  - title: "CSS Color Adjustment Module Level 1 — forced-color-adjust"
    url: "https://drafts.csswg.org/css-color-adjust-1/#forced"
    publisher: "W3C"
  - title: "MDN — forced-colors"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors"
    publisher: "MDN"
---

## What it is

Some users override every site's colours with a small, high-contrast palette of their own. Windows High Contrast mode is the best-known example; the operating system or browser substitutes the user's chosen foreground, background, link, and button colours for whatever the page declared. The browser exposes that state through the `forced-colors` media feature, which is `active` when a forced palette is in effect.

```css
@media (forced-colors: active) {
  .card {
    /* box-shadow is forced to none — restore the boundary with a border */
    border: 1px solid CanvasText;
  }
}
```

Forced colours mode works automatically for most semantic markup. The feature exists for the cases where the substitution removes information — and for the rare element that should opt out via `forced-color-adjust`.

## Why it matters

The high contrast of a reduced palette is essential for some users with low vision, light sensitivity, or cognitive needs to read a page at all. When forced colours apply, the browser drops `box-shadow`, flattens background images behind text, and recolours borders and text to system colours. UI that relied on a shadow, a background-colour swatch, or a coloured-but-borderless control can lose its visible boundary entirely.

Respecting the mode means two things: never fighting the user's palette, and repairing the few places where their palette erases a distinction your design carried in colour alone.

## How to implement

- **Build on semantic HTML.** Real `<button>`, `<a>`, and form controls map to system colour keywords automatically; custom `<div>` widgets do not.
- **Use CSS system colours** inside the query — `CanvasText`, `Canvas`, `LinkText`, `ButtonText`, `ButtonFace`, `Highlight` — so repairs track the user's actual palette rather than hard-coded values.
- **Restore lost boundaries.** Where a control or container was defined by `box-shadow` or background colour alone, add a `border` or `outline` inside `@media (forced-colors: active)`.
- **Opt out sparingly.** `forced-color-adjust: none` on an element (e.g. a colour-picker swatch or a meaningful chart key) preserves its own colours. Use it only where the colour *is* the information.
- **Pair with `prefers-contrast: more`** for users who asked for higher contrast without a forced palette — the two queries serve different audiences.

The site ships forced-colours-aware styles; see the related [colour contrast](/spec/accessibility/color-contrast/) page.

## Common mistakes

- Hard-coding colours inside the query instead of using system colour keywords, re-breaking the user's palette.
- Conveying state (selected, error, disabled) through colour that forced mode discards, with no border, icon, or text fallback.
- Slapping `forced-color-adjust: none` across large regions, defeating the mode for everything inside.
- Using the deprecated `-ms-high-contrast` media query instead of standard `forced-colors`.

## Verification

- On Windows, enable **Settings → Accessibility → Contrast themes** and pick a theme; reload the page.
- In Chrome or Edge DevTools, open the Rendering panel and set **Emulate CSS media feature forced-colors: active**.
- Confirm every control and container keeps a visible boundary, and that no state is signalled by colour alone.
