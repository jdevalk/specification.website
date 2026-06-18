---
title: "Redundant entry"
slug: redundant-entry
category: accessibility
summary: "Don't make people re-type information they already gave you in the same process. Auto-populate it, or let them pick it from what they entered a step ago."
status: recommended
order: 116
appliesTo: [all]
relatedSlugs: [form-labels, form-errors, mobile-form-inputs, accessible-authentication]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "WCAG 3.3.7 — Redundant Entry (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html"
    publisher: "W3C"
  - title: "WCAG 2.2 Recommendation"
    url: "https://www.w3.org/TR/WCAG22/#redundant-entry"
    publisher: "W3C"
  - title: "MDN — HTML autocomplete attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete"
    publisher: "MDN"
---

## What it is

**Redundant Entry** is WCAG 2.2 Success Criterion 3.3.7, at **Level A** — the baseline conformance level. The rule is short: when information has already been entered by, or provided to, the user earlier in the **same process**, and that information is asked for again, it must be either **auto-populated** or **available for the user to select** rather than typed out a second time.

Three exceptions are spelled out: re-entry is genuinely **essential** (e.g. a memory test that is the point of the step), the information is **required for security** (re-typing a password to confirm it), or the previously entered information is **no longer valid**.

## Why it matters

A checkout, a multi-step signup, or a booking flow that asks for the same address, name, or email twice forces the user to either remember exactly what they typed two screens ago or scroll back to check. For people with **short-term and working-memory limitations**, that recall is a real barrier — the same cognitive-load problem that [accessible authentication](/spec/accessibility/accessible-authentication/) addresses at the login gate. It also punishes anyone entering text slowly: people with motor impairments, people on small touch keyboards, and people using switch or voice input all pay the re-typing cost twice. Every redundant field is another chance to introduce a mismatch and fail validation.

## How to implement

- **Carry data forward.** Once a value is captured in a process, store it in session state and pre-fill any later field that needs it. "Billing address same as shipping" — checked by default where sensible — is the canonical pattern.
- **Offer a selection, not a blank box.** Where auto-fill isn't appropriate, let the user pick the earlier value from a list or summary instead of re-keying it.
- **Lean on the platform.** Mark fields with the correct [`autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) tokens (`email`, `name`, `street-address`, `postal-code`) so the browser can fill repeated fields itself.
- **Confirm, then reuse.** On review screens, display the captured values back rather than presenting empty inputs to fill again.

## Common mistakes

- A two-step form that asks for an email address on page one and again on page three.
- "Confirm email" fields used for plain data entry (not a security confirmation) with no copy or carry-forward.
- A separate billing-address block with no "same as shipping" option.
- Wiping previously entered fields after a validation error elsewhere on the form.

## Verification

- Walk a multi-step flow end to end and note any value you are asked to type more than once.
- For each repeat, confirm it is auto-populated, selectable, or falls under the essential/security/expired exception.
- Trigger a validation error late in the flow and check that earlier entries survive.
