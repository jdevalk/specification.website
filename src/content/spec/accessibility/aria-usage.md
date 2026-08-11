---
title: "ARIA — first rule of ARIA"
slug: aria-usage
category: accessibility
summary: "ARIA can make custom widgets accessible, but the first rule of ARIA is don't use ARIA. Reach for a native HTML element first; add ARIA only when nothing native fits."
status: recommended
order: 80
appliesTo: [all]
relatedSlugs: [semantic-html, form-labels, keyboard-navigation]
updated: "2026-07-31T00:00:00.000Z"
sources:
  - title: "ARIA in HTML (W3C Recommendation, 11 August 2026)"
    url: "https://www.w3.org/TR/html-aria/"
    publisher: "W3C"
  - title: "ARIA Authoring Practices Guide — Read Me First"
    url: "https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/"
    publisher: "W3C WAI"
  - title: "MDN — ARIA"
    url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA"
    publisher: "MDN"
  - title: "WCAG 4.1.2 — Name, Role, Value (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html"
    publisher: "W3C"
---

## What it is

ARIA — Accessible Rich Internet Applications — is a set of HTML attributes (`role`, and the many `aria-*` attributes) that tell assistive technologies what a custom element is, what state it is in, and how it relates to other elements. ARIA never changes how something looks or behaves; it only affects the accessibility tree.

## Why it matters

ARIA is a sharp tool. Used well, it lets you describe widgets the HTML spec does not cover. Used badly, it overrides the real semantics of an element and makes the page *less* accessible than the unstyled HTML would have been. The W3C's four rules of ARIA lead with the most important one: reach for native HTML first.

Which roles and attributes are actually *allowed* on a given element is not a matter of taste either. [ARIA in HTML](https://www.w3.org/TR/html-aria/) became a W3C Recommendation in April 2026 and specifies it element by element. The answers are not always the intuitive ones: `role="button"` on an `<a href>` is permitted, while `<textarea>` accepts no role other than the `textbox` it already has, and `<input type="hidden">` accepts no `role` or `aria-*` attribute at all.

## How to implement

The four rules of ARIA, in plain English:

1. **Don't use ARIA if a native HTML element will do.** `<button>`, `<a href>`, `<input type="checkbox">`, `<details>` — these come with role, focus, and keyboard support for free.
2. **Don't change native semantics.** Never write `<h1 role="button">`. If you need a button, use a `<button>`.
3. **All interactive ARIA controls must be keyboard-operable.** A `role="button"` div without Space/Enter handlers is broken.
4. **Don't set `role="presentation"` or `aria-hidden="true"` on focusable elements.** You will hide controls from the very users who need them.

One more requirement sits outside that list but is enforced by WCAG all the same: every interactive element needs an accessible name — a visible label, `aria-label`, or `aria-labelledby`.

Common, useful ARIA attributes:

```html
<!-- An icon-only button needs a name -->
<button aria-label="Close">
  <svg aria-hidden="true" focusable="false">…</svg>
</button>

<!-- Associate a hint with an input -->
<label for="pw">Password</label>
<input id="pw" type="password" aria-describedby="pw-hint">
<p id="pw-hint">At least 12 characters.</p>

<!-- Group of toggle buttons sharing a label -->
<div role="group" aria-labelledby="format">
  <h3 id="format">Text format</h3>
  <button aria-pressed="true">Bold</button>
  <button aria-pressed="false">Italic</button>
</div>
```

- `aria-label` overrides the element's text — use only when there is no visible label.
- `aria-labelledby` points at the id of one or more existing elements; it takes precedence over `aria-label` and `<label>`.
- `aria-describedby` adds a description in addition to the name — for hints, errors, format examples.

## Common mistakes

- `role="button"` on a `<div>` with no `tabindex`, no key handlers, no focus style.
- Redundant roles: `<button role="button">`, `<nav role="navigation">`.
- `aria-label` written for SEO, in language different from the visible text — voice control users cannot say the visible text.
- `aria-hidden="true"` on a wrapper that contains a focusable button.
- ARIA states (`aria-expanded`, `aria-checked`) never updated by JavaScript when the UI changes.

## Verification

- Inspect every custom widget in the accessibility tree; the role, name, and state must match what is on screen.
- Run an automated checker for ARIA misuse.
- Test with a screen reader — the announcement must match how the control behaves.
