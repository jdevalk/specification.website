---
title: A domain can now say it is for sale, in DNS
date: "2026-08-08"
type: added
relatedSlugs: [for-sale-dns, dnssec, caa-records]
---

Added a page on [`_for-sale` DNS records](/spec/foundations/for-sale-dns/), the reserved leaf node name RFC 10023 registered in July 2026. It is `optional` for the obvious reason, but the interesting part is that it is not domain parking: the record sits beside a live site, tells a browser nothing, and answers the one question WHOIS and RDAP cannot — a name being registered has never meant it is unavailable.
