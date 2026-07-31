---
title: "CSS state and relational selectors"
slug: css-state-selectors
category: accessibility
summary: "Use `:has()` together with `:user-invalid`, `:user-valid`, `:placeholder-shown` and `:focus-within` to express form and component state in CSS, removing the JavaScript class-toggling pattern and the race conditions it brings."
status: recommended
order: 160
appliesTo: [all]
relatedSlugs: [form-errors, form-labels, focus-indicators, semantic-html]
updated: "2026-07-28T00:00:00.000Z"
sources:
  - title: "W3C Selectors Level 4 — Relational selector `:has()`"
    url: "https://www.w3.org/TR/selectors-4/#relational"
    publisher: "W3C"
  - title: "MDN — `:has()`"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has"
    publisher: "MDN"
  - title: "MDN — `:user-invalid`"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-invalid"
    publisher: "MDN"
  - title: "HTML Living Standard — Constraint validation"
    url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation"
    publisher: "WHATWG"
---

## What it is

Two related primitives let CSS describe state that previously needed JavaScript.

**`:has()`** is the relational pseudo-class. A parent matches based on what it contains, so an ancestor can style itself from a descendant's state. It is the missing "parent selector" that the platform spent two decades without.

**The `:user-*` form-state pseudo-classes** — `:user-invalid` and `:user-valid` — only apply *after* the user has interacted with a field. They sit on top of the HTML constraint-validation model alongside the older `:invalid` / `:valid`, `:required` / `:optional`, `:in-range` / `:out-of-range`, `:placeholder-shown`, `:focus-within`, and `:focus-visible`.

Together they let the stylesheet, not a `classList.toggle()` call, hold the truth about what is focused, filled, valid, or hovered.

## Why it matters

The pattern this replaces is everywhere:

```js
input.addEventListener('input', () => {
  field.classList.toggle('has-error', !input.checkValidity());
  field.classList.toggle('is-empty', input.value === '');
});
```

That code has to exist on every field, runs on every keystroke, races with framework re-renders, and silently drifts out of sync when an attribute changes outside the listener. Moving the same logic into CSS removes the listener, removes the drift, and respects the browser's own constraint-validation timing — which is what assistive technology already listens to.

This page covers the *visual state* layer. Accessible *messaging* — labels, live regions, error summaries, `aria-invalid` — belongs with [accessible form errors](/spec/accessibility/form-errors/) and [form labels](/spec/accessibility/form-labels/). Both layers are needed; neither replaces the other.

## How to implement

**Style a form from its contents with `:has()`.** The submit button dims while any field is invalid; the field row highlights while its input is focused:

```css
form:has(:user-invalid) button[type="submit"] {
  opacity: 0.5;
  pointer-events: none;
}

.field:has(input:focus) label {
  color: var(--accent);
}

.field:has(input:placeholder-shown) label {
  /* float-label pattern, no JS */
  transform: translateY(0.75rem);
}
```

**Prefer `:user-invalid` over `:invalid`.** `:invalid` matches the moment the page loads, so every required-but-empty field renders red before the user has typed a character. `:user-invalid` waits for interaction or submission:

```css
/* Wrong: red on first paint */
input:invalid { border-color: red; }

/* Right: red only after the user has tried */
input:user-invalid { border-color: red; }
input:user-valid   { border-color: green; }
```

Pair the colour with text and an icon — colour alone is not enough (see [form errors](/spec/accessibility/form-errors/)).

## Common mistakes

- Using `:invalid` instead of `:user-invalid`, so a fresh form looks broken before anyone interacts with it.
- Nesting `:has()` selectors so deeply that selector matching regresses on large DOMs. Keep depth shallow and the inner selector specific.
- Forgetting `:has()` can reach siblings via combinators inside the argument — `.field:has(+ .field input:user-invalid)` lets one row react to the next.
- Relying on colour alone for invalid state. Add an icon or text; the visual state must not be the only signal.
- Re-implementing `:focus-within` with JS focus/blur listeners. The pseudo-class already exists and stays in sync.

## Verification

- Reload a form with required fields. Nothing should be red until the user interacts — if it is, you are still using `:invalid`.
- Focus an empty required input and tab away. The field should turn red and the submit button should dim.
- In Chrome DevTools, the Styles pane has "Force element state" with `:user-invalid`, `:focus-within`, and `:placeholder-shown` — use it to verify each rule fires.
- Run a screen reader through the form and confirm the visual state does not stand in for the accessible error message. `aria-invalid` and the announced text still need to be there.
