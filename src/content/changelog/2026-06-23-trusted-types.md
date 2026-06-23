---
title: New page on Trusted Types
date: "2026-06-23"
type: added
relatedSlugs: [trusted-types]
---

Added a page on [Trusted Types](/spec/security/trusted-types/) — the browser mechanism that makes DOM injection sinks like `innerHTML` reject plain strings and demand a vetted typed value, switched on with the `require-trusted-types-for` and `trusted-types` CSP directives. It reached Baseline in February 2026 and closes the DOM-based XSS gap that a [nonce-based CSP](/spec/security/content-security-policy/) leaves open.
