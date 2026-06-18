---
title: New page on the Server-Timing header
date: "2026-06-18"
type: added
relatedSlugs: [server-timing]
---

Added a page on [the `Server-Timing` header](/spec/performance/server-timing/), which surfaces backend metrics — database time, cache hits, edge processing — in browser DevTools and to real-user monitoring via the `PerformanceServerTiming` API. The site now ships it as a worked example: every response carries an `edge` timing metric measured in the Cloudflare Pages middleware.
