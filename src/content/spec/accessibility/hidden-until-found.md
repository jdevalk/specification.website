---
title: "Hidden until found"
slug: hidden-until-found
category: accessibility
summary: "Use hidden=\"until-found\" for collapsible content so that browser find-in-page, assistive tech, and search engines can still reach the text and auto-expand it."
status: recommended
order: 150
appliesTo: [all]
relatedSlugs: [semantic-html, keyboard-navigation, aria-usage, heading-hierarchy]
updated: "2026-05-31T17:50:00.000Z"
sources:
  - title: "HTML Standard — The hidden attribute"
    url: "https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute"
    publisher: "WHATWG"
  - title: "CSS Containment Module Level 2 — Using content-visibility: hidden"
    url: "https://www.w3.org/TR/css-contain-2/#using-cv-hidden"
    publisher: "W3C"
  - title: "MDN — hidden global attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden"
    publisher: "MDN"
  - title: "Chrome for Developers — hidden=until-found and the beforematch event"
    url: "https://developer.chrome.com/articles/hidden-until-found"
    publisher: "Google"
---

## What it is

`hidden="until-found"` is a value of the global `hidden` attribute defined in the HTML Standard. An element marked this way renders as if hidden — it takes up no visible space — but the browser's find-in-page (Ctrl/Cmd+F), the fragment-directive scroll-to-text, and `scrollIntoView()` still walk through it. When a match is found inside, the browser fires a `beforematch` event on the element, removes the `hidden` attribute, and scrolls the match into view.

The browser's user-agent stylesheet applies `content-visibility: hidden` to elements in the until-found state, and the find-in-page algorithm has a specific exception for that state — when a match would land inside the subtree, it walks the element, removes the `hidden` attribute, and scrolls into view. **Applying `content-visibility: hidden` directly in author CSS does not get you the same behaviour.** Per the CSS Containment specification, contents in that state are skipped from rendering *and* are not visible to screen readers, find-in-page, or other tools. The reachability is a property of the HTML attribute, not the CSS property.

## Why it matters

- `display: none` removes content from the accessibility tree and from find-in-page entirely. Accordion or tab patterns that hide panels with `display: none` are invisible to a user who knows the exact phrase they want.
- Find-in-page is a primary accessibility tool. Keyboard users, screen-reader users, users with cognitive disabilities, and anyone skimming a long document rely on it to locate content directly.
- Search engines and AI crawlers vary in how they treat content hidden with `display: none`. `hidden="until-found"` keeps the text in the DOM and reachable, which is the honest signal: this is real content, just collapsed by default.

## How to implement

Mark each collapsed panel and listen for `beforematch` so your widget state stays in sync:

```html
<button aria-expanded="false" aria-controls="panel-1">Shipping</button>
<div id="panel-1" hidden="until-found">
  We ship worldwide within 48 hours…
</div>
```

```js
const panel = document.getElementById('panel-1');
panel.addEventListener('beforematch', () => {
  const button = document.querySelector('[aria-controls="panel-1"]');
  button.setAttribute('aria-expanded', 'true');
  // remove any matching collapsed class on the button or panel
});
```

**Prefer `<details>/<summary>` where you can.** For the everyday "click a heading to expand a panel" pattern, the native disclosure element gives you focus management, keyboard handling, and find-in-page reachability with zero JavaScript. Reach for `hidden="until-found"` when you need a custom widget that `<details>` cannot model — a search-driven FAQ, a complex tab strip, an off-screen mega-menu that must still be findable.

## Common mistakes

- Using `display: none` on accordion panels and then wondering why users cannot find the content they remember reading. Switch the closed state to `hidden="until-found"`.
- Substituting `content-visibility: hidden` in author CSS as a "CSS equivalent" of the attribute. It is not — author-applied `content-visibility: hidden` hides content from find-in-page and screen readers in exactly the way the attribute is meant to avoid.
- Using `hidden="until-found"` for content that should be permanently hidden — error messages, off-screen utility nodes, suppressed admin tools. Use plain `hidden` or `display: none` instead.
- Forgetting to update `aria-expanded` and the visual chevron state in the `beforematch` handler. The panel opens but the button still claims it is collapsed.
- Treating it as a layout primitive. The element still participates in DOM order and document outline — it is hidden, not removed.

## Verification

- Open the page in Chrome or Edge. Press Ctrl/Cmd+F and search for a phrase that lives inside a collapsed panel. The browser should auto-scroll and reveal it.
- Repeat with a panel that uses `display: none`. The search should fail, confirming the regression you are avoiding.
- Tab through the widget with a screen reader (VoiceOver, NVDA, JAWS) and confirm the panel announces correctly once expanded.
- Inspect the element in DevTools after a match — the `hidden` attribute should be gone, the `beforematch` listener should have fired, and `aria-expanded` should read `true`.
