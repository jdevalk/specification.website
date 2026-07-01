---
title: "Entry and exit animations"
slug: entry-exit-animations
category: foundations
summary: "Animate elements as they appear and disappear — including to and from display: none and the top layer — with @starting-style and transition-behavior: allow-discrete, no JavaScript timers."
status: optional
order: 180
appliesTo: [all]
relatedSlugs: [popover-api, invoker-commands, reduced-motion, view-transitions, scroll-driven-animations]
updated: "2026-07-01T00:00:00.000Z"
sources:
  - title: "CSS Transitions Level 2 — the @starting-style rule and transition-behavior"
    url: "https://drafts.csswg.org/css-transitions-2/"
    publisher: "W3C CSS Working Group"
  - title: "MDN — @starting-style"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style"
    publisher: "MDN"
  - title: "MDN — transition-behavior"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior"
    publisher: "MDN"
  - title: "Now in Baseline: animating entry effects"
    url: "https://web.dev/blog/baseline-entry-animations"
    publisher: "web.dev"
---

## What it is

Two CSS features let an element animate as it appears and disappears — including transitions to and from `display: none` and the browser top layer that [popovers](/spec/foundations/popover-api/) and `<dialog>` render in.

- **`@starting-style`** declares the styles an element starts _from_ the first time it is rendered (or re-added to the top layer). Without a "before" value the browser has nothing to transition out of, so the element simply snaps in.
- **`transition-behavior: allow-discrete`** lets discrete properties such as `display` and `overlay` take part in a transition. The browser defers `display: none` until the animation finishes instead of cutting the element instantly.

```css
[popover] {
  opacity: 0;
  transition:
    opacity 200ms ease,
    display 200ms allow-discrete;
}
[popover]:popover-open {
  opacity: 1;
}
@starting-style {
  [popover]:popover-open {
    opacity: 0;
  }
}
```

## Why it matters

- **No JavaScript timing dance.** Animating an element in from `display: none`, or out before removal, used to require toggling classes across `requestAnimationFrame`, listening for `transitionend`, or `setTimeout` to defer removal. This is all declarative now, and the browser owns the timing — fewer race conditions, no orphaned timers.
- **Exit animations work without script.** The element stays visible for the duration of the transition, then the browser applies `display: none`. Popovers and modal dialogs animate out of the top layer the same way, via the `overlay` property.
- **It composes with the platform.** It pairs directly with the Popover API, `<dialog>`, and [invoker commands](/spec/foundations/invoker-commands/) rather than re-implementing show/hide logic in JavaScript.

## How to implement

Put the transition on the base rule, give the visible state its target values, and put the initial state inside `@starting-style`. Add `allow-discrete` to any `display` or `overlay` transition. Gate the motion behind [`prefers-reduced-motion`](/spec/accessibility/reduced-motion/) so users who ask for less movement get an instant swap.

```css
@media (prefers-reduced-motion: no-preference) {
  .toast {
    transition:
      transform 200ms,
      display 200ms allow-discrete;
  }
  @starting-style {
    .toast.is-open {
      transform: translateY(1rem);
    }
  }
}
```

## Common mistakes

- **Omitting `allow-discrete`.** Without it `display` flips instantly and the element pops in and out with no transition.
- **A `@starting-style` rule that does not match the visible state.** The starting selector must target the same element and state as the open rule, or there is no "before" value to animate from.
- **Animating unconditionally.** Ignoring `prefers-reduced-motion` forces motion on people who have opted out.

## Verification

- Toggle a popover, dialog, or toast: it animates both in _and_ out rather than snapping.
- In DevTools, confirm the element keeps its `display` value until the exit transition ends.
- With `prefers-reduced-motion: reduce` active, transitions are suppressed and the change is instant.
- `@starting-style` and `transition-behavior: allow-discrete` have been Baseline (newly available across major browsers) since 2024 — treat the animation as a progressive enhancement.
