---
title: "Accessibility overlays"
slug: accessibility-overlays
category: accessibility
summary: "Third-party JavaScript widgets that claim to make a site WCAG-compliant at runtime. They do not work, often harm screen-reader users, and attract lawsuits."
status: avoid
order: 130
appliesTo: [all]
relatedSlugs: [aria-usage, semantic-html, keyboard-navigation, color-contrast]
updated: "2026-05-29T10:57:27.000Z"
sources:
  - title: "Overlay Fact Sheet"
    url: "https://overlayfactsheet.com/"
    publisher: "Overlay Fact Sheet"
  - title: "WP Accessibility Knowledge Base"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
  - title: "WebAIM — Survey of Web Accessibility Practitioners #3 (overlay findings)"
    url: "https://webaim.org/blog/practitioners-survey-3/"
    publisher: "WebAIM"
  - title: "Equalize Digital — Accessibility Checker documentation"
    url: "https://equalizedigital.com/accessibility-checker/documentation/"
    publisher: "Equalize Digital"
  - title: "EU Web Accessibility Directive"
    url: "https://digital-strategy.ec.europa.eu/en/policies/web-accessibility"
    publisher: "European Commission"
---

## What it is

Accessibility overlays are third-party JavaScript widgets — AccessiBe, UserWay, EqualWeb, AudioEye, and similar — that you paste into a page with a single script tag. They promise to detect accessibility problems and fix them automatically at runtime, usually with a floating button that opens a panel of toggles for font size, contrast, and similar controls.

```html
<!-- The shape of the problem -->
<script src="https://acsbapp.com/apps/app/dist/js/app.js"></script>
```

The marketing claim is that one line of code makes a site WCAG-compliant. It does not.

## Why it matters

Overlays do not fix accessibility. They frequently make it worse:

- They override native semantics with injected ARIA, which confuses screen readers that already understood the original markup.
- They cannot generate meaningful alt text, correct heading order, or sensible link names from nothing — the underlying HTML still has to be right.
- They ship visitor data, including assistive-technology fingerprints, to a third-party server, raising privacy and GDPR concerns.
- They are now a litigation magnet. More than 1,000 ADA web-accessibility lawsuits in the US in 2023 named sites that used an overlay; some named the overlay vendor as a co-defendant.
- Under the EU Web Accessibility Directive and the European Accessibility Act, public-sector bodies and many private services must publish an accessibility statement based on the real state of the site. An overlay does not change that state.

The Overlay Fact Sheet, signed by more than 800 accessibility professionals including most of the field's recognised experts, recommends against them outright. WebAIM's survey of accessibility practitioners found that the large majority who had encountered overlays rated them as unhelpful or actively harmful — a verdict even stronger among respondents with disabilities.

## What to do instead

Fix the underlying site. There is no shortcut, but the work is well-scoped:

- Start with [semantic HTML](/spec/accessibility/semantic-html/) — correct landmarks, headings, lists, buttons, and links.
- Use [ARIA](/spec/accessibility/aria-usage/) only where native HTML cannot express the role, and never to paper over broken markup.
- Make every interactive control reachable and operable with the [keyboard](/spec/accessibility/keyboard-navigation/), with visible [focus indicators](/spec/accessibility/focus-indicators/).
- Meet [colour contrast](/spec/accessibility/color-contrast/) minimums in your design tokens, not in a user-toggled overlay.
- Give every form control a real [label](/spec/accessibility/form-labels/).

Audit with a combination of automated and manual tools: axe DevTools, Lighthouse, WAVE, and the Equalize Digital Accessibility Checker for WordPress sites all catch a useful subset of issues. None of them replace manual testing with a real screen reader (VoiceOver on macOS or iOS, NVDA on Windows) and keyboard-only navigation. Fix issues incrementally and track them like any other defect.

## Common mistakes

- Installing an overlay because a vendor email warned of "ADA risk". The overlay increases that risk.
- Treating an overlay's compliance badge as a legal defence. Courts have repeatedly rejected it.
- Leaving an overlay in place "while we work on the real fixes". It interferes with the audit and with users.
- Disabling browser or OS accessibility settings the user already configured by overriding them in the widget.

## Verification

- Search the page source for known overlay scripts (`acsbapp.com`, `userway.org`, `equalweb.com`, `audioeye.com`). Remove them.
- Run axe DevTools, Lighthouse, and WAVE against representative pages and triage the findings.
- Navigate the site using only the Tab, Shift+Tab, Enter, and arrow keys. Every action must be reachable and visible.
- Test the main user journeys with VoiceOver or NVDA. The page should be usable without the widget.
