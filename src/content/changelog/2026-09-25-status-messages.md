---
title: "Added a page on status messages"
date: "2026-09-25"
type: added
relatedSlugs: [status-messages, form-errors, aria-usage]
---

WCAG 4.1.3 asks that outcomes reported without moving focus — a result count, a saved confirmation, upload progress — reach assistive technology too, and the spec only covered that inside form errors. [Status messages](/spec/accessibility/status-messages/) now has a page of its own, covering live regions and `ariaNotify()`, newly available in Baseline, and leading with the mistake that breaks most live regions: inserting the region and its text in the same operation announces nothing.
