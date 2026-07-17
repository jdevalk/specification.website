---
title: A focus ring behind a sticky header is still a failure
date: "2026-07-17"
type: added
relatedSlugs: [focus-not-obscured, focus-indicators, keyboard-navigation]
---

Added a page on [focus not obscured](/spec/accessibility/focus-not-obscured/), WCAG 2.2 Success Criteria 2.4.11 (AA) and 2.4.12 (AAA). Drawing a focus indicator and keeping it visible are separate problems with separate fixes: a perfect high-contrast ring fails the moment Tab scrolls a control under your sticky header, cookie banner, or chat widget, and the remedy is `scroll-padding` on the scroll container rather than anything in your focus styles. [Visible focus indicators](/spec/accessibility/focus-indicators/) now hands the topic off instead of covering it in a sentence.
