---
title: New page on automatic contrasting colour
date: "2026-07-04"
type: added
relatedSlugs: [contrast-color]
---

Added a page on [automatic contrasting colour](/spec/accessibility/contrast-color/) — the CSS `contrast-color()` function that returns a legible black or white foreground for any background, so a dynamic or user-picked colour keeps readable text without hard-coded colour pairs or luminance maths in JavaScript. Documented as `optional`: it only helps where a background is dynamic or user-picked — a static site with hand-chosen colours never needs it — though it became newly available across major browsers in April 2026 and degrades safely.
