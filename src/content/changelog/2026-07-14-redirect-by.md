---
title: Added a page on the X-Redirect-By header
date: "2026-07-14"
type: added
relatedSlugs: [redirect-by]
---

Added a page on the [X-Redirect-By header](/spec/resilience/redirect-by/), the response header that names the software behind a redirect so a redirect chain becomes debuggable. The site now ships a worked example: its short-URL aliases (such as `/security.txt`) are served from the edge middleware as 301s carrying `X-Redirect-By: specification.website`, rather than from the `_redirects` file, which cannot set custom headers.
