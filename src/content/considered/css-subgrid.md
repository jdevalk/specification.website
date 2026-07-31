---
title: "CSS subgrid"
date: "2026-07-06"
reason: out-of-scope
revisit: "Nothing. This is a settled scope decision, kept here because the reasoning generalises to every CSS and JavaScript authoring feature that reaches Baseline."
sources:
  - title: "CSS Grid Layout Module Level 2 — Subgrids"
    url: "https://drafts.csswg.org/css-grid-2/#subgrids"
    publisher: "W3C"
---

A page on subgrid was written and proposed, then closed unmerged. It is worth recording why, because the argument for it was a good one: subgrid has been Baseline widely available since September 2023, the spec already covers container queries and anchor positioning, and cross-component alignment is a real problem.

The reason it did not land is that subgrid is a way of *building* a site rather than something a good site *does*. A layout built with subgrid and the same layout built with flexbox and a few explicit track sizes are indistinguishable to the visitor, the crawler, and the agent. There is no header to check, no element to look for, no behaviour to verify. The benefit is real, but it accrues to the developer.

This is the reference case for every newly-Baseline CSS or JavaScript feature the daily standards scan turns up. Container queries and the Popover API earned pages because each maps to something a visitor experiences — components that adapt to the space they are given; dismissal and focus behaviour users can rely on. Most authoring conveniences do not, however well supported they are.
