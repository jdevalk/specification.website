---
title: "Dynamic viewport units (dvh, svh, lvh)"
slug: dynamic-viewport-units
category: performance
summary: "On mobile, 100vh is taller than the screen because it ignores the browser's collapsing toolbar. Use dvh, svh, and lvh to size full-height elements to the viewport that is actually visible."
status: recommended
order: 135
appliesTo: [all]
relatedSlugs: [core-web-vitals, scrollbar-gutter, meta-viewport, view-transitions, container-queries]
updated: "2026-06-08T00:00:00.000Z"
sources:
  - title: "CSS Values and Units Module Level 4 — Viewport-relative lengths"
    url: "https://drafts.csswg.org/css-values-4/#viewport-relative-lengths"
    publisher: "W3C CSSWG"
  - title: "MDN — Viewport-percentage lengths"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths"
    publisher: "MDN"
  - title: "web.dev — The large, small, and dynamic viewport units"
    url: "https://web.dev/blog/viewport-units"
    publisher: "web.dev"
---

## What it is

`dvh`, `svh`, and `lvh` are viewport-relative length units that describe a *height* the way `vh` always promised to but never delivered on mobile. They come with `vw` siblings (`dvw`, `svw`, `lvw`) and a matching set for the inline and block axes (`vi`, `vb`).

The three height units differ in which mobile viewport they measure:

- **`lvh`** — the **large** viewport: the screen with the browser's URL bar and toolbar *retracted*. `100lvh` is the same as the legacy `100vh`.
- **`svh`** — the **small** viewport: the screen with that chrome *fully shown*. `100svh` is always the safe maximum that fits without scrolling.
- **`dvh`** — the **dynamic** viewport: whatever is visible *right now*. It updates live as the toolbar slides in and out while the user scrolls.

```css
.hero { min-height: 100svh; }   /* never overflows */
.sheet { max-height: 100dvh; }  /* tracks the toolbar live */
```

## Why it matters

On a phone, the browser's toolbar collapses as you scroll down and reappears as you scroll up, so the visible height changes during a single page view. The original `vh` unit resolved to the *largest* possible height. An element set to `height: 100vh` is therefore taller than the screen whenever the toolbar is showing — its bottom edge sits behind the URL bar, hiding a "Continue" button, cutting off a full-screen menu, or leaving a strip that only appears after scrolling.

The dynamic units fix this without JavaScript. For years the workaround was a `resize` listener writing a `--vh` custom property on every frame — janky, and a needless main-thread cost that works against [Core Web Vitals](/spec/performance/core-web-vitals/). The units replace all of it. They are [Baseline](https://web.dev/baseline) and supported in every current browser engine.

## How to implement

- For an element that must **always fit** on first paint — a landing hero, a login screen, a modal — use `svh`. It is the conservative choice that never overflows, in any toolbar state.
- For an element that should **track the visible area** as the chrome moves — a bottom sheet, a slide-out menu, an overlay's max-height — use `dvh`.
- Use `lvh` only when you deliberately want the retracted-toolbar height; it behaves like the old `vh`.
- Keep a `vh` fallback first if you support very old browsers: `height: 100vh; height: 100dvh;`. The cascade ignores the unit it doesn't understand.

This site ships it: the ⌘K search overlay and the mobile navigation menu are capped with `dvh` in `src/styles/global.css`, so neither extends behind the address bar on a phone.

## Common mistakes

- **Animating `dvh`-sized layout.** Because `dvh` changes as the toolbar slides, an element whose `height` is in `dvh` reflows continuously during the scroll, which can look jittery and shift content. For large always-on regions in the scroll flow, prefer `svh`; reserve `dvh` for elements where live tracking is the point. (Capping a modal or menu with `max-height: …dvh` is safe — it's only an upper bound, and an open `<dialog>` locks background scrolling, so the toolbar isn't moving while it shows. That's how this site uses it.)
- **Using `100vh` for a hero and assuming it fits.** It does on desktop and lies on mobile. Switch to `svh`.
- **Reaching for a JavaScript `--vh` hack.** That pattern predates these units and is now pure technical debt.

## Verification

- On a real phone, scroll a page with a `100svh` and a `100vh` section. The `vh` one is cut off at the bottom while the toolbar shows; the `svh` one is not.
- In Chrome or Safari device emulation, toggle the simulated toolbar and confirm `dvh`-sized elements resize while `lvh`-sized ones stay fixed.
