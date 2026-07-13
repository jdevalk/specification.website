---
title: "Visibility-aware rendering"
slug: visibility-aware-rendering
category: performance
summary: "Use `content-visibility` with `contain-intrinsic-size` to skip layout and paint for off-screen content, and Intersection Observer to drive lazy behaviour, instead of scroll and resize listeners."
status: optional
order: 115
appliesTo: [all]
relatedSlugs: [core-web-vitals, lazy-loading, image-optimization, script-loading]
updated: "2026-07-06T00:00:00.000Z"
sources:
  - title: "CSS Containment Module Level 2"
    url: "https://drafts.csswg.org/css-contain-2/"
    publisher: "W3C CSSWG"
  - title: "MDN — content-visibility"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility"
    publisher: "MDN"
  - title: "Intersection Observer"
    url: "https://www.w3.org/TR/intersection-observer/"
    publisher: "W3C"
  - title: "MDN — Intersection Observer API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
    publisher: "MDN"
---

## What it is

Two platform primitives for "do work only when content is actually visible".

**`content-visibility: auto`** is a CSS property from the Containment module. It tells the browser it may skip rendering work — layout, style, paint — for a subtree while that subtree is off-screen. When the element scrolls near the viewport, the browser renders it as normal.

**Intersection Observer** is a Web API that fires a callback when an element crosses a configurable threshold relative to the viewport (or another scroll root). It replaces hand-rolled `scroll` and `resize` listeners that ran on every frame.

## Why it matters

- **Long pages and card grids get cheaper.** A page with hundreds of sections, product cards, or comments pays the layout and paint cost for all of them on every change. `content-visibility: auto` reduces that to just what is on screen, often a multiple-times reduction in rendering time on initial load and interaction.
- **Scroll handlers stop being the bottleneck.** `scroll` listeners fire dozens of times per second on the main thread. Intersection Observer hands the work to the browser's compositor and only wakes your code at the threshold you asked for.
- **Built-in primitives beat libraries.** Lazy-init for embeds, "load more" triggers, viewport-driven analytics, and reveal animations all collapse to the same small API.

## How to implement

**`content-visibility` on long, repeating sections.** Always pair it with `contain-intrinsic-size` so the browser can reserve layout space for the skipped subtree:

```css
.card,
article > section {
  content-visibility: auto;
  contain-intrinsic-size: auto 600px;
}
```

The intrinsic size is a placeholder used until the real content is rendered. Pick a value close to the real rendered size of the block.

**Intersection Observer for everything `loading="lazy"` doesn't cover.** Native `loading="lazy"` on `<img>` and `<iframe>` already handles the simple image case — reach for IO for widgets, infinite-scroll triggers, and visibility analytics:

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.dataset.seen = 'true';
      io.unobserve(entry.target);
    }
  }
}, { rootMargin: '200px 0px' });

document.querySelectorAll('[data-lazy]').forEach((el) => io.observe(el));
```

`rootMargin` lets you start work *before* the element is on screen, so the user doesn't see a flash of empty space.

## Common mistakes

- **Omitting `contain-intrinsic-size`.** The skipped subtree collapses to zero height, the scrollbar jumps as content streams in, and CLS suffers.
- **Picking an intrinsic size much smaller than reality.** Same scrollbar-jank problem, just spread across the whole page.
- **Using Intersection Observer where `loading="lazy"` would do.** For below-the-fold images and iframes, the HTML attribute is simpler and ships in every modern browser.
- **Debounced scroll listeners.** If you're throttling `scroll` to fake an IO callback, just use IO. It is cheaper and more accurate.
- **Forgetting to `disconnect()`.** In long-lived single-page apps, observers attached to torn-down views leak. Disconnect when the view unmounts.

## Verification

- Chrome DevTools → Performance panel. Record a scroll through a long page with and without `content-visibility: auto`. The "Rendering" and "Painting" bands should shrink sharply.
- DevTools → Rendering → "Layout Shift Regions" and the Web Vitals overlay. Verify CLS does not regress after adding `content-visibility` — if it does, your `contain-intrinsic-size` is wrong.
- In the console, inspect `IntersectionObserverEntry.intersectionRatio` and `entry.isIntersecting` inside your callback to confirm thresholds fire when expected.
- Search the codebase for `addEventListener('scroll'` and `addEventListener('resize'`. Each hit is a candidate for replacement.
