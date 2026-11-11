---
title: "Autofill (autocomplete tokens)"
slug: autofill
category: accessibility
summary: "Give every form field the correct WHATWG autocomplete token, in granular fields with section prefixes, so browsers and password managers can fill sign-in, address, payment, and one-time-code forms accurately."
status: recommended
order: 118
appliesTo: [all]
relatedSlugs: [mobile-form-inputs, form-labels, redundant-entry, accessible-authentication]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "HTML Standard — Autofill"
    url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill"
    publisher: "WHATWG"
  - title: "WCAG 1.3.5 — Identify Input Purpose"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html"
    publisher: "W3C"
  - title: "MDN — The HTML autocomplete attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete"
    publisher: "MDN"
---

## What it is

The `autocomplete` attribute takes a token from a fixed vocabulary in the HTML standard that names *what a field is for*: `username`, `current-password`, `new-password`, `cc-number`, `street-address`, `postal-code`, `one-time-code`, and some sixty more. Browsers, password managers, and platform credential stores read the token — not the label, not the field name, not a heuristic guess — and offer the matching stored value. Tokens compose: a section prefix (`shipping`, `billing`) and a contact-type prefix (`home`, `work`, `mobile`) can scope the same underlying token to one part of a form.

The misconception is that autofill is a browser convenience that happens to your form. It is a contract: WCAG 1.3.5 requires the purpose of common fields to be programmatically determinable precisely so that user agents and assistive technology can present and complete them. A form that omits or mislabels tokens has not opted out of autofill; it has opted into *wrong* autofill, because browsers will still guess from field names and nearby text, and guess badly in every language but the developer's own.

## Why it matters

Forms are where the web transacts, and every field a user must type by hand is friction, error, and abandonment — worst for the users this category exists for: people with motor impairments who cannot type comfortably, people with cognitive disabilities for whom re-entering known data is a barrier (see [redundant entry](/spec/accessibility/redundant-entry/)), and anyone on a phone keyboard. Correct tokens also make credential flows work at all: a sign-in form the password manager cannot recognise is a form users will satisfy with a weak, reused password — or with a passkey, if the field also carries the `webauthn` token (see [passkeys](/spec/security/passkeys/)).

## How to implement

- **One token per purpose, on granular fields.** Split addresses into `street-address` (or `address-line1`/`address-line2`), `address-level2` (city), `postal-code`, and `country`; a single free-form "address" box cannot be filled token-wise and forces the user back to typing.
- **Scope repeated groups with section prefixes.** `shipping street-address` and `billing street-address` in one checkout; the prefix is part of the attribute value, not a naming convention in `name` or `id`.
- **Sign-in and sign-up are different tokens.** `current-password` on sign-in, `new-password` on registration and password change, `username` on the account identifier in both. This distinction is what lets a password manager offer the stored credential in one form and generate a fresh one in the other.
- **Payment fields get card tokens.** `cc-name`, `cc-number`, `cc-exp`, `cc-csc`, one field per value. Never set `autocomplete="off"` on payment or credential fields to "protect" them; you are only protecting the user from their own vault.
- **One-time codes are a token, not a text box.** `autocomplete="one-time-code"` with `inputmode="numeric"` (never `type="number"`, which mangles codes with leading zeroes and invites spinners). Where the platform supports it, origin-bound message formats (`@yourdomain #123456`) let the browser extract the code from the incoming SMS and offer it bound to your origin, which is also the phishing-resistant form.
- **Pair tokens with the right field semantics.** The token complements, never replaces, a correct `type` and `inputmode` (see [mobile-friendly form inputs](/spec/accessibility/mobile-form-inputs/)) and a programmatic [label](/spec/accessibility/form-labels/).
- **Respect `off` only where it belongs.** Genuinely one-off fields with no stored counterpart (a search box, a coupon code) may take `autocomplete="off"`; identity, address, and payment fields may not.

## Common mistakes

- Inventing token-like values (`autocomplete="firstname"`, `"email-address"`). Unknown tokens are ignored; the field silently falls back to heuristics.
- Putting the token in `name` or `id` (`name="cc_number"`) and omitting the attribute. Some managers pattern-match names, which is exactly the unreliable path the attribute exists to replace.
- A single combined field for several purposes — name, street, and city in one box. Autofill fills one purpose per field, so combined fields get partial or mis-split values. A full-name field is not this mistake: `autocomplete="name"` exists precisely for it, and splitting into `given-name` and `family-name` is only needed when the parts are used separately.
- `autocomplete="off"` on the whole form via a framework default or a compliance cargo cult, breaking password managers and address fill at once.
- Styling `:autofill` by changing layout properties, or removing the autofilled-field highlight without a non-colour replacement indicator, so users cannot tell which values the browser supplied.

## Verification

- In a real browser with a saved identity, address, and card, complete the site's sign-in, sign-up, and checkout forms using autofill only; every field should land in the right box.
- Repeat with a password manager's generated-password flow on sign-up and its fill flow on sign-in.
- Trigger a one-time code and confirm the browser offers it from the message without switching apps.
- Inspect each field's token against the HTML vocabulary; any value not in the standard is a bug, not a variant.
