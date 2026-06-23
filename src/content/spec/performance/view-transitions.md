---
title: "View Transitions"
slug: view-transitions
category: performance
summary: "Animate between states (same-document) or between pages (cross-document) with a single CSS opt-in. Replaces ad-hoc SPA animation libraries with a platform primitive."
status: recommended
order: 105
appliesTo: [all]
relatedSlugs: [speculation-rules, core-web-vitals, critical-css]
updated: "2026-05-29T17:40:31.000Z"
sources:
  - title: "MDN — View Transition API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API"
    publisher: "MDN"
  - title: "CSS View Transitions Module Level 2"
    url: "https://drafts.csswg.org/css-view-transitions-2/"
    publisher: "W3C"
  - title: "Chrome for Developers — Same-document view transitions"
    url: "https://developer.chrome.com/docs/web-platform/view-transitions/"
    publisher: "Google"
  - title: "Chrome for Developers — Cross-document view transitions"
    url: "https://developer.chrome.com/docs/web-platform/view-transitions/cross-document"
    publisher: "Google"
  - title: "WebKit — Cross-document view transitions for every website"
    url: "https://webkit.org/blog/16967/two-lines-of-cross-document-view-transitions-code-you-can-use-on-every-website-today/"
    publisher: "WebKit"
---

## What it is

The View Transitions API animates the change from one DOM state to another — or from one document to the next — by taking a snapshot of the old state, applying the change, taking a snapshot of the new state, and cross-fading between them. There are two flavours.

**Same-document (JS-driven).** A single-page-app pattern. Wrap any DOM mutation in `document.startViewTransition()`:

```js
document.startViewTransition(() => {
  // any DOM update — render new view, swap routes, etc.
  app.navigate(targetUrl);
});
```

**Cross-document (declarative).** Two normal HTML pages opt into a shared transition with a single CSS rule on each:

```css
@view-transition {
  navigation: auto;
}
```

When the user navigates from page A to page B and both pages have this rule, the browser captures A, replaces it with B, and cross-fades. No JavaScript required.

**This site ships it.** [`global.css`](https://github.com/jdevalk/specification.website/blob/main/src/styles/global.css) carries `@view-transition { navigation: auto }`, so cross-document navigations between any two pages on `specification.website` cross-fade on supporting browsers. The matching `prefers-reduced-motion: reduce` rule zeroes `animation-duration` on the view-transition pseudo-elements, so reduced-motion users get an instant swap. Pairs with our [Speculation Rules](/spec/performance/speculation-rules/) prerender — the next page is already in memory, then it animates in.

You shape the animation with the `::view-transition-*` pseudo-elements:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}

/* Tag elements that should animate independently */
.hero {
  view-transition-name: hero;
}
```

## Why it matters

- **Replaces a stack of dependencies.** Framer Motion, GSAP page transitions, hand-rolled FLIP — replaced by a CSS declaration and a pseudo-element.
- **Bridges MPA and SPA UX.** Cross-document view transitions give a traditional multi-page site the feel of an SPA without an SPA's complexity, JavaScript weight, or accessibility regressions.
- **Pairs with [Speculation Rules](/spec/performance/speculation-rules/).** A prerendered next page + a cross-document view transition is the closest the platform gets to "instant, animated" navigation.
- **Respects user preferences.** Browsers honour `prefers-reduced-motion: reduce` and skip the animation. You should still check it explicitly when you customise.

## How to implement

**Cross-document, the minimum:**

```css
@view-transition {
  navigation: auto;
}
```

Ship that on every page you want to participate. The browser handles the rest.

**Same-document, the minimum:**

```js
if (!document.startViewTransition) {
  updateDom();
  return;
}
document.startViewTransition(() => updateDom());
```

Feature-detect — older browsers run the callback synchronously without the transition.

**Tag persistent elements** so they morph instead of cross-fading:

```css
.product-card[data-id="42"] { view-transition-name: product-42; }
```

The same name on both old and new DOM signals "this is the same conceptual element — animate the position/size delta."

**Respect reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

**Keep transitions short** — 150–250ms. Longer feels sluggish; shorter feels like a flash.

## Common mistakes

- Same `view-transition-name` on multiple elements at once. The browser logs an error and skips the morph.
- Animating layout-dependent properties (width, height) when you could animate transforms. Transforms compositor-only, layout properties trigger reflow.
- Long animations on data-heavy navigations. The user is waiting for the page, not for your animation. Cap at ~250ms.
- Ignoring `prefers-reduced-motion`. People with vestibular disorders should not be motion-tested for a route change.
- Same-document transitions that swallow exceptions in the callback. Wrap with try/catch and re-throw on transition rejection.

## Verification

- DevTools → Animations panel. Records every view transition with timing.
- `caniuse.com/view-transitions` — current browser support matrix. Same-document is broadly available; cross-document still rolling out (Chromium first, WebKit shipping, Gecko in progress).
- Toggle `prefers-reduced-motion: reduce` in DevTools → Rendering. The transition must disappear, not just shorten.
- Run a Lighthouse audit on the destination page — adding view transitions must not regress LCP or INP. If it does, your animation is too long or too expensive.
