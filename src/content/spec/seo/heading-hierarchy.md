---
title: "Heading hierarchy"
slug: heading-hierarchy
category: seo
summary: "Headings describe the sections of a page. They must form a nested outline, never be used for visual styling alone, and never skip levels."
status: required
order: 80
appliesTo: [all]
relatedSlugs: [internal-linking, breadcrumbs, structured-data]
updated: "2026-07-01T00:00:00.000Z"
sources:
  - title: "HTML Living Standard — Headings and sections"
    url: "https://html.spec.whatwg.org/multipage/sections.html#headings-and-sections"
    publisher: "WHATWG"
  - title: "WCAG — Headings and Labels (2.4.6)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html"
    publisher: "W3C"
  - title: "Section Headings — ARIA Authoring Practices"
    url: "https://www.w3.org/WAI/tutorials/page-structure/headings/"
    publisher: "W3C WAI"
  - title: "MDN — Heading elements"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements"
    publisher: "MDN"
---

## What it is

HTML defines six heading levels, `<h1>` through `<h6>`. They are the spine of a document's outline. Screen readers expose them as a navigable list, search engines weight them when working out what a page is about, and AI agents use them to chunk content.

```html
<h1>HSTS</h1>
<h2>What it is</h2>
<h2>Why it matters</h2>
<h3>For users on public Wi-Fi</h3>
<h2>How to implement</h2>
```

## Why it matters

Headings are the only structural signal that is consistent across browsers, screen readers, search engines, and AI tools. Get them right and the page becomes:

- **Navigable** for users of assistive technology, who jump heading-by-heading instead of scrolling.
- **Indexable** in chunks, so search engines and AI agents can quote a section without needing the whole page.
- **Maintainable**, because the outline matches the writing.

WCAG 2.4.6 (Level AA) requires headings and labels to describe the topic or purpose. Skipping levels or using a heading for its visual weight is a direct failure.

## How to implement

The rules are simple and rarely controversial:

- **One `<h1>` per page.** HTML5 once described a document-outline algorithm in which each nested sectioning element (`<section>`, `<article>`) reset the heading scope, so `<h1>` could be reused everywhere. No browser or screen reader ever implemented it, nesting multiple `<h1>`s that way is now non-conforming, and the browser default that shrank a sectioned `<h1>` was removed from the spec in 2025. Use a single `<h1>` that matches the page title.
- **Do not skip levels.** Go `h1 → h2 → h3`, never `h1 → h3`. Levels can decrease by any amount on the way back up (`h3 → h2` is fine).
- **Headings describe sections, not styling.** If you want bigger text, use CSS. Never pick a heading level for its font size.
- **No heading without a section under it.** Every heading should have content. An `<h2>` followed immediately by another `<h2>` with nothing between them is a smell.
- **Keep headings short.** They are anchors, not paragraphs. Aim for under 70 characters.
- **Distinguish sibling headings.** The same heading text under different parent sections ("Overview", "Examples") is fine, because the rotor shows each nested under its parent. Two headings with identical text in the same branch are the confusing case; disambiguate those.
- **A title and its subtitle are one heading, not two.** Marking up a strapline as a second heading (`<h1>` followed by an `<h2>` tagline) adds a phantom level to the outline. Wrap the single `<h1>`–`<h6>` and one or more `<p>` subtitles in `<hgroup>`, which groups them without contributing a heading of its own.
- **Visual headings need real heading tags.** A `<div class="heading">` is invisible to assistive tech. A `<p>` styled to look like an `<h2>` is invisible to search engines.

For component-driven design systems, expose the heading level as a prop (`<Heading level={2}>...</Heading>`) so the same component can render at the right level for its context.

## Common mistakes

- Using an `<h1>` per section because a designer wanted "big titles everywhere".
- Wrapping the site logo in `<h1>` on every page, so every page has the same H1.
- Skipping levels to get a smaller default size (use CSS).
- Hiding headings visually but leaving them in the DOM as the only outline — fine if intentional, broken if it becomes a maintenance burden.
- Putting interactive elements inside headings (buttons, dropdowns). Keep headings text-only.

## Verification

- Use the browser dev tools accessibility panel to view the heading outline.
- Run an automated check (axe, Lighthouse, WAVE). Skipped levels and empty headings are flagged immediately.
- Tab through the page with a screen reader's heading shortcut (`H` in NVDA, `VO+Cmd+H` in VoiceOver). Does the outline read like a table of contents?
