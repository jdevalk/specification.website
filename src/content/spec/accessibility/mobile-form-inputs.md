---
title: "Mobile-friendly form inputs"
slug: mobile-form-inputs
category: accessibility
summary: "On a phone, the right input type, inputmode, and enterkeyhint summon the correct on-screen keyboard and a useful Enter key. Keep input text at 16px or larger so iOS Safari doesn't zoom on focus."
status: recommended
order: 150
appliesTo: [all]
relatedSlugs: [form-labels, form-errors, touch-target-size, meta-viewport, accessible-authentication, redundant-entry]
updated: "2026-06-08T00:00:00.000Z"
sources:
  - title: "HTML Living Standard — The inputmode attribute"
    url: "https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute"
    publisher: "WHATWG"
  - title: "HTML Living Standard — The enterkeyhint attribute"
    url: "https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-enterkeyhint-attribute"
    publisher: "WHATWG"
  - title: "MDN — <input>: types"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types"
    publisher: "MDN"
  - title: "MDN — text-size-adjust"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-size-adjust"
    publisher: "MDN"
---

## What it is

On a touch device, every text field summons an on-screen keyboard. Four attributes decide which keyboard appears and how forgiving it is — and one CSS rule decides whether focusing the field yanks the whole page into a zoom.

```html
<input type="email" inputmode="email" enterkeyhint="next"
       autocomplete="email" autocapitalize="none" autocorrect="off">
<input type="tel" inputmode="tel" autocomplete="tel">
<input type="search" inputmode="search" enterkeyhint="search">
```

- **`type`** sets semantics, validation, and the default keyboard (`email`, `tel`, `url`, `number`, `search`, `date`…).
- **`inputmode`** tunes the keyboard layout without changing validation — e.g. `numeric` for a one-time code where `type="number"` would wrongly add a spinner and reject leading zeros.
- **`enterkeyhint`** labels the Enter key: `search`, `go`, `next`, `send`, `done`.
- **`autocapitalize` / `autocorrect` / `spellcheck`** stop the keyboard "fixing" emails, usernames, codes, and search queries.

## Why it matters

The wrong keyboard turns a one-tap entry into a hunt. A phone number on a full QWERTY keyboard makes the user switch to the numeric layer; a `type="email"` field puts `@` and `.` on the primary keyboard automatically. An Enter key that says **Go** or **Search** tells the user the form will submit, instead of leaving them guessing whether Return inserts a newline.

These attributes also help beyond mobile. Correct `type` and `autocomplete` let every platform's password manager and autofill recognise the field, which reduces typos and abandoned forms — a measurable benefit for users with motor or cognitive disabilities, and the reason [form labels](/spec/accessibility/form-labels/) and `autocomplete` tokens matter for WCAG 1.3.5.

**The 16px rule:** iOS Safari automatically zooms in when the user focuses an `<input>`, `<select>`, or `<textarea>` whose font is smaller than 16px, then leaves the page scrolled awkwardly. Set form-control text to at least 16px (`1rem`) and the zoom never fires. Never reach for `maximum-scale=1` to suppress it — that disables pinch-zoom for everyone and fails WCAG 1.4.4 (see [meta viewport](/spec/foundations/meta-viewport/)).

## How to implement

- Pick the most specific `type` first; reach for `inputmode` only to refine the keyboard (`numeric`, `decimal`) when the type is wrong for the data.
- Add `enterkeyhint` where the Enter action isn't obvious.
- Turn off `autocapitalize`/`autocorrect` on emails, usernames, codes, and search.
- Give every control a real [label](/spec/accessibility/form-labels/) and an `autocomplete` token.
- Set input font-size to 16px or larger.

This site ships it: the search box (the ⌘K overlay and `/search/`) carries `inputmode="search"`, `enterkeyhint="search"`, and autocapitalise/autocorrect off, at a font size above 16px so iOS doesn't zoom on focus. (It stays `type="text"` only because the search component already renders its own clear button — `type="search"` would stack a second, native one on top.)

## Common mistakes

- `type="number"` for phone numbers, PINs, or card numbers. It strips leading zeros and adds a spinner. Use `type="tel"` or `inputmode="numeric"`.
- Sub-16px input fonts, then "fixing" the resulting zoom by disabling user scaling.
- Leaving autocapitalisation on for an email field, so the keyboard capitalises the first letter.

## Verification

- Focus each field on a real phone and confirm the keyboard layout and Enter-key label match the data.
- Focus a field on iOS Safari; the page must not zoom. If it does, the font is below 16px.
