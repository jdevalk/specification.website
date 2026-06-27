---
title: "CSS containment"
slug: css-containment
category: performance
summary: "Use `contain: layout paint style` (or the `contain: content` shorthand) to tell the browser that an element's internals cannot affect the rest of the page, so reflow and repaint stay isolated to that subtree."
status: optional
order: 120
appliesTo: [all]
relatedSlugs: [core-web-vitals, critical-css, visibility-aware-rendering, container-queries]
updated: "2026-05-29T16:40:22.000Z"
sources:
  - title: "CSS Containment Module Level 2"
    url: "https://drafts.csswg.org/css-contain-2/"
    publisher: "W3C"
  - title: "MDN — contain"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/contain"
    publisher: "MDN"
  - title: "web.dev — content-visibility: boost rendering performance"
    url: "https://web.dev/articles/content-visibility"
    publisher: "Google"
---

## What it is

The `contain` CSS property is a hint to the rendering engine: the element's subtree is independent of the rest of the document, so the browser can scope layout, paint, and style work to it. Four containment types compose:

- **`layout`** — descendants do not affect the layout of anything outside the element, and vice versa.
- **`paint`** — descendants are clipped to the element's box; nothing paints outside it.
- **`style`** — counters and quotes inside the element do not leak out.
- **`size`** — the element's own size is computed without consulting its children. Requires an explicit size or `contain-intrinsic-size`, otherwise the box collapses.

The shorthand `contain: content` is equivalent to `layout paint style` — deliberately excluding `size`, because most components do not have a known intrinsic size. The stricter `contain: strict` adds `size` on top.

## Why it matters

Browsers optimise rendering by computing layout, paint, and style for the smallest possible scope. Without containment, a class change deep inside a card can force the browser to recompute the layout of the surrounding page, because, in principle, an element's children can affect ancestors (think percentage heights, intrinsic sizing, or `position: absolute` escaping). Containment lets you assert that they cannot, so the engine can skip work it would otherwise have to do defensively.

The payoff is largest on pages with many independent components — feeds, grids, dashboards, long article comments — where a single interaction would otherwise invalidate a chunk of the document.

## How to implement

Apply `contain: content` to self-enclosed components — cards, sidebars, widgets, repeated list items — where children stay within the box and have predictable sizing:

```css
.card,
.sidebar-widget,
.feed-item {
  contain: content;
}
```

For off-screen sections, pair with `content-visibility: auto` so the browser can skip rendering entirely until the section approaches the viewport:

```css
article > section {
  content-visibility: auto;
  contain-intrinsic-size: 0 800px;
}
```

## Common mistakes

- **Applying `contain: size` without `contain-intrinsic-size`.** The box collapses to zero in the contained axis, because children no longer contribute to its size.
- **Containing elements whose children must overflow visually.** Tooltips, dropdown menus, and floating labels get clipped by `paint` containment.
- **Reaching for `contain: strict` at the page level.** Sticky positioning, fixed children, and anchor scrolling break when their containing block is unexpectedly isolated.
- **Treating containment as free.** There is a small cost to maintaining the boundary; apply it where you have measured a benefit, not as a reflex.

## Verification

- Chrome DevTools → Performance panel. Record an interaction before and after; recalc-style and layout costs on the contained subtrees should drop.
- DevTools → Rendering → "Paint flashing" and "Layer borders". Confirms the isolation is real — paint should not extend past contained boxes.
- Test scroll and interaction on long pages on a mid-range device. If frame times do not improve, the bottleneck was elsewhere; revert.
