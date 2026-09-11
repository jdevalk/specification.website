---
title: "Sanitizer API (setHTML)"
date: "2026-09-11"
reason: too-narrow
revisit: "A broader spec page on preventing HTML injection, with verification based on safe handling of untrusted content rather than use of a particular sanitiser. The Sanitizer API could be an implementation example there. Safari support alone would not change the scope decision."
sources:
  - title: "HTML Standard — Element.setHTML() and the Sanitizer API"
    url: "https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-sethtml"
    publisher: "WHATWG"
  - title: "Element: setHTML() method"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML"
    publisher: "MDN"
---

The Sanitizer API gives browsers a built-in way to handle untrusted HTML. `element.setHTML(string)` parses and sanitises markup before inserting it into the DOM, removing script elements, event-handler attributes and other unsafe HTML even when a custom configuration allows them. It is part of the HTML Standard and already ships in Chrome 146 and Firefox 148. Safari has not shipped it, so sites using it need feature detection and a suitable fallback for unsupported browsers. That compatibility limit does not make the API too early to discuss.

Preventing untrusted content from executing as script is a website outcome worth specifying. A standalone checklist item requiring `setHTML()` would prescribe one way to achieve it. Sites can handle untrusted HTML safely through other sanitisation implementations, or avoid parsing untrusted content as HTML when only text is needed. The relevant assessment is whether the site's handling of that content prevents injection; finding or failing to find a particular API call does not answer that question.

The API is therefore recorded as `too-narrow` for its own spec page. A broader page on preventing HTML injection could explain when sanitisation is needed, how to verify the outcome, and where this API helps. It should also distinguish sanitisation from [Trusted Types](/spec/security/trusted-types/), which enforces typed values at DOM injection sinks but depends on the policies that produce those values. Neither a policy header nor use of one safe method proves that every injection path is protected. Wider browser support would simplify implementation choices without resolving that scope question.
