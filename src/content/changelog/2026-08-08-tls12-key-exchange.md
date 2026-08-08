---
title: TLS 1.2 lost most of its key exchange methods
date: "2026-08-08"
type: changed
relatedSlugs: [https-tls]
---

RFC 10015, published in July 2026, makes RSA key exchange and finite-field Diffie-Hellman a `MUST NOT` in TLS 1.2 — including ephemeral `DHE`, which is forward-secret and was widely assumed to be safe on that basis. [HTTPS and TLS](/spec/security/https-tls/) now asks for ECDHE specifically rather than "forward-secret suites", and says why the two are no longer the same instruction.
