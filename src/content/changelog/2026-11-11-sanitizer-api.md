---
title: "New page: sanitizing untrusted HTML"
date: "2026-11-11"
type: added
relatedSlugs: [sanitizer-api]
---

The spec now has a [sanitizing untrusted HTML page](/spec/security/sanitizer-api/): the native Sanitizer API (`setHTML`, explicit `Sanitizer` configurations) as the mechanism, DOMPurify as the maintained fallback, paired with Trusted Types at the sink. The API shipped in Firefox 148 and Chrome/Edge 146 in early 2026; Safari has not shipped it. From the Modern Web Guidance review.
