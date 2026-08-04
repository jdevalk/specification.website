---
title: AVIF is now the format to encode first, not the one behind the fallback
date: "2026-08-04"
type: changed
relatedSlugs: [image-optimization, core-web-vitals]
---

AVIF reached Baseline widely available on 25 July 2026 — Edge was the last engine to ship it, back in January 2024, and the thirty-month clock has now run out. [Image optimisation](/spec/performance/image-optimization/) no longer treats AVIF as the progressive enhancement layered on top of WebP; the page now says to encode it first, and frames the remaining trade-off as encoding time rather than browser support. The `<picture>` fallback chain stays, because widely available describes the browser versions shipped in the last two and a half years, not the ones people are running.
