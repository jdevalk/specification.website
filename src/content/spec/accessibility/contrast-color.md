---
title: "Automatic contrasting colour"
slug: contrast-color
category: accessibility
summary: "Let the browser pick a legible black or white foreground for a dynamic background with the CSS contrast-color() function, instead of hard-coding colour pairs or computing luminance in JavaScript."
status: optional
order: 12
appliesTo: [all]
relatedSlugs: [color-contrast, color-scheme, forced-colors]
updated: "2026-07-04T00:00:00.000Z"
sources:
  - title: "CSS Color Module Level 5 — contrast-color()"
    url: "https://drafts.csswg.org/css-color-5/#contrast-color"
    publisher: "W3C CSS Working Group"
  - title: "WCAG 1.4.3 — Contrast (Minimum) (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
    publisher: "W3C"
  - title: "MDN — contrast-color()"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color"
    publisher: "MDN"
  - title: "How to have the browser pick a contrasting color in CSS"
    url: "https://webkit.org/blog/16929/contrast-color/"
    publisher: "WebKit"
---

## What it is

`contrast-color()` is a CSS function that takes a `<color>` and returns whichever of `black` or `white` contrasts more strongly with it. You pass it the background (or the text colour) and the browser hands back a legible foreground, so the pairing is never hard-coded.

```css
button {
  background-color: var(--accent);
  color: contrast-color(var(--accent));
}
```

It is defined in CSS Color Module Level 5. The function commonly targets the WCAG AA minimum of 4.5:1, and browsers are free to use a more perceptually accurate algorithm to choose between black and white.

## Why it matters

- **One source of truth for colour.** When a background is dynamic — a user-chosen accent, a brand colour set in a CMS, a value that flips with `prefers-color-scheme` — you cannot know the right foreground ahead of time. `contrast-color()` computes it at render, so text stays readable whatever the background becomes.
- **No JavaScript.** It replaces the familiar helper that parses a colour, computes relative luminance, and picks black or white — one declaration instead of a script that has to run on every theme change.
- **It degrades safely.** This is progressive enhancement: browsers that do not understand it ignore the declaration, so pair it with a sensible fallback rather than relying on it.

## How to implement

Feed the same custom property to both the background and `contrast-color()`, and provide a hand-picked fallback colour first so unsupporting browsers still get legible text:

```css
button {
  background-color: var(--accent);
  color: #fff; /* fallback for older browsers */
}

@supports (color: contrast-color(red)) {
  button {
    color: contrast-color(var(--accent));
  }
}
```

Because the result is only ever black or white, reserve it for backgrounds that are clearly light or clearly dark, where one of the two is a strong match.

## Common mistakes

- **Mid-tone backgrounds.** Against a mid-tone such as a royal blue (`#2277d3`), neither black nor white reliably clears AA for small text. The function still returns one of them; it does not guarantee a readable pair. Keep input colours light or dark, or verify the result.
- **Expecting a brand colour back.** It returns `black` or `white` only — never a tint of your palette.
- **Shipping it with no fallback.** Without a plain `color` declaration first, older browsers fall back to the default text colour, which may be illegible on your background.

## Verification

- Feature-query it: `@supports (color: contrast-color(red))` tells you whether the browser will honour it.
- Inspect the computed `color` in DevTools and confirm the resulting pair meets 4.5:1 against the actual background values you ship, using a contrast checker.
- Toggle dark mode or change the dynamic colour and confirm the text stays legible either way.
- Baseline: `contrast-color()` became newly available across major browsers in April 2026 (Safari 26, Firefox 146, Chrome and Edge 147). Treat it as an enhancement for everyone else.
