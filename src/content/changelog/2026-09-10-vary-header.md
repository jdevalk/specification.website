---
title: "Added a page on the Vary header"
date: "2026-09-10"
type: added
relatedSlugs: [vary, cache-control, compression, markdown-source-endpoints]
---

`Vary` was mentioned in passing on half a dozen pages but never had one of its own, so it now gets [a page in performance](/spec/performance/vary/). It covers the part people get wrong — `Vary` extends the cache key rather than governing freshness — and the two opposite failures: negotiating on a header you did not list, and listing so many that the cache stops matching anything.
