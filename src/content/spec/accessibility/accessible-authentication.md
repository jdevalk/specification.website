---
title: "Accessible authentication"
slug: accessible-authentication
category: accessibility
summary: "Let people log in without solving a puzzle, transcribing a code, or memorising anything. Don't block password managers, allow paste, and offer a method that needs no cognitive function test."
status: recommended
order: 115
appliesTo: [all]
relatedSlugs: [form-labels, form-errors, mobile-form-inputs, webauthn, redundant-entry]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "WCAG 3.3.8 — Accessible Authentication (Minimum) (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html"
    publisher: "W3C"
  - title: "WCAG 3.3.9 — Accessible Authentication (Enhanced) (Level AAA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-enhanced.html"
    publisher: "W3C"
  - title: "W3C — Web Authentication (WebAuthn)"
    url: "https://www.w3.org/TR/webauthn-3/"
    publisher: "W3C"
  - title: "MDN — HTML autocomplete attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete"
    publisher: "MDN"
---

## What it is

WCAG 2.2 added two success criteria, both about logging in: **3.3.8 Accessible Authentication (Minimum)**, Level AA, and **3.3.9 (Enhanced)**, Level AAA. The rule is that no step of an authentication process may rely on a **cognitive function test** — remembering a password, solving a puzzle, transcribing characters, or recognising things — unless an accessible alternative is offered. The Minimum criterion exempts object recognition (e.g. "pick the photos with a bus") and personal-content recognition; the Enhanced criterion removes even those exemptions.

This does not outlaw passwords. A password field is fine as long as something other than the user's memory can supply the value: the criterion is satisfied when a mechanism is available to help, such as a password manager filling the field or simply allowing paste. What fails is a step that forces recall or transcription with no such help. So the fix is rarely to abolish passwords; it is to stop blocking the tools that remove the memory burden.

## Why it matters

A login screen is a gate in front of everything. People with cognitive disabilities — memory loss, dyslexia, dyscalculia — are routinely locked out by the very mechanisms meant to keep accounts safe. Asking someone to memorise a password, copy a six-digit code from a text message into a field, or solve a distorted-text CAPTCHA is a cognitive function test, and for a large group of users it simply does not work. Authentication failures don't just frustrate; they exclude people from banking, healthcare, and government services entirely.

## How to implement

The reliable way to pass is to make the browser or device do the remembering:

- **Support password managers.** Use proper `<input type="password">` fields with `autocomplete="current-password"` (or `new-password` when setting one) so managers fill and store credentials. Don't break this with custom widgets.
- **Allow paste** into every field, including password and one-time-code inputs. Blocking paste forces manual transcription — the exact thing the criterion forbids.
- **Let the platform handle OTPs.** Mark the field `autocomplete="one-time-code"` so the OS can offer the SMS code automatically instead of making the user read and retype it.
- **Offer passkeys / WebAuthn.** Biometric or device-bound credentials satisfy the criterion because they require no memorised secret and no test.
- **If you must use a CAPTCHA, don't make it the only gate.** Offer an alternative that isn't a puzzle, or use a non-interactive challenge.
- **Email or magic links** are an accessible fallback — the user clicks, no recall required.

## Common mistakes

- Disabling paste "for security" on password or 2FA fields.
- A reCAPTCHA-style image puzzle with no alternative path.
- "Security questions" that demand recall of obscure facts.
- Custom login fields with no `autocomplete`, so managers can't fill them.
- Asking the user to transcribe a code from an authenticator app with no copy affordance.

## Verification

- Log in using only a password manager — no typing. It should fill and submit.
- Confirm paste works in every credential and OTP field.
- Check each step for a puzzle, memory, or transcription demand; if one exists, confirm an accessible alternative is offered.
