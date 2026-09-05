---
title: "XSL sitemap stylesheets are out"
date: "2026-09-05"
type: changed
relatedSlugs: [xml-sitemaps]
---

[XML sitemaps](/spec/seo/xml-sitemaps/) used to recommend an `<?xml-stylesheet?>` processing instruction so a browser would render the sitemap as a readable table. The HTML Standard now tells authors to avoid client-side XSLT altogether — Chrome stops running it in version 158, and Firefox and WebKit intend to follow — so the page recommends an ordinary HTML index instead, and this site has dropped the processing instruction from its own sitemaps.
