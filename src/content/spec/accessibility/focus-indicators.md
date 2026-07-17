---
title: "Visible focus indicators"
slug: focus-indicators
category: accessibility
summary: "Whenever a control receives keyboard focus, the page must show a clear, high-contrast indicator. Removing focus outlines without a replacement is a top accessibility failure."
status: required
order: 50
appliesTo: [all]
relatedSlugs: [keyboard-navigation, color-contrast, inert-attribute, focus-not-obscured]
updated: "2026-07-17T00:00:00.000Z"
sources:
  - title: "WCAG 2.4.7 — Focus Visible (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
    publisher: "W3C"
  - title: "WCAG 1.4.11 — Non-text Contrast (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
    publisher: "W3C"
  - title: "WCAG 2.4.13 — Focus Appearance (Level AAA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html"
    publisher: "W3C"
  - title: "MDN — :focus-visible"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible"
    publisher: "MDN"
---

## What it is

A focus indicator is the visible cue that tells a keyboard user which control will receive their next keystroke. Browsers ship one by default — usually a thin outline ring. WCAG 2.4.7 (Level AA) requires the active focus location to be visible at all times when navigating by keyboard.

WCAG 2.2 added two more rules. 2.4.13 (AAA) sets a minimum size and contrast for the indicator itself. 2.4.11 (AA) requires that the focused element is not hidden behind sticky headers or cookie banners — a separate failure with a separate fix, covered in [focus not obscured](/spec/accessibility/focus-not-obscured/). This page is about drawing the indicator; that one is about whether anything is sitting on top of it.

## Why it matters

Without a focus ring, a keyboard user is navigating blind — they tab three times, do not know where they are, and give up. The single most common cause is a stylesheet that hides the default ring to "tidy up the design":

```css
/* Don't ship this. */
*:focus { outline: none; }
```

This is a Level AA failure. If you remove the default style, you must replace it with something equal or better.

## How to implement

Use `:focus-visible` so the focus style appears for keyboard users but not for every mouse click on a button:

```css
button:focus-visible,
a:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid #0b5fff;
  outline-offset: 2px;
  border-radius: 4px;
}
```

Guidelines:

- **Contrast at least 3:1** against the adjacent colour, both focused and unfocused (1.4.11).
- **At least 2 CSS pixels thick** to meet 2.4.13's enclosed-area minimum.
- **Offset the outline** away from the control so it never disappears into the border.
- **Two-tone rings** (a light ring and a dark ring) work on any background.
- **Keep focus visible across sticky UI.** A ring you drew correctly still fails if a sticky header covers it — see [focus not obscured](/spec/accessibility/focus-not-obscured/) for the scroll-padding fix.

`:focus-visible` is supported in every current browser. If you need to support older engines, pair it with `:focus` as a fallback.

## Common mistakes

- `outline: none` with no replacement.
- A focus style that only changes the text colour by a small amount.
- A focus ring drawn inside the button so the button's own background hides it.
- Custom widgets (cards, tab lists) that never style their focused state.

## Verification

- Tab through every page template; the focused control must be obvious from across the room.
- Check the contrast of the focus ring against its background.
- Confirm nothing covers the ring once it is drawn — [focus not obscured](/spec/accessibility/focus-not-obscured/) has the sticky-header and cookie-banner checks.
