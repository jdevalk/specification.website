---
title: "Dragging movements"
slug: dragging-movements
category: accessibility
summary: "Anything you can drag must also work with a single pointer that never drags. Sliders, sortable lists, and drag-to-pan maps each need a click or tap alternative."
status: recommended
order: 146
appliesTo: [all]
relatedSlugs:
  [touch-target-size, keyboard-navigation, native-interactive-elements, mobile-form-inputs]
updated: "2026-07-10T00:00:00.000Z"
sources:
  - title: "WCAG 2.5.7 — Dragging Movements (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html"
    publisher: "W3C"
  - title: "WCAG 2.2 Recommendation"
    url: "https://www.w3.org/TR/WCAG22/#dragging-movements"
    publisher: "W3C"
  - title: "WCAG 2.5.1 — Pointer Gestures (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html"
    publisher: "W3C"
  - title: "MDN — Pointer events"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events"
    publisher: "MDN"
---

## What it is

**Dragging Movements** is WCAG 2.2 Success Criterion 2.5.7, at **Level AA**. A dragging movement is any operation where the pointer presses down on one point, moves along a path while held, and releases somewhere else — dragging a slider thumb, reordering a list, panning a map, swiping a carousel.

The criterion says that all functionality using a dragging movement must also be achievable **with a single pointer that never drags**, unless dragging is essential or the behaviour belongs to the user agent rather than to you.

Three exceptions apply. Dragging may be **essential** — a drawing canvas or a signature field is the drag. The functionality may be **determined by the user agent and not modified by the author**, which exempts native scrollbars, touch scrolling, and the scrolling a browser supplies for a CSS `overflow` container. And a **path-based gesture** that traces a specific shape is governed by SC 2.5.1 Pointer Gestures instead.

### It does not ban drag and drop

The wrong belief to correct is that 2.5.7 outlaws dragging. It does not. Dragging is a fine interaction and most people like it. The criterion is purely **additive**: keep the drag, and add a second path to the same outcome that a single tap or click can walk. A sortable list that offers both drag handles and "move up" / "move down" buttons passes. A list that offers only the buttons also passes — but nobody asked you to remove the handles.

The other common confusion is with SC 2.5.1 Pointer Gestures. That criterion is about **multipoint or path-based** gestures — pinch-to-zoom, a two-finger swipe, tracing an L-shape. 2.5.7 is about the humble **single-pointer drag**. A control can fail one and pass the other, so check both.

## Why it matters

A drag is a sustained, precise, path-following press. It asks the user to keep contact while moving accurately, then release at exactly the right place. That combination excludes people who can point but cannot drag:

- Users with tremor, spasticity, or limited dexterity, for whom holding a press steady through a movement is unreliable.
- Users of head-pointers, eye-tracking, or mouth-sticks, where "press and hold while moving" is slow and error-prone.
- Switch-access users, who have no continuous pointer path at all.
- Anyone on a trackpad in a moving vehicle, or operating a touchscreen one-handed.

When the drag is the only route, these visitors are not merely inconvenienced — the feature is unreachable. If reordering your saved items or setting a price filter exists only as a drag, that function does not exist for them.

## How to implement

Start from the platform. `<input type="range">` already ships a non-dragging alternative: click anywhere on the track to jump the thumb there, and use the arrow keys once focused. A custom slider built from `<div>`s and `pointermove` handlers usually ships neither, which is how a passing control becomes a failing one.

Where you own the interaction, pair every drag with a click target:

- **Sliders and range controls.** Allow a click on the track to move the thumb. Add stepper buttons for fine adjustment where the range is wide.
- **Sortable lists.** Give each row "move up" and "move down" buttons, or a "move to…" control that opens a position picker. Keep the drag handle as well.
- **Maps and pannable canvases.** Provide directional arrow buttons and zoom `+` / `−` controls alongside drag-to-pan.
- **Carousels.** Provide previous / next buttons; do not rely on swipe alone.
- **Drop targets.** Offer a click-to-select, then click-to-place flow, or a plain file input beside the drag-and-drop zone.

Make the alternative a real, focusable control — a `<button>` — rather than a click handler bolted onto a `<div>`. That also satisfies [keyboard navigation](/spec/accessibility/keyboard-navigation/), which 2.5.7 does not itself require but which the same users usually need. Note that keyboard support alone does **not** satisfy this criterion: it is about the *pointer*, and a user with a head-pointer and no keyboard still needs a single-pointer route.

Size the alternative controls properly. A "move up" chevron that is 12 px square trades a dragging barrier for a [target-size](/spec/accessibility/touch-target-size/) one.

## Common mistakes

- A custom slider that only responds to `pointerdown` + `pointermove`, ignoring a plain click on the track.
- Drag-only reordering with no per-row move controls.
- A drag-and-drop upload zone with no file input behind it.
- Assuming keyboard operability is enough — the criterion is specifically about single-pointer use.
- Treating pinch-to-zoom as covered here; that is SC 2.5.1.
- Adding "move up" / "move down" buttons that are hidden until hover, so touch users never see them.

## Verification

- For every draggable control, complete the same task using only single clicks or taps — press and release in one spot, never moving while held. If you cannot, it fails.
- Test with the pointer only. Put the keyboard aside; keyboard access does not discharge this criterion.
- Check each alternative control is at least 24×24 CSS px and visible without hover.
- Confirm that anything you treat as exempt is genuinely essential (a drawing surface) or genuinely user-agent-supplied (a native scrollbar), and not simply convenient.
