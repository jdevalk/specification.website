---
title: "DANE for HTTPS"
slug: dane
category: security
summary: "A TLSA record at _443._tcp pins your HTTPS certificate or key in DNSSEC-signed DNS. No mainstream browser checks it, so for websites it is optional; its real home is SMTP."
status: optional
order: 125
appliesTo: [all]
relatedSlugs: [dnssec, https-tls, caa-records, tls-configuration]
updated: "2026-10-15T00:00:00.000Z"
sources:
  - title: "RFC 6698 — The DNS-Based Authentication of Named Entities (DANE) Transport Layer Security (TLS) Protocol: TLSA"
    url: "https://www.rfc-editor.org/rfc/rfc6698"
    publisher: "IETF"
  - title: "RFC 7671 — The DNS-Based Authentication of Named Entities (DANE) Protocol: Updates and Operational Guidance"
    url: "https://www.rfc-editor.org/rfc/rfc7671"
    publisher: "IETF"
  - title: "RFC 7672 — SMTP Security via Opportunistic DNS-Based Authentication of Named Entities (DANE) Transport Layer Security (TLS)"
    url: "https://www.rfc-editor.org/rfc/rfc7672"
    publisher: "IETF"
---

## What it is

DANE (DNS-Based Authentication of Named Entities, RFC 6698) lets a domain publish, in DNS, which certificate or public key a TLS service should present. The record type is `TLSA`, and it lives at a name built from the port, the transport and the host. For HTTPS on `www.example.com` that is `_443._tcp.www.example.com`:

```
_443._tcp.www.example.com.  3600  IN  TLSA  3 1 1 8f1a...c94e
```

The three numbers say what is being matched. `3 1 1` (DANE-EE, public key, SHA-256) is the usual choice: "the server's own public key hashes to this value", independent of which certificate authority signed it. `2 1 1` (DANE-TA) pins a trust anchor, such as your CA's intermediate, instead.

DANE only means anything on top of [DNSSEC](/spec/security/dnssec/). Without signatures, anyone who can forge a DNS answer can forge the `TLSA` record too, so clients ignore `TLSA` records from unsigned zones.

## Why it matters

For websites, honestly, not much yet. **No mainstream browser validates DANE.** Chrome, Firefox, Safari and Edge all ignore `TLSA` records and trust the certificate authority system alone. Chrome briefly experimented with DNSSEC-authenticated certificates and dropped the idea, citing the latency of extra DNSSEC lookups and the share of networks that break them; no other browser shipped it. Publishing a `TLSA` record for port 443 therefore changes nothing for a visitor today. That is why this page is `optional`, and why tests that score it (Internet.nl does) are measuring readiness rather than a protection any visitor receives.

Where DANE does real work is mail. Mail servers deliver to each other over opportunistic STARTTLS, which an attacker can strip or redirect, and there is no browser-style certificate check to fall back on. DANE for SMTP (RFC 7672) lets a receiving domain tell sending servers "always use TLS, and expect this key", and major mail providers do check it. If you run mail on your domain, that is the place to spend DNSSEC and DANE effort first: see [DANE for SMTP on specification.email](https://specification.email/spec/authentication/dane-for-smtp/).

## How to implement

If you publish a `TLSA` record for HTTPS anyway, for consistency with a mail setup or for clients that do validate:

1. **Sign the zone with DNSSEC** and confirm the chain validates. Without this, stop.
2. **Choose the usage.** `3 1 1` pins your server's public key; it survives certificate renewals as long as the key does not change. `2 1 1` pins the CA's intermediate key and survives renewals with that CA.
3. **Generate the record** from the certificate the server actually serves, with a tool such as `ldns-dane` or `hash-slinger`, or by hashing the SubjectPublicKeyInfo with SHA-256.
4. **Roll keys in two steps** (RFC 7671). Publish the `TLSA` record for the new key alongside the old one, wait at least the record's TTL, then switch the server to the new key, then remove the old record. ACME clients that generate a new key at every renewal break `3 1 1` records unless configured to reuse the key or to publish the new record first.

This site does not ship it for HTTPS: the zone is DNSSEC-signed, but no browser would act on a `_443._tcp` record. For SMTP the `TLSA` records belong to the MX hosts, which here are run by the mail provider, so publishing them is the provider's job.

## Common mistakes

- **A `TLSA` record in an unsigned zone.** Validating clients ignore it; it is decoration.
- **Automated certificate renewal with a fresh key each time** and a `3 1 1` record that never changes. The record stops matching on the next renewal. For mail, where senders do check, that is a delivery outage.
- **Expecting browser protection.** A `TLSA` record does not stop a mis-issued certificate from being accepted by a browser. [CAA records](/spec/security/caa-records/) and Certificate Transparency monitoring are what limit mis-issuance on the web.
- **Publishing `TLSA` for the wrong name.** It belongs at `_443._tcp.` plus the exact host name clients connect to, for each host name.

## Verification

- `dig +dnssec TLSA _443._tcp.www.example.com` returns the record and the `ad` flag from a validating resolver.
- `openssl s_client -connect www.example.com:443 -dane_tlsa_domain www.example.com -dane_tlsa_rrdata "3 1 1 <hash>"` reports a verified DANE match.
- The [Internet.nl website test](https://internet.nl/) includes DANE in its HTTPS section: it checks that a `TLSA` record exists, is DNSSEC-signed, and matches the served certificate.
