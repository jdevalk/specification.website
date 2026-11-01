---
title: "Empty links and buttons"
slug: empty-links-buttons
category: accessibility
summary: "A link or button with no accessible name is invisible to screen readers and unreachable for voice control. Icon-only controls without a label are the usual culprit."
status: avoid
order: 100
appliesTo: [all]
relatedSlugs: [link-text, aria-usage, form-labels]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "WCAG 2.4.4 — Link Purpose (In Context) (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html"
    publisher: "W3C"
  - title: "WCAG 4.1.2 — Name, Role, Value (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html"
    publisher: "W3C"
  - title: "Accessibility Checker — Empty Link"
    url: "https://equalizedigital.com/accessibility-checker/empty-link/"
    publisher: "Equalize Digital"
  - title: "Accessibility Checker — Empty Button"
    url: "https://equalizedigital.com/accessibility-checker/empty-button/"
    publisher: "Equalize Digital"
---

## What it is

An empty link or button is one where the accessibility tree records no name. Visually it might be a clear icon — a magnifying glass, a hamburger, an X — but the screen reader announces "link" or "button" with no further information. The user has no idea what it does.

This fails WCAG 2.4.4 (Level A, link purpose) and 4.1.2 (Level A, name role value) at the same time.

## Why it matters

Empty controls are at the top of every accessibility scanner's findings because they are easy to detect and ship in huge numbers. Icon-only buttons and image-only links are the usual sources: a designer placed an SVG inside a `<button>`, nobody added a label, and the control becomes a guessing game.

Voice-control users are hit hardest. Their software lets them say "click search" — but if the search button has no name, there is nothing to say.

## How to implement

Give every link and button an accessible name. Pick whichever fits the design:

**Icon plus visible text** (the easiest case):

```html
<button type="button">
  <svg aria-hidden="true" focusable="false">…</svg>
  Search
</button>
```

**Icon only — use `aria-label`**:

```html
<button type="button" aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">…</svg>
</button>
```

**Image link** — give the `<img>` a useful `alt`:

```html
<a href="/"><img src="logo.svg" alt="Acme home"></a>
```

**Tooltip-only labelling is not enough.** A `title` attribute does not produce a reliable accessible name in every browser and assistive tech combination. Use `aria-label` or visible text instead.

Rules of thumb:

- Mark the SVG inside the button `aria-hidden="true"` and `focusable="false"` so the icon is not double-announced.
- If two controls do the same thing on the page (a top and a footer search), give them the same name.
- Never use a button as a styled wrapper around an empty span — the button has no name and no purpose.

## Common mistakes

- `<button><svg>…</svg></button>` with no label.
- `<a href="/"><img src="logo.svg"></a>` — image link with no alt text. The screen reader reads the URL.
- Empty `<a href="/path"></a>` left behind by a templating bug.
- Icon font glyphs (Font Awesome and similar) used as the only content with no label — the Unicode private-use character is announced as random nonsense.
- A label hidden with `display: none` instead of a visually-hidden utility, removing it from the accessibility tree.

## Verification

- Run an automated checker; "Empty Link" and "Empty Button" are direct, high-confidence findings.
- Inspect each icon-only control in the browser's accessibility panel — the Name field must be populated.
- Tab through the page with a screen reader and confirm every control announces something useful.
