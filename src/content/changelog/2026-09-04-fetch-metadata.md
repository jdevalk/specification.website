---
title: "Fetch Metadata request headers"
date: "2026-09-04"
type: added
relatedSlugs: [fetch-metadata]
---

Added a page on [Fetch Metadata request headers](/spec/security/fetch-metadata/) — `Sec-Fetch-Site`, `Sec-Fetch-Mode` and `Sec-Fetch-Dest`, which browsers attach to every request and a server can read to reject cross-site traffic it never meant to serve. It is the rare entry in the security category that you consume rather than emit: setting a response header achieves nothing, and the value only appears once middleware acts on the values. OWASP now names it a primary CSRF defence, so the page is `recommended` rather than optional.
