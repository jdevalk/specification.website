---
title: "Semantic HTML and landmarks"
slug: semantic-html
category: accessibility
summary: "Use the right HTML element for the job. Landmarks like <header>, <nav>, <main>, and <footer> let assistive technologies announce structure and skip between regions."
status: required
order: 70
appliesTo: [all]
relatedSlugs: [aria-usage, skip-links, keyboard-navigation]
updated: "2026-07-28T00:00:00.000Z"
sources:
  - title: "WCAG 1.3.1 — Info and Relationships (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html"
    publisher: "W3C"
  - title: "MDN — HTML elements reference"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements"
    publisher: "MDN"
  - title: "W3C WAI — ARIA Landmarks"
    url: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"
    publisher: "W3C WAI"
  - title: "WP Accessibility — Frontend code"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
---

## What it is

Semantic HTML is the practice of using the element whose name matches its meaning — a heading is `<h1>` to `<h6>`, a list is `<ul>` or `<ol>`, a button is `<button>`, a navigation block is `<nav>`. Landmarks are the small set of elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>` with a name, `<form>` with a name, `<search>`) that screen readers expose as a skippable region list.

## Why it matters

Assistive technology builds its model of the page from the tags. A screen-reader user presses a key to jump from heading to heading, from landmark to landmark, from form to form. None of that works on a page made of `<div>` soup. WCAG 1.3.1 (Level A) requires that information, structure, and relationships conveyed visually are also available programmatically — which in practice means using the right element.

## How to implement

A typical page skeleton:

```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>

  <header>
    <a href="/" aria-label="Home">…logo…</a>
    <nav aria-label="Primary">
      <ul><li><a href="/about">About</a></li>…</ul>
    </nav>
  </header>

  <main id="main">
    <article>
      <h1>Page title</h1>
      <p>…</p>
      <h2>Section heading</h2>
      <p>…</p>
    </article>

    <aside aria-labelledby="related">
      <h2 id="related">Related</h2>
      …
    </aside>
  </main>

  <footer>
    <nav aria-label="Footer"><ul>…</ul></nav>
  </footer>
</body>
```

Key rules:

- **Exactly one `<main>` per page.** Two mains break the landmark list.
- **Name every duplicate landmark** with `aria-label` or `aria-labelledby`. A page with two `<nav>` blocks needs each one named ("Primary", "Footer", "In page").
- **Headings form an outline.** Use one `<h1>`, then `<h2>` for sections, `<h3>` for sub-sections. Do not skip levels.
- **Lists are lists.** Wrap navigation items in `<ul>`; screen readers announce "list, six items".
- **ARIA roles only when no semantic equivalent exists.** Prefer `<nav>` over `role="navigation"`.

## Common mistakes

- A whole page of `<div>` and `<span>`, with no landmarks at all.
- Two `<main>` elements, or no `<main>`.
- Multiple unnamed `<nav>` elements — the landmark list shows "navigation, navigation, navigation".
- Headings used for size rather than structure (`<h4>` because "I wanted it smaller").
- A `<button>` that is actually a `<div role="button" onclick>` with no keyboard support.

## Verification

- Open the accessibility tree in the browser devtools and look at the landmark list.
- Use a screen reader's landmark and heading shortcuts to navigate the page.
- Run an automated checker; missing landmarks and skipped heading levels are standard rules.
