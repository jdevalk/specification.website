---
title: Hybrid post-quantum key agreement is now a TLS 1.3 recommendation
date: "2026-08-12"
type: changed
relatedSlugs: [https-tls]
---

RFC 10024, published in August 2026, puts `X25519MLKEM768` and two NIST-curve siblings on the standards track for TLS 1.3, and notes that the first is already widely deployed. [HTTPS and TLS](/spec/security/https-tls/) now asks for hybrid post-quantum key agreement in its cipher checklist, and separates the two migrations people tend to merge: key agreement protects confidentiality against capture-now-decrypt-later and is a server configuration change, while post-quantum certificates are a later migration on someone else's timeline.
