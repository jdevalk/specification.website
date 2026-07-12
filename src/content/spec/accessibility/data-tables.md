---
title: "Accessible data tables"
slug: data-tables
category: accessibility
summary: "Tabular data must use real <table> markup with a caption, header cells, and scope attributes so screen readers can announce row and column relationships."
status: required
order: 140
appliesTo: [all]
relatedSlugs: [semantic-html, aria-usage]
updated: "2026-05-29T10:57:27.000Z"
sources:
  - title: "WCAG 2.2 — 1.3.1 Info and Relationships (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html"
    publisher: "W3C"
  - title: "HTML Living Standard — Tabular data"
    url: "https://html.spec.whatwg.org/multipage/tables.html"
    publisher: "WHATWG"
  - title: "MDN — <table>: The Table element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table"
    publisher: "MDN"
  - title: "Web Accessibility Tutorials — Tables"
    url: "https://www.w3.org/WAI/tutorials/tables/"
    publisher: "W3C WAI"
  - title: "WP Accessibility"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
---

## What it is

A data table presents information where each cell only makes sense in the context of its row and its column. The `<table>` element, together with `<caption>`, `<thead>`, `<tbody>`, `<tfoot>` and `<th>`, encodes those relationships so that assistive technology can announce them as the user moves between cells.

## Why it matters

Sighted users scan a table visually — they see the column heading above a number and the row label to its left at the same time. Screen reader users cannot. They rely on the markup to be told, when they land on `£42`, that this is the **Price** column of the **Hardback** row. Without `<th>` and `scope`, that announcement does not happen and the table becomes a grid of disconnected values.

WCAG 1.3.1 Level A requires that information and relationships conveyed visually are also available in the markup. A layout `<table>` or a table built from `<div>`s fails this criterion.

## How to implement

A simple table needs a caption and one row of column headers:

```html
<table>
  <caption>Book prices, May 2026</caption>
  <thead>
    <tr><th scope="col">Format</th><th scope="col">Price</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Hardback</th><td>£42</td></tr>
    <tr><th scope="row">Paperback</th><td>£18</td></tr>
  </tbody>
</table>
```

When headers span groups of rows or columns, use `scope="rowgroup"` and `scope="colgroup"`. When the structure is genuinely complex — multiple levels of headers, headers that don't line up — switch to the `id` and `headers` pattern:

```html
<table>
  <caption>Quarterly revenue by region</caption>
  <thead>
    <tr><td></td><th id="q1" scope="col">Q1</th><th id="q2" scope="col">Q2</th></tr>
  </thead>
  <tbody>
    <tr><th id="eu" scope="row">EU</th>
        <td headers="eu q1">€1.2m</td><td headers="eu q2">€1.4m</td></tr>
  </tbody>
</table>
```

For long extra context that won't fit in the caption, use `aria-describedby` pointing to a paragraph nearby.

Wide tables on narrow screens should scroll horizontally as a focusable region, so keyboard users can reach the off-screen columns:

```html
<div role="region" aria-label="Quarterly revenue" tabindex="0" style="overflow-x:auto">
  <table>…</table>
</div>
```

## Common mistakes

- Using `<table>` for page layout or for form field alignment. Use CSS Grid or Flexbox instead.
- `<td>` cells with bold text standing in for headers, with no `<th>`.
- A header row with no `scope` attribute — ambiguous for nested tables and complex headers.
- Hiding the caption with `display: none`; it is then also removed from the accessibility tree. Use a visually hidden class if you must.
- Setting `overflow-x: auto` on a `<div>` with no `tabindex` — mouse users can scroll, keyboard users cannot.

## Verification

- Tab through the table with a screen reader (VoiceOver, NVDA). Each data cell should be announced with its row and column header.
- Check the accessibility tree in DevTools. Headers should appear as `columnheader` or `rowheader`, not `cell`.
- Run an automated checker (axe, Lighthouse). It will flag missing `<th>`, missing `scope`, and layout tables.
- Disable CSS. The table should still read top-to-bottom in a sensible order.
