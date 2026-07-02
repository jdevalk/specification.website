---
title: SRI page now covers the Integrity-Policy header
date: "2026-07-02"
type: changed
relatedSlugs: [subresource-integrity]
---

Expanded the [Subresource Integrity](/spec/security/subresource-integrity/) page with the `Integrity-Policy` and `Integrity-Policy-Report-Only` response headers, which enforce integrity metadata site-wide so a script added without a hash fails loudly instead of loading unverified. Defined in the W3C SRI Level 2 draft and now interoperable across Chromium, Firefox, and Safari, with violations delivered through the Reporting API.
