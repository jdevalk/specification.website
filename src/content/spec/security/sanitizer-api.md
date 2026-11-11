---
title: "Sanitizing untrusted HTML"
slug: sanitizer-api
category: security
summary: "Any HTML you did not author must be sanitized before it reaches the DOM: with the native Sanitizer API (setHTML and explicit Sanitizer configurations) where available, and a maintained library such as DOMPurify everywhere else."
status: recommended
order: 93
appliesTo: [all]
relatedSlugs: [trusted-types, content-security-policy, subresource-integrity]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "HTML Sanitizer API"
    url: "https://wicg.github.io/sanitizer-api/"
    publisher: "WICG"
  - title: "MDN — HTML Sanitizer API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API"
    publisher: "MDN"
  - title: "OWASP — Cross Site Scripting Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
    publisher: "OWASP"
---

## What it is

Sanitization is the step between receiving HTML you do not control — a comment, a CMS field, Markdown rendered to HTML, a federated post — and inserting it into the page: parse it, remove everything that can execute or navigate somewhere hostile (scripts, event-handler attributes, `javascript:` URLs, dangerous elements and attributes), and insert only the inert remainder. The Sanitizer API makes this a platform primitive: `element.setHTML(string)` parses and sanitizes in one step against a default configuration, and a `Sanitizer` object with explicit element and attribute allowlists covers cases where the default set is wrong for your content.

The misconception is that escaping and sanitizing are the same defence at different strengths. Escaping treats the input as text: correct for a username, destructive for content that is legitimately HTML — it displays the markup instead of rendering it. Sanitizing treats the input as HTML and makes it safe *as* HTML. Sites that conflate the two oscillate between double-escaped content and an `innerHTML` assignment that "temporarily" skips the sanitiser.

## Why it matters

Cross-site scripting remains the most reliable way to turn a content feature into session theft, and the payload reliably arrives through the field someone forgot was rendered as HTML. [Trusted Types](/spec/security/trusted-types/) closes the sinks — it makes an unsanitized assignment a type error — but something still has to produce the trusted value, and that something is a sanitiser. The two pages are halves of one control: policy at the sink, sanitization at the source.

## How to implement

- **Sanitize at insertion, every time.** Route every untrusted-HTML assignment through one helper that sanitizes; an unsanitized path that exists will eventually be used. With Trusted Types enforced, the helper is the policy: it returns `TrustedHTML` only after sanitizing.
- **Prefer the native API where it exists.** `setHTML()` with the default configuration for standard rich text; a custom `Sanitizer` configuration when your content legitimately needs elements or attributes the default removes (for example `class` for syntax highlighting) — allowlist additions one by one, never a switch to "allow everything except scripts". The API shipped in Firefox 148 and Chrome/Edge 146 in early 2026; Safari has not shipped it, so the library path below is not legacy support, it is current support.
- **Fall back to a maintained library.** DOMPurify is the reference fallback: actively maintained, fast, and its default profile tracks the same threat model. Load it from your own origin with [Subresource Integrity](/spec/security/subresource-integrity/) if it comes from a CDN — a compromised sanitiser is worse than none.
- **Sanitize on the server too when content travels.** Anything stored and later rendered in another client (a native app, an email, an agent's Markdown view) must be sanitized for that context as well; browser-side sanitization protects only your own DOM.
- **Keep the configuration under review.** A sanitiser configuration is a security policy: when it changes, the change deserves the same scrutiny as a CSP change, and the test suite should carry a payload corpus (mutation-XSS cases included) that runs against it.

## Common mistakes

- Assigning untrusted markup with `innerHTML` "just for this one field" — the exception becomes the pattern, and the field becomes the stored-XSS vector.
- Hand-rolled sanitization with regular expressions or a blocklist of tag names. HTML parsing is not a string problem; mutation-XSS payloads exist precisely to defeat string-level filters.
- Allowing `style` attributes or arbitrary `class` values without considering what your own stylesheet makes dangerous (overlay positioning, `content` injection).
- Sanitizing once at input and trusting the stored value forever, while the sanitiser's threat model — and your rendering contexts — move on.
- Forgetting non-DOM sinks: values sanitized for HTML are not automatically safe in `href`, in a JSON-LD block, or in an attribute; context determines the encoding.

## Verification

- Run a standard XSS payload corpus (including mutation-XSS vectors) through every field that renders as HTML; nothing executes, and legitimate formatting survives.
- Inspect the helper's call graph: every `innerHTML`/`insertAdjacentHTML` assignment of non-authored content passes through it, and Trusted Types reports a violation when one does not.
- Test in a browser without the native API and confirm the library fallback produces equivalent output.
- Post content containing elements your configuration intentionally allows (tables, highlighted code) and confirm they render; post one element beyond the allowlist and confirm it is stripped, not rendered, not escaped into view.
