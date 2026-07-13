---
title: "Scroll-driven animations"
slug: scroll-driven-animations
category: performance
summary: "Drive CSS animations from scroll position or element visibility with `scroll-timeline` and `view-timeline`, replacing JS scroll-listener libraries with compositor-thread animation."
status: optional
order: 125
appliesTo: [all]
relatedSlugs: [view-transitions, core-web-vitals, visibility-aware-rendering, reduced-motion]
updated: "2026-05-29T16:40:22.000Z"
sources:
  - title: "CSS Scroll-driven Animations Module Level 1"
    url: "https://drafts.csswg.org/scroll-animations-1/"
    publisher: "W3C"
  - title: "MDN — CSS scroll-driven animations"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations"
    publisher: "MDN"
  - title: "MDN — animation-timeline"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline"
    publisher: "MDN"
  - title: "Chrome for Developers — Scroll-driven animations"
    url: "https://developer.chrome.com/articles/scroll-driven-animations"
    publisher: "Google"
---

## What it is

Scroll-driven animations tie a CSS animation's progress to scroll position instead of the wall clock. The browser provides two timelines.

**`scroll-timeline`** — progress maps to how far a scroll container has been scrolled. Useful for reading-progress bars and parallax tied to the document.

**`view-timeline`** — progress maps to a subject element's intersection with its scrollport. Useful for "reveal as you scroll" effects, sticky-section pinning, and per-element entrance animations.

Anonymous shorthands cover the common cases without naming a timeline:

- `animation-timeline: scroll()` — bind to the nearest scrollable ancestor.
- `animation-timeline: view()` — bind to this element's own viewport intersection.

The colour status is `optional` because nothing breaks if you ship none of this. Where motion is part of the design, however, it is the right answer: it replaces a category of janky JavaScript with a declarative primitive that the compositor can run.

## Why it matters

- **Off the main thread.** Compositor-only properties (`transform`, `opacity`, `filter`) animate without touching JavaScript or layout. No INP cost, no scroll-listener debouncing, no `requestAnimationFrame` loop.
- **No library needed.** Replaces a stack of intersection-observer-plus-rAF code, often shipped as 20–60 kB of JavaScript, with a few lines of CSS.
- **Honours user preferences when you opt in.** Because the motion is yours, you must gate it on `prefers-reduced-motion: reduce` — see [reduced motion](/spec/accessibility/reduced-motion/).
- **Composable with view transitions.** Pair with [view transitions](/spec/performance/view-transitions/) for entrance + navigation animation that stays on the compositor.

## How to implement

Fade an element in as it scrolls into view:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(1rem); }
  to   { opacity: 1; transform: none; }
}

.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}

@media (prefers-reduced-motion: reduce) {
  .reveal { animation: none; }
}
```

`animation-range` tells the browser which slice of the view timeline drives the animation — here, from the element entering the scrollport until it has covered 30% of it.

For a top-of-page reading-progress bar, use `scroll()` instead:

```css
.progress {
  transform-origin: 0 50%;
  animation: progress linear;
  animation-timeline: scroll(root block);
}
@keyframes progress { to { transform: scaleX(1); } }
```

## Common mistakes

- **Animating layout properties** (`width`, `height`, `top`, `margin`) instead of `transform` and `opacity`. The compositor win disappears the moment the browser has to relayout on every frame.
- **Forgetting `prefers-reduced-motion`.** Scroll-driven motion is exactly the kind that triggers vestibular issues. Always provide an opt-out.
- **Replacing an Intersection Observer that runs logic.** Scroll-driven animations animate; they do not fire callbacks. If you need to lazy-init a widget, hydrate an island, or fetch data on visibility, keep the observer — see [visibility-aware rendering](/spec/performance/visibility-aware-rendering/).
- **Reaching for `scroll-timeline` when `view-timeline` would do.** Per-element reveal effects are simpler, more local, and easier to maintain with `view()`. Reserve `scroll()` for document-level effects like progress bars.
- **Long ranges with heavy keyframes.** Keep ranges tight; an animation that runs over half the page tends to feel laggy even when it is technically free.

## Verification

- Chrome DevTools → Animations panel records scroll-driven timelines and lets you scrub them.
- Toggle `prefers-reduced-motion: reduce` in DevTools → Rendering. The motion must disappear, not merely shorten.
- Run a Lighthouse or Web Vitals check. INP should be unaffected; if it regresses, you are animating the wrong property.
- Confirm the page still works with JavaScript disabled — scroll-driven animations are pure CSS and should degrade gracefully where unsupported.
