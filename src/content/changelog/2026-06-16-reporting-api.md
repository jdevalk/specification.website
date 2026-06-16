---
title: Added a page on the Reporting API (Reporting-Endpoints)
date: "2026-06-16"
type: added
relatedSlugs: [reporting-endpoints]
---

New **Security** topic on the [Reporting API](/spec/security/reporting-endpoints/) — the `Reporting-Endpoints` response header that names collectors for the browser's structured reports: CSP and COOP violations, permissions-policy breaches, deprecations, interventions, and crashes. It supersedes the legacy `Report-To` header and `report-uri` directive. The site now ships the header and a collector, closing a ship-it-before-you-spec-it gap; status: recommended.
