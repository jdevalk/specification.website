---
title: "Accessible form errors"
slug: form-errors
category: accessibility
summary: "When a form submission fails, errors must be identified in text, associated with the input that caused them, and announced to assistive technology."
status: required
order: 110
appliesTo: [all]
relatedSlugs: [form-labels, aria-usage, color-contrast, mobile-form-inputs, accessible-authentication, redundant-entry]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "WCAG 3.3.1 — Error Identification (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html"
    publisher: "W3C"
  - title: "WCAG 3.3.3 — Error Suggestion (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html"
    publisher: "W3C"
  - title: "WCAG 1.4.1 — Use of Color (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html"
    publisher: "W3C"
  - title: "MDN — ARIA live regions"
    url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions"
    publisher: "MDN"
---

## What it is

An accessible form error tells the user three things, in text and in the accessibility tree: which field is wrong, what is wrong with it, and how to fix it. WCAG 3.3.1 (Level A) requires the field and the problem to be identified. 3.3.3 (Level AA) requires a fix to be suggested when known. 1.4.1 (Level A) forbids using colour as the only indicator.

## Why it matters

A red border alone is invisible to a screen-reader user, to a user with colour vision deficiency, and to a user reading on a sunlit phone. An error summary above the form helps everyone, but only if each error is also wired to its input — otherwise a screen-reader user reading the field on its own hears nothing wrong.

## How to implement

Associate each error message with its input using `aria-describedby` and mark the field invalid:

```html
<label for="email">Email address</label>
<input
  id="email"
  name="email"
  type="email"
  autocomplete="email"
  aria-invalid="true"
  aria-describedby="email-error"
  required>
<p id="email-error" class="error">
  Enter an email address in the format name@example.com.
</p>
```

For an error summary at the top of the form after submission, render it server-side or move focus to it with JavaScript:

```html
<div role="alert" aria-labelledby="error-heading">
  <h2 id="error-heading">There are 2 problems with your submission</h2>
  <ul>
    <li><a href="#email">Email address is not valid</a></li>
    <li><a href="#postcode">Postcode is required</a></li>
  </ul>
</div>
```

Rules:

- **Identify the error in text.** "Email is required" — not just a red border.
- **Tell the user how to fix it.** "Enter a date in the format DD/MM/YYYY", not "Invalid date".
- **Announce dynamically inserted errors.** Use `role="alert"` (assertive) or a live region (`aria-live="polite"`) so screen readers hear the change.
- **Set `aria-invalid="true"`** on the field — and remove it when the user corrects the value.
- **Don't rely on colour alone.** Pair red with an icon, a word ("Error"), or a heavier border.
- **Don't validate every keystroke.** Validate on blur or on submit; constant interruptions are unusable with a screen reader.

## Common mistakes

- Red outline as the only signal.
- Error text that appears in the DOM but is never associated with the input.
- A live region inserted *after* the message, so the message is never announced.
- Server-side errors that move the user back to the top of the page with no focus management.
- Generic messages: "Invalid input".

## Verification

- Submit a form with deliberately bad data using a screen reader. The error must be announced and reachable.
- Tab to each invalid field; the error text must be read along with the label.
- Test in grayscale to confirm the error state is visible without colour.
