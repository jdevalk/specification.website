---
title: "Form labels"
slug: form-labels
category: accessibility
summary: "Every form control needs a programmatically associated label. A placeholder is not a label, and an unlabelled input is unusable for screen-reader and voice-control users."
status: required
order: 30
appliesTo: [all]
relatedSlugs: [form-errors, aria-usage, mobile-form-inputs, accessible-authentication, redundant-entry]
updated: "2026-05-29T10:57:27.000Z"
sources:
  - title: "WCAG 3.3.2 — Labels or Instructions (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html"
    publisher: "W3C"
  - title: "WCAG 1.3.1 — Info and Relationships (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html"
    publisher: "W3C"
  - title: "Accessibility Checker — Missing Form Label"
    url: "https://equalizedigital.com/accessibility-checker/empty-missing-form-label/"
    publisher: "Equalize Digital"
  - title: "WP Accessibility — Web Forms"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
---

## What it is

A label is the human-readable name of a form control. It must be associated with the control in the accessibility tree so that assistive technologies announce it, click targets are extended to the label text, and voice-control users can say the field's name to focus it.

## Why it matters

An input without a label is a black box. A screen-reader user hears "edit, blank"; a voice-control user has nothing to say to reach it; a sighted user with a cognitive impairment can lose track of which field they are in when the placeholder disappears on focus. WCAG 3.3.2 (Level A) requires labels or instructions; 1.3.1 (Level A) requires that the relationship between label and field be programmatically determinable.

## How to implement

Prefer a visible `<label>` element associated by `for`/`id`:

```html
<label for="email">Email address</label>
<input type="email" id="email" name="email" autocomplete="email">
```

Wrapping the input inside the label works too:

```html
<label>
  Email address
  <input type="email" name="email" autocomplete="email">
</label>
```

When the visual design genuinely cannot show a label (an icon-only search field, for example), use `aria-label` or `aria-labelledby` — but only as a last resort:

```html
<input type="search" aria-label="Search the site">
```

A few hard rules:

- **Placeholder is not a label.** It disappears on focus, has poor contrast by default, and is invisible to many assistive tools.
- **Every checkbox and radio button** needs its own label, and the group needs a name from `<fieldset>`/`<legend>` or `role="group"` with `aria-labelledby`.
- **Required fields** should say so in the label (or in instructions), not only with an asterisk and colour.
- **Hidden labels** (`.visually-hidden`) are acceptable; `display: none` strips them from the accessibility tree.

## Common mistakes

- `<input placeholder="Email">` with no `<label>`.
- A label that sits next to the input but is not associated with it.
- An icon-only button with no `aria-label`.
- Reusing the same `id` for several inputs, so `for` points at the wrong one.
- A `<legend>` that names the form section but no labels on the individual radio buttons.

## Verification

- Tab through the form with a screen reader. Each control must announce a meaningful name.
- Inspect each input in the browser's accessibility panel — the "Name" must be set.
- Run an automated checker; "Missing Form Label" is a standard rule.
