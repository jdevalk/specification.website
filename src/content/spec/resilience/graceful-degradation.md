---
title: "Graceful degradation when JavaScript fails"
slug: graceful-degradation
category: resilience
summary: "Core content and primary navigation should keep working when JavaScript fails to load or throws — treat client-side scripts as an enhancement, not the delivery mechanism."
status: recommended
order: 25
appliesTo: [all]
relatedSlugs: [offline-support, server-side-rendering, error-pages, empty-links-buttons]
updated: "2026-06-08T20:15:00.000Z"
sources:
  - title: "WHATWG HTML Standard — The noscript element"
    url: "https://html.spec.whatwg.org/multipage/scripting.html#the-noscript-element"
    publisher: "WHATWG"
  - title: "MDN — Progressive enhancement"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement"
    publisher: "MDN"
  - title: "MDN — Graceful degradation"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation"
    publisher: "MDN"
  - title: "MDN — <noscript>"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/noscript"
    publisher: "MDN"
---

## What it is

Graceful degradation means the page's core content and primary navigation keep working when JavaScript fails — not only when it is switched off, but when a script times out, a CDN returns a 404 for the bundle, an exception throws halfway through execution, or an extension blocks it. The baseline is delivered in HTML and CSS; JavaScript is layered on top, and its failure costs a single feature, not the whole page.

This is the runtime companion to [server-side rendering](/spec/seo/server-side-rendering/). SSR asks whether the content is in the server's response at all; graceful degradation asks whether the page still works after that response arrives but the scripts do not.

## Why it matters

Script delivery fails more often than people assume — a dropped packet on a flaky mobile connection, a request that raced a deploy, a corporate proxy, an ad blocker with an over-broad rule. A page that only renders its article body, opens its menu, or submits its forms after JavaScript runs turns every one of those failures into a blank screen. The content was already in the HTML; one failed request hid it.

The cost also lands on the long tail of non-rendering clients — feed readers, link-preview scrapers, and many AI crawlers — for which "JavaScript required" is indistinguishable from "broken".

## How to implement

- Deliver core content and navigation in the initial HTML. Use real `<a href>` links and real `<form action>` so both function before any script runs.
- Treat client behaviour as enhancement: attach it to markup that already works, and feature-detect before using it.
- Never gate visible content behind a successful `fetch`. If a script reveals or hydrates content, ensure that content is present and readable without it.
- Use `<noscript>` as a backstop for the no-JavaScript path — but remember it does **not** fire when JavaScript loads and then errors, so it cannot be the whole strategy.
- Keep menus, accordions, and dialogs operable with native elements (`<details>`, `<dialog>`) or CSS where you can.

This site is a worked example: every spec page, the checklist, and all navigation render and work with JavaScript fully disabled. Only the ⌘K search overlay needs JavaScript, and the same search is reachable as a plain page at `/search/`.

## Common mistakes

- Rendering the whole page into an empty `<div id="root">`, so a script failure yields a white screen.
- Links and buttons built from `<div>`s wired up by JavaScript — dead if the script never runs (see [empty links and buttons](/spec/accessibility/empty-links-buttons/)).
- Relying on `<noscript>` alone, which does nothing when a script loads but then throws.
- Hiding content with CSS and revealing it with JavaScript, leaving it permanently hidden after an error.

## Verification

- Disable JavaScript in DevTools and reload: core content and primary navigation must still be present and usable.
- In DevTools → Network, block the JS bundle's URL and reload — the page should still work.
- Throttle to slow 3G and read the page before scripts finish; it should be legible mid-load.
- `curl https://example.com/` and confirm the main content is in the returned HTML, not just a `<script>` tag.
