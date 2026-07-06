---
title: "CSS subgrid"
slug: subgrid
category: foundations
summary: "Let a nested grid inherit its parent's track sizes with grid-template-columns: subgrid (or rows), so cards, form rows, and list items line up across the whole layout without magic numbers or JavaScript measurement."
status: recommended
order: 145
appliesTo: [all]
relatedSlugs: [container-queries, anchor-positioning]
updated: "2026-07-06T00:00:00.000Z"
sources:
  - title: "CSS Grid Layout Module Level 2 — Subgrids"
    url: "https://drafts.csswg.org/css-grid-2/#subgrids"
    publisher: "W3C CSS Working Group"
  - title: "MDN — Subgrid"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid"
    publisher: "MDN"
  - title: "MDN — grid-template-columns (subgrid value)"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-columns"
    publisher: "MDN"
---

## What it is

By default a nested grid is independent of its parent: making a grid item `display: grid` creates a brand-new set of tracks that know nothing about the outer grid. `subgrid` changes that. Set `grid-template-columns: subgrid`, `grid-template-rows: subgrid`, or both, and the nested grid adopts the parent's tracks across the area it spans instead of defining its own.

```css
.card-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.card {
  display: grid;
  grid-row: span 3; /* image, title, footer */
  grid-template-rows: subgrid;
}
```

Gaps and named grid lines pass down from the parent; the subgrid can override the gap or add its own line names on top. Line numbering restarts inside the subgrid, so a component placed anywhere on the outer grid always uses the same internal coordinates.

## Why it matters

The problem subgrid solves is alignment across sibling components. Three cards in a row each have a heading, a variable-length body, and a footer. Without subgrid, each card sizes its own rows, so the footers sit at different heights and the headings wrap out of step. The old fixes were bad: hard-coded `min-height` magic numbers that break when content changes, or JavaScript that measures every card and equalises them on resize.

Subgrid makes the cards share the parent's row tracks, so every heading, body, and footer lines up on a common baseline — resolved natively by the browser, reflowing correctly when content or viewport changes. The same applies to label/field alignment in forms and to any repeating structure that should read as a table without being one.

## How to implement

Give the parent explicit tracks, span the child across the tracks it should share, then set `subgrid` on the axis you want tied. Treat it as progressive enhancement: an unsupported browser ignores the value and falls back to a normal nested grid, which stays usable. No `@supports` gate is needed, though you can add one if the fallback needs different rules.

Remember that a subgridded axis has **no implicit tracks** — auto-placed items overflow into the last track rather than creating new ones, so define enough span or leave that axis as a normal grid.

## Common mistakes

- **Nesting without spanning.** A subgrid only borrows the tracks it spans; a single-cell child has nothing to inherit.
- **Expecting implicit rows.** In a `grid-template-rows: subgrid` element, extra items pile into the final track. Use `grid-auto-rows` on a normal axis when the count is unknown.
- **Forgetting gaps are inherited.** The child's spacing follows the parent unless you set `gap` on the subgrid explicitly.

## Verification

- Use the DevTools grid inspector (Chrome and Firefox both badge subgrids) to confirm the child's lines coincide with the parent's.
- Give sibling cards uneven content and check headings and footers still align.
- Baseline: subgrid has been Widely available across Chrome, Edge, Firefox, and Safari since September 2023 — safe to use without a fallback for most audiences.
