---
title: New page on 103 Early Hints
date: "2026-06-29"
type: added
relatedSlugs: [early-hints]
---

Added a page on [103 Early Hints](/spec/performance/early-hints/) — the informational HTTP status code (RFC 8297) that lets a server send `Link: rel=preload`/`rel=preconnect` hints to the browser before the final response is ready, putting server think-time to work. It is documented as `optional`: a useful progressive enhancement over HTTP/2+, but currently acted on only by Chromium engines, so it should never be depended on.
