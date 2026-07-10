---
title: "Keyboard navigation"
slug: keyboard-navigation
category: accessibility
summary: "Every interactive element on the page must be reachable and operable with a keyboard alone, in a logical order, with no traps that hold focus."
status: required
order: 40
appliesTo: [all]
relatedSlugs: [focus-indicators, skip-links, semantic-html, inert-attribute, dragging-movements]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "WCAG 2.1.1 — Keyboard (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html"
    publisher: "W3C"
  - title: "WCAG 2.1.2 — No Keyboard Trap (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html"
    publisher: "W3C"
  - title: "WCAG 2.4.3 — Focus Order (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"
    publisher: "W3C"
---

## What it is

Keyboard navigation is the ability to reach and operate every control on a page using only a keyboard — Tab and Shift+Tab to move, Enter and Space to activate, arrow keys inside composite widgets, Escape to dismiss. Many users never touch a mouse: people using switch devices, screen readers, voice control, or just a laptop trackpad they find painful.

## Why it matters

If a control can be clicked but not focused, it does not exist for a large share of disabled users. WCAG 2.1.1 (Level A) requires all functionality to be operable from a keyboard. 2.1.2 (Level A) requires that focus is never trapped — the user must always be able to move on. 2.4.3 (Level A) requires the focus order to preserve meaning and operability.

## How to implement

The cheapest way to get keyboard support right is to use the right HTML element:

```html
<button type="button">Open menu</button>
<a href="/about">About</a>
<input type="checkbox" id="news"><label for="news">Subscribe</label>
```

Native `<button>`, `<a href>`, and form controls are focusable, operable, and announce their role for free. A `<div onclick>` gets none of that.

When you build a custom widget, you must add it back yourself:

- **`tabindex="0"`** to put a non-interactive element into the natural tab order.
- **`tabindex="-1"`** to make an element focusable only by script (useful for moving focus after a dialog opens).
- **Never use positive `tabindex`** — it overrides DOM order and creates surprises.
- **Key handlers** for the keys the role implies (Space and Enter on a button, arrows on a tab list, Escape on a dialog).
- **A visible focus style** so the user can see where they are.

Manage focus on view changes. When a dialog opens, move focus into it and trap it inside until it closes; then return focus to the element that opened it. Single-page navigations should move focus to the main heading of the new view.

## Common mistakes

- Click handlers attached to `<div>` or `<span>` with no role, tabindex, or key handlers.
- Modal dialogs that let Tab leak to the page underneath.
- Custom dropdowns that open on click but cannot be opened or operated from the keyboard.
- Positive `tabindex` values used to "fix" focus order, which then desynchronises with the visual layout.
- Hover-only menus that never receive focus.

## Verification

- Unplug the mouse. Walk through every interactive feature.
- Check that the focus order matches the visual reading order.
- Open every dialog, menu, and dropdown — press Escape and Tab to confirm focus is managed and never trapped.
