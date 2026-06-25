---
title: "CSS anchor positioning"
slug: anchor-positioning
category: foundations
summary: "Tether tooltips, menus, and popovers to the element that triggers them with pure CSS — no JavaScript positioning library, and it works across overflow and stacking boundaries."
status: recommended
order: 140
appliesTo: [all]
relatedSlugs: [popover-api, native-interactive-elements, scroll-driven-animations]
updated: "2026-06-24T00:00:00.000Z"
sources:
  - title: "CSS Anchor Positioning Module Level 1"
    url: "https://drafts.csswg.org/css-anchor-position-1/"
    publisher: "W3C CSS Working Group"
  - title: "MDN — Using CSS anchor positioning"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using"
    publisher: "MDN"
  - title: "MDN — anchor-name"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/anchor-name"
    publisher: "MDN"
  - title: "Introducing the CSS anchor positioning API"
    url: "https://developer.chrome.com/blog/anchor-positioning-api"
    publisher: "Chrome for Developers"
---

## What it is

CSS anchor positioning lets one element be positioned relative to another — its _anchor_ — without the two sharing a parent or a containing block. You name an anchor, associate a positioned element with it, and place that element against the anchor's edges using CSS alone.

Three pieces do the work:

- `anchor-name: --trigger` registers an element as a named anchor.
- `position-anchor: --trigger` on an absolutely (or fixed) positioned element associates it with that anchor.
- The `anchor()` function and the `position-area` property place the element against the anchor's edges.

```css
.trigger {
  anchor-name: --trigger;
}

.tooltip {
  position: absolute;
  position-anchor: --trigger;
  position-area: top center; /* sit above, centred on the anchor */
  margin-bottom: 0.5rem;
}
```

`anchor-size()` sizes an element from its anchor's dimensions (a dropdown panel as wide as its button), and `@position-try` plus `position-try-fallbacks` let the element flip to a different side when it would overflow the viewport.

## Why it matters

- **No JavaScript positioning library.** Tooltips, menus, comboboxes, and popovers have historically needed scripts (or Popper/Floating UI) to measure the trigger and reposition on scroll and resize. The browser now does this natively, every frame.
- **It crosses boundaries.** Anchor positioning works regardless of `overflow: hidden` ancestors, `z-index`, or `transform` containing blocks — the same constraints that break hand-rolled overlays. It pairs naturally with [the Popover API](/spec/foundations/popover-api/) and top-layer elements.
- **Viewport-aware by default.** `@position-try` gives you fallback positions, so an overlay that would clip off-screen flips to a side that fits — behaviour you previously wrote and maintained by hand.

## How to implement

Use it to position non-blocking UI relative to its trigger. Treat it as progressive enhancement: give the element a sensible static position first, then layer anchor positioning on top.

```css
@supports (anchor-name: --x) {
  .menu {
    position: absolute;
    position-anchor: --menu-button;
    position-area: bottom span-right;
    position-try-fallbacks: flip-block, flip-inline;
  }
}
```

`position-try-fallbacks` lists alternatives the browser tries in order until the element fits. `position-visibility: anchors-visible` hides the element when its anchor scrolls out of view, so a detached tooltip does not linger.

## Common mistakes

- **Forgetting to position the element.** `position-anchor` and `anchor()` only apply to an element with `position: absolute` or `fixed`. Without it, nothing moves.
- **No fallbacks.** An anchored element with a single fixed side will overflow the viewport near screen edges. Provide `position-try-fallbacks`.
- **Making it the only mechanism.** Until anchor positioning is universally available, keep a usable static fallback for browsers without support rather than leaving the overlay unpositioned.
- **Anchoring across documents.** Anchor and anchored element must be in the same document and not separated by certain layout containers — check the association actually resolves.

## Verification

- `@supports (anchor-name: --x)` gates the enhancement; confirm the fallback layout is acceptable on its own.
- In DevTools, inspect the anchored element and confirm its inset values resolve against the anchor.
- Scroll and resize the viewport: the element should follow its anchor and flip via fallbacks rather than clipping.
- Baseline: CSS anchor positioning became newly available across browsers in early 2026 — verify your target support before relying on it without a fallback.
