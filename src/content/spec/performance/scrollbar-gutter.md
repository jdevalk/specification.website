---
title: "Scrollbar gutter"
slug: scrollbar-gutter
category: performance
summary: "Use scrollbar-gutter: stable to reserve scrollbar space and stop horizontal layout shift between pages or states that overflow vs. don't."
status: recommended
order: 130
appliesTo: [all]
relatedSlugs: [view-transitions, core-web-vitals, color-scheme, dynamic-viewport-units]
updated: "2026-05-29T16:40:22.000Z"
sources:
  - title: "CSS Overflow Module Level 3 — scrollbar-gutter"
    url: "https://drafts.csswg.org/css-overflow-3/#scrollbar-gutter-property"
    publisher: "W3C CSSWG"
  - title: "MDN — scrollbar-gutter"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter"
    publisher: "MDN"
  - title: "web.dev — scrollbar-gutter and scrollbar-width are Baseline Newly available"
    url: "https://web.dev/blog/baseline-scrollbar-props"
    publisher: "Google"
---

## What it is

`scrollbar-gutter` is a CSS property that controls whether a scroll container reserves space for a classic scrollbar even when one isn't currently shown. It takes three values you actually care about:

- **`auto`** (default) — the gutter appears only when content overflows. Short pages have no scrollbar; tall pages do.
- **`stable`** — the gutter is always reserved on the inline-end edge, whether or not the scrollbar is visible.
- **`stable both-edges`** — the gutter is reserved on both inline edges, so horizontal symmetry is preserved.

It only affects *classic* scrollbars — the kind that take layout space, common on Windows and on macOS when "Always show scrollbars" is enabled. Overlay scrollbars (the macOS and mobile default) float over content, so the property has no visible effect there.

```css
html {
  scrollbar-gutter: stable;
}
```

This site ships exactly that on `:root` in `src/styles/global.css`.

## Why it matters

- **No more page-to-page jolt.** A short page has no scrollbar; the next page does. Without `scrollbar-gutter: stable`, the viewport width snaps by 15–17px between navigations and the whole layout jumps sideways.
- **No mid-page jolt either.** The same shift happens within a single page when content grows or shrinks — a filter panel collapsing, an accordion opening, async-loaded content arriving below the fold.
- **Field-CLS friendly.** Layout shift caused by scrollbar appearance counts as real CLS in many implementations. It's a cheap [Core Web Vitals](/spec/performance/core-web-vitals/) win.
- **Animated navigations need it.** Paired with [view transitions](/spec/performance/view-transitions/) and prerendered links, a 15px width snap on swap makes an otherwise polished navigation look amateur.

## How to implement

Apply it once at the root:

```css
:root {
  scrollbar-gutter: stable;
}
```

That's the whole intervention for the common case. If your layout is centred and you want guaranteed symmetry regardless of overflow state:

```css
:root {
  scrollbar-gutter: stable both-edges;
}
```

Apply it to genuinely-scrollable nested regions (a sidebar with its own overflow, a modal body) on the same principle — but only those, not every element with `overflow` set.

## Common mistakes

- Applying it to a small element where the scrollbar is part of the visual design. The gutter then shows even when no scroll is needed. Restrict it to the root viewport or genuinely-scrollable regions.
- Combining it with custom `::-webkit-scrollbar` styling that already reserves layout space. You'll end up with a double gutter.
- Forgetting RTL. `stable` reserves on the inline-end edge — right in LTR, left in RTL. If you need predictable symmetry across both directions, use `stable both-edges`.
- Reaching for it to fix fluctuating content widths inside the page. That's a `min-height`, container query, or `aspect-ratio` job — `scrollbar-gutter` only addresses the scrollbar itself.

## Verification

- Open a short page and a tall page on the same site in the same window. The horizontal position of every element should stay identical. Without `scrollbar-gutter: stable`, it doesn't.
- Chrome DevTools → Rendering → Layout Shift Regions. Navigate between pages; there should be no flash on the right edge.
- Test on a system using overlay scrollbars (macOS default) *and* one using classic scrollbars (Windows default, or macOS Settings → Appearance → "Always" show scrollbars). Only the classic case shows the difference — which is exactly why it has to be tested there.
