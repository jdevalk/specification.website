---
title: "Scroll anchoring and overflow-anchor"
date: "2026-09-19"
reason: too-narrow
revisit: "Evidence that opting out is a widespread anti-pattern — `overflow-anchor: none` showing up across real sites, or a measurable divergence between a site's Cumulative Layout Shift and what users experience while scrolling. Either would make this an `avoid` page rather than a missing `recommended` one."
sources:
  - title: "CSS Scroll Anchoring Module Level 1"
    url: "https://www.w3.org/TR/css-scroll-anchoring-1/"
    publisher: "W3C CSS Working Group"
  - title: "overflow-anchor"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-anchor"
    publisher: "MDN"
---

Scroll anchoring is the browser behaviour that stops a page jumping under your thumb. When an image finally decodes, or an advert injects itself, or a late stylesheet reflows a paragraph — and it happens _above_ where you are reading — the browser compensates by adjusting the scroll offset, so the content you were looking at stays put. Chrome has done this since 2017 and Firefox since 2019. Safari 27 shipped it on 14 September 2026, which is the day the feature reached Baseline. Until that day, every iPhone reader got the jumping version of the web no matter what the author did.

That makes it a real, user-facing outcome, and the sort of thing this spec usually covers. It does not get a page because there is nothing for a site to do. The behaviour is on by default, in every engine, with no opt-in. The single authoring control the specification defines — `overflow-anchor` — exists only to switch it **off**, for the narrow cases where a scripted scroller does its own position management and the browser's compensation fights it. A page here would consist of one instruction: do not use this property. That is not a specification of what a good website does; it is a footnote.

The site-side half of the problem is already covered. Content jumping because space was not reserved for it is Cumulative Layout Shift, and reserving that space — `width`/`height` on images, explicit dimensions for embeds and late-loading content — belongs to [Core Web Vitals](/spec/performance/core-web-vitals/), where it already lives. Scroll anchoring is the browser's mitigation for a page that got that wrong; it is not a substitute for getting it right, and it does not help the shift a user sees inside the viewport. The reason to revisit is if the opt-out turns out to be common in the wild, because then the honest page is an `avoid` one about disabling it, not a `recommended` one about enabling something that is already on.
