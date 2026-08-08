---
title: The security header a third of the web still sends to nobody
date: "2026-08-08"
type: added
relatedSlugs: [x-xss-protection, content-security-policy, trusted-types]
---

Added a page on [X-XSS-Protection](/spec/security/x-xss-protection/), marked `avoid`. No shipping browser has read the header since Safari dropped it in 15.4, it was never in any standard, and the value hardening guides keep recommending — `1; mode=block` — is the one that could be turned against a safe page. It survives on 29% of the top 100,000 sites because header scanners score it on presence, which is exactly the false comfort the page is there to remove.
