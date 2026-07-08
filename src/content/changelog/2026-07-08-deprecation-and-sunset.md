---
title: Added a page on Deprecation and Sunset headers
date: "2026-07-08"
type: added
relatedSlugs: [deprecation-and-sunset]
---

Added a page on [Deprecation and Sunset](/spec/resilience/deprecation-and-sunset/) (RFC 9745 + RFC 8594), the response headers that announce a resource is going away, when, and where to go next, so clients migrate before it breaks. The site now ships a worked example: the retired `/.well-known/ai.txt` returns `410 Gone` carrying `Deprecation`, `Sunset`, and a `rel="deprecation"` link.
