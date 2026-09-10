---
title: "Sanitizer API (setHTML)"
date: "2026-09-10"
reason: too-early
revisit: "Safari ships `setHTML()`, taking the Sanitizer API to Baseline newly available. At that point the question stops being support and becomes the harder one: whether a sanitiser choice is auditable from outside the site at all, or whether `require-trusted-types-for` is the only externally visible half of this story."
sources:
  - title: "HTML Standard — Element.setHTML() and the Sanitizer API"
    url: "https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-sethtml"
    publisher: "WHATWG"
  - title: "Element: setHTML() method"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML"
    publisher: "MDN"
---

The Sanitizer API gives the platform a built-in HTML sanitiser. `element.setHTML(string)` parses untrusted markup and strips anything that could execute — the job sites have handed to DOMPurify for a decade — with `SanitizerConfig` for sites that need to widen or narrow the default allowlist. It landed in the HTML Standard rather than a separate specification, and is still being refined there: a change in August 2026 added a `javascriptURLs` option, and Chrome only removed `<base>` from configuration allowlists in version 153.

It is not Baseline. Chrome shipped it in 146 (March 2026) and Firefox in 148 (February 2026), but Safari has not shipped it at all, on desktop or on iOS. A page recommending `setHTML()` today would be recommending a method that silently does not exist for a large share of visitors, and the fallback is the library the API is meant to replace — so the practical advice would be "keep DOMPurify", which is what sites already do. This site is its own example: it still vendors DOMPurify.

The reason this is filed as `too-early` rather than `out-of-scope` is worth stating, because the [CSS subgrid](/considered/#css-subgrid) entry looks superficially similar and is not. Subgrid is a way of building a site that no visitor can perceive. XSS is different: whether untrusted markup gets sanitised is a user-facing outcome, not a developer convenience. What is genuinely unclear is whether it is an *auditable* one — you cannot tell from outside a site which sanitiser it used, which is why [Trusted Types](/spec/security/trusted-types/) earns a page and this may not. That question is worth answering when support makes it live, not now.
