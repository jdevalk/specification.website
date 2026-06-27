---
title: "CSS container queries"
slug: container-queries
category: foundations
summary: "Style a component by the space it is actually given with container-type and @container — responsive design that follows the container, not the viewport — and test a container's own custom properties with style queries."
status: recommended
order: 160
appliesTo: [all]
relatedSlugs: [css-containment, dynamic-viewport-units, anchor-positioning]
updated: "2026-06-27T00:00:00.000Z"
sources:
  - title: "CSS Containment Module Level 3"
    url: "https://drafts.csswg.org/css-contain-3/"
    publisher: "W3C CSS Working Group"
  - title: "CSS Conditional Rules Module Level 5 — style queries"
    url: "https://drafts.csswg.org/css-conditional-5/"
    publisher: "W3C CSS Working Group"
  - title: "MDN — @container"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container"
    publisher: "MDN"
---

## What it is

Container queries let an element respond to the size of an ancestor _container_ rather than the viewport. You mark an element as a query container with `container-type` (optionally naming it with `container-name`), then write `@container` rules that take effect when that container meets a condition.

```css
.card-list {
  container-type: inline-size;
  container-name: cards;
}

@container cards (min-width: 30rem) {
  .card {
    grid-template-columns: 8rem 1fr;
  }
}
```

`container-type: inline-size` is the common choice: it queries the container's inline dimension while leaving block size to flow normally. _Style queries_, the newer half of the feature, test a container's computed custom properties instead of its size:

```css
@container style(--density: compact) {
  .row {
    padding-block: 0.25rem;
  }
}
```

## Why it matters

- **Components, not pages.** A media query only knows the viewport. It cannot tell that the same card sits full-width in one column and narrow in a sidebar elsewhere. Container queries let a component carry its own breakpoints and drop into any layout slot correctly.
- **Reuse without rewrites.** A design-system component styled against its container works unchanged across pages and templates, instead of needing a new viewport breakpoint each time it lands somewhere new.
- **No JavaScript.** `ResizeObserver` hacks that measured an ancestor and toggled classes are now redundant — the browser resolves the query natively each frame.

## How to implement

Set `container-type` on the wrapper you want to query, not on the element you are styling — an element cannot query itself, and the rules inside `@container` apply to that container's descendants. Name containers when you nest them so a query targets the intended ancestor.

Treat it as progressive enhancement: write a sensible single-column default, then enhance at larger container widths. No `@supports` gate is needed — unsupported browsers ignore the `@container` block and keep the default. Prefer `inline-size` unless you genuinely need both axes; `container-type: size` requires the container to have a known block size or its box collapses, exactly as with [`contain: size`](/spec/performance/css-containment/).

## Common mistakes

- **Querying the element you are styling.** The query container must be an ancestor of the styled element.
- **`container-type: size` without a fixed height.** With no known block size the box collapses to zero in the contained axis.
- **Expecting style queries on standard properties.** Style queries currently test custom properties only — you cannot yet query, say, `display` or `color` directly.
- **Forgetting that a query container establishes containment.** It changes how absolutely positioned descendants resolve their containing block; check overlays still anchor where you expect.

## Verification

- Resize a _container_ (drag a sidebar, not the window) and confirm the component reflows at its own breakpoints.
- DevTools marks query containers with a badge and shows which `@container` rules match.
- Baseline: size container queries have been Baseline since February 2023 (and are now widely available); style queries reached Baseline (newly available) in May 2026 — keep the non-queried layout usable where style queries are unsupported.
