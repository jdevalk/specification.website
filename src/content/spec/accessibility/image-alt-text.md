---
title: "Image alt text"
slug: image-alt-text
category: accessibility
summary: "Every <img> element must have an alt attribute. The value describes the image's purpose to screen readers, search engines, and anyone whose image fails to load."
status: required
order: 20
appliesTo: [all]
relatedSlugs: [semantic-html, link-text]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "WCAG 1.1.1 — Non-text Content (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html"
    publisher: "W3C"
  - title: "Accessibility Checker — Image Missing Alternative Text"
    url: "https://equalizedigital.com/accessibility-checker/missing-alternative-text/"
    publisher: "Equalize Digital"
  - title: "W3C WAI — Alt Decision Tree"
    url: "https://www.w3.org/WAI/tutorials/images/decision-tree/"
    publisher: "W3C WAI"
---

## What it is

The `alt` attribute on `<img>` provides a text alternative for an image. Screen readers announce it, browsers display it when the image fails to load, and crawlers use it to understand the content. An `alt` is required on every `<img>`; the *value* depends on what the image does on the page.

## Why it matters

Images carry meaning. A product photo, a chart, an icon-only button, a decorative flourish — each plays a different role. Without an alt attribute, a screen-reader user hears the file name, or nothing at all, and loses that meaning. WCAG 1.1.1 is a Level A success criterion, which means failing it puts the page below the minimum bar.

## How to implement

Choose the alt value by asking what the image is doing on this page.

**Informative images** — convey content. Describe what is shown, in the context of the surrounding copy.

```html
<img src="bar-chart.png"
     alt="Sales by quarter: Q1 12k, Q2 18k, Q3 22k, Q4 30k.">
```

**Functional images** — act as a link or button. Describe the action, not the picture.

```html
<a href="/cart"><img src="cart.svg" alt="View basket"></a>
```

**Decorative images** — purely visual, add no information. Use an empty alt so assistive tech skips them.

```html
<img src="swirl.svg" alt="">
```

**Complex images** — charts, maps, infographics. Use a short alt plus a longer description nearby (a caption, a paragraph, or a `<figure>`/`<figcaption>` pair).

Two further rules:

- **Don't say "image of"** or "photo of". The screen reader already announces "graphic".
- **Don't use the file name.** "DSC_0142.jpg" is worse than no alt at all because users can't skip past it cleanly.

## Common mistakes

- Missing `alt` attribute entirely (different from `alt=""`).
- Decorative images with descriptive alts that interrupt the reading flow.
- Functional icon-only buttons with `alt=""`, leaving the button nameless.
- Duplicating the adjacent caption verbatim in the alt.
- Stuffing keywords into alt text for SEO.

## Verification

- Run an automated checker — Equalize Digital and axe both flag missing and suspicious alts.
- Disable images in the browser and read the page top to bottom. Does it still make sense?
- Listen to the page with a screen reader; decorative images should be silent.
