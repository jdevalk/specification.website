---
title: "Touch target size"
slug: touch-target-size
category: accessibility
summary: "Interactive controls must be large enough to tap or click reliably. WCAG 2.2 sets a 24×24 CSS px minimum, with 44×44 CSS px as the enhanced target."
status: required
order: 145
appliesTo: [all]
relatedSlugs:
  [keyboard-navigation, focus-indicators, empty-links-buttons, mobile-form-inputs, dragging-movements]
updated: "2026-06-08T00:00:00.000Z"
sources:
  - title: "WCAG 2.5.8 — Target Size (Minimum) Level AA"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"
    publisher: "W3C"
  - title: "WCAG 2.5.5 — Target Size (Enhanced) Level AAA"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html"
    publisher: "W3C"
  - title: "MDN — pointer (media feature)"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer"
    publisher: "MDN"
  - title: "Human Interface Guidelines — Layout"
    url: "https://developer.apple.com/design/human-interface-guidelines/layout"
    publisher: "Apple"
  - title: "Material Design — Accessibility: Layout and typography"
    url: "https://m2.material.io/design/usability/accessibility.html#layout-and-typography"
    publisher: "Google"
  - title: "WP Accessibility"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
---

## What it is

A touch target is the area a user can tap, click, or otherwise activate to trigger a control — a button, a link, a checkbox, an icon. The target is not just the visible glyph; it is the full hit area the browser registers as activating the control.

WCAG 2.2 introduced a new Level AA success criterion, **2.5.8 Target Size (Minimum)**, that requires interactive targets to be at least **24×24 CSS pixels**. The older Level AAA criterion, **2.5.5 Target Size (Enhanced)**, asks for **44×44 CSS pixels**. Apple's Human Interface Guidelines recommend **44pt**, and Material Design recommends **48dp**.

## Why it matters

Small targets are easy to miss. That penalises:

- Users with motor impairments — Parkinson's, tremors, arthritis, limited fine-motor control.
- Users on small phones, or holding a phone one-handed on a commute.
- Older users, whose pointing precision declines with age.
- Anyone tapping while walking, in a moving vehicle, or wearing gloves.

Mis-taps are not just annoying. They can submit the wrong form, open the wrong link, or trigger destructive actions like "delete".

## How to implement

Set a minimum size on every interactive element:

```css
button,
a.button,
[role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

For icon-only buttons that must look small, expand the hit area with padding rather than shrinking the target:

```css
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 10px; /* hit area extends past the 24px icon */
  background: transparent;
  border: 0;
}
```

```html
<button class="icon-button" aria-label="Close dialog">
  <svg width="24" height="24" aria-hidden="true">…</svg>
</button>
```

If a target genuinely must be smaller than 24 CSS px — for example, a dense data table — WCAG 2.5.8 allows it as long as a **24 px diameter circle around the target's centre does not overlap any other target**. The spacing alone satisfies the criterion.

**Inline links inside running prose are exempt** from both criteria. A link in a sentence is sized by the line-height of the paragraph, and forcing 44 px around each one would wreck typography.

## Adapt to the pointer

A mouse is precise; a fingertip is roughly 8–10 mm of imprecision. You can detect which the visitor is using and reserve the larger targets for touch, rather than forcing 44 px everywhere. The `pointer` and `hover` media features describe the *primary* input; `any-pointer` and `any-hover` describe whether *any* available input matches.

```css
/* Touch / stylus as the primary pointer: enlarge tap targets. */
@media (pointer: coarse) {
  .toolbar button { min-height: 44px; min-width: 44px; }
}

/* No reliable hover (most touchscreens): don't hide controls behind :hover. */
@media (hover: none) {
  .card-actions { opacity: 1; }
}
```

Two cautions. Treat this as *progressive enhancement* on top of a baseline that is already accessible — 24 px is the floor for every pointer, so never use `pointer: fine` as an excuse to ship sub-24-px controls to mouse users. And remember many devices have both a touchscreen and a trackpad; when a control must work for the coarsest available input, test with `any-pointer: coarse` rather than `pointer: coarse`.

## Common mistakes

- Setting `font-size` but no `min-height` on a button, so its hit area collapses on short labels.
- Tiny close (×) icons in dialogs and toasts, 16 px or less, with no padding.
- Stacking small icon buttons (share, like, bookmark) directly next to each other with no spacing.
- Wrapping a small icon in a link without giving the `<a>` a block-level layout — the link only hits the glyph.
- Removing `padding` "to make the design tighter" and shipping a button you can only tap with a stylus.

## Verification

- Inspect the element in DevTools. Read the computed `width` and `height` (or the bounding box). Both must be at least 24 CSS px; aim for 44.
- On a real phone, try tapping every primary control with a thumb, one-handed. If you miss, it is too small.
- Run axe DevTools or Lighthouse — both flag WCAG 2.5.8 failures.
- For dense UIs, draw a 24 px circle around each target's centre and check no two circles overlap.
