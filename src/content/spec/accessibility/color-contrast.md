---
title: "Colour contrast"
slug: color-contrast
category: accessibility
summary: "Text and meaningful non-text elements must have enough contrast against their background so people with low vision and people in harsh light can read them."
status: required
order: 10
appliesTo: [all]
relatedSlugs: [focus-indicators, semantic-html]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "WCAG 2.4.3 — Contrast (Minimum) (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
    publisher: "W3C"
  - title: "WCAG 1.4.6 — Contrast (Enhanced) (Level AAA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html"
    publisher: "W3C"
  - title: "WCAG 1.4.11 — Non-text Contrast (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
    publisher: "W3C"
  - title: "Accessibility Checker — Low Contrast"
    url: "https://equalizedigital.com/accessibility-checker/insufficient-color-contrast/"
    publisher: "Equalize Digital"
---

## What it is

Contrast is the difference in luminance between the foreground (text, icons, control borders) and the background behind them. WCAG defines minimum ratios that pages must meet so that text remains legible for users with low vision, age-related sight loss, or colour vision deficiencies, and for everyone reading on a glare-filled screen.

## Why it matters

Low contrast is consistently the single most common automated accessibility failure on the web. It locks out users with low vision, makes content unreadable in bright sunlight, and degrades comprehension even for users with average vision. Meeting the contrast minimum is the cheapest, highest-impact accessibility fix you can make to a site.

## How to implement

WCAG 2.2 sets three thresholds you should know:

- **1.4.3 Contrast (Minimum) — AA.** Body text needs at least **4.5:1**. Large text (18pt, or 14pt bold) needs **3:1**.
- **1.4.6 Contrast (Enhanced) — AAA.** Body text **7:1**, large text **4.5:1**.
- **1.4.11 Non-text Contrast — AA.** Meaningful UI components (input borders, focus rings, icon-only buttons) and graphics needed to understand the content need at least **3:1** against adjacent colours.

Pick colour pairs from a palette that has been checked against these ratios. Use design tokens, not one-off hex values, so a single fix propagates.

```css
:root {
  --text: #1a1a1a;       /* 16.1:1 on white — comfortable */
  --text-muted: #595959; /* 7.0:1 on white — passes AAA */
  --link: #0b5fff;       /* 6.4:1 on white */
}
```

APCA (the contrast algorithm being prototyped for WCAG 3) gives a more perceptually accurate score, especially for dark mode. Treat it as a useful second opinion, not a replacement — conformance today is still measured against WCAG 2 ratios.

## Common mistakes

- Light grey body text on white ("#aaa on #fff" is 2.3:1 — a clear fail).
- Placeholder text used as the only label, set in a low-contrast grey.
- Brand-coloured buttons where the label sits below 4.5:1 on the button fill.
- Disabled states styled so low that sighted keyboard users cannot see which control has focus.
- Text laid over a busy image with no scrim or solid block behind it.

## Verification

- Run an automated checker (axe DevTools, WAVE, Lighthouse, Equalize Digital) on every template.
- Spot-check the reported failures by hand — automation can miss text on gradients or images.
- Test the page in greyscale and in a high-glare environment.
