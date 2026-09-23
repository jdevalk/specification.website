---
title: "Scroll anchoring and overflow-anchor"
date: "2026-09-23"
reason: too-narrow
revisit: "Evidence that unnecessary use of `overflow-anchor: none` commonly harms readers, or that existing layout-stability guidance misses a widespread scrolling problem. A recommendation would need to distinguish harmful opt-outs from deliberate position management."
sources:
  - title: "CSS Scroll Anchoring Module Level 1"
    url: "https://www.w3.org/TR/css-scroll-anchoring-1/"
    publisher: "W3C CSS Working Group"
  - title: "overflow-anchor"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-anchor"
    publisher: "MDN"
---

Scroll anchoring helps keep the content you are reading in place when content above it changes size. The browser selects an anchor and adjusts the scroll offset when that anchor moves, subject to the specification's suppression rules. Chrome has supported it since 2017 and Firefox since 2019; Safari 27 added support on 14 September 2026. Earlier Safari versions lacked this automatic compensation, but authors could still prevent many shifts by reserving space for images, adverts and embeds.

This does not warrant a standalone spec page because supporting browsers enable it by default, and the general website outcome is already covered by [Core Web Vitals](/spec/performance/core-web-vitals/). The `overflow-anchor` property lets authors exclude a scrolling box or part of its content from anchoring. That can be appropriate when a scripted scroller manages its own position, so a blanket instruction to avoid the property would also be wrong.

Scroll anchoring compensates for some changes in layout; it does not prevent those changes or replace reserving space. Keeping an anchor in place also does not guarantee that every other visible element stays put. We would revisit a separate recommendation if evidence showed that unnecessary opt-outs commonly harm readers, or that existing layout-stability guidance misses a widespread scrolling problem. Any such advice would need to preserve legitimate uses of `overflow-anchor: none`.
