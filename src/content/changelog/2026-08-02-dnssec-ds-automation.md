---
title: DS automation has a best current practice now
date: "2026-08-02"
type: changed
relatedSlugs: [dnssec]
---

[DNSSEC](/spec/security/dnssec/) now cites RFC 10026, published as BCP 246 in July 2026, and treats `CDS`/`CDNSKEY` automation as the path to prefer rather than an aside. The page also picks up the BCP's least obvious instruction: keep the manual route to the `DS` record open even when automation works, because the moment you most need to change it is the moment a provider stops cooperating.
