---
title: '<meta name="text-scale">'
date: "2026-09-16"
reason: too-early
revisit: "A second browser engine shipping compatible behaviour, with practical guidance for testing layouts across the supported text-scaling range. The definition already appears in the 13 September 2026 Working Draft of CSS Fonts 5; publication as a Working Draft is no longer an outstanding condition."
sources:
  - title: "CSS Fonts Module Level 5 — Working Draft, 13 September 2026"
    url: "https://www.w3.org/TR/2026/WD-css-fonts-5-20260913/#text-scale-meta"
    publisher: "W3C CSS Working Group"
  - title: '<meta name="text-scale">'
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/text-scale"
    publisher: "MDN"
---

Operating systems let people enlarge text system-wide, and on mobile browsers that setting has historically had no reliable effect on a web page's root font size. `<meta name="text-scale" content="scale">` is the opt-in that changes this: it makes the root element's initial `font-size` scale in proportion to the OS and browser text-size settings, so a layout written in `rem` and font-size keywords grows with the user's preference — including `@media` breakpoints expressed in `rem`, which then move with the text rather than stranding it. It also turns off the browser's own text-autosizing heuristics, and on desktop it populates `env(preferred-text-scale)`. The default, `legacy`, is what every page gets today.

This fits the subject of the spec: a single element in the `<head>`, checkable from outside, that helps pages respect a visitor's text-size preferences. Its definition appears in the published 13 September 2026 Working Draft of CSS Fonts Level 5 as well as the Editor's Draft. It remains work in progress, but draft status alone does not exclude an implemented feature here. We defer a spec page because browser support is still limited to Chromium-based implementations: Chrome, Edge, Chrome Android and Android WebView from version 146, plus Opera Android from version 97. MDN marks it experimental; Firefox and Safari have not implemented it.

Opting in also requires testing the layout: MDN warns that a page carrying `content="scale"` must support the full scaling range of its target platforms, typically 200% to beyond 300% on mobile. A future spec page should explain relative sizing and that testing obligation alongside the tag, since opting in disables existing browser text-sizing heuristics. Sites can already evaluate it for supported browsers, but we will revisit broader guidance when a second engine ships compatible behaviour. The existing [viewport meta page](/spec/foundations/meta-viewport/) covers preserving pinch zoom, a separate accessibility concern that this tag does not replace.
