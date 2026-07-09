---
title: "DNSSEC"
slug: dnssec
category: security
summary: "DNSSEC cryptographically signs DNS records so resolvers can verify they have not been tampered with. Strong defence in depth, but only with full registrar and registry support."
status: optional
order: 120
appliesTo: [all]
relatedSlugs: [caa-records, https-tls, hsts]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "RFC 4033 — DNS Security Introduction and Requirements"
    url: "https://www.rfc-editor.org/rfc/rfc4033"
    publisher: "IETF"
  - title: "RFC 4035 — Protocol Modifications for the DNS Security Extensions"
    url: "https://www.rfc-editor.org/rfc/rfc4035"
    publisher: "IETF"
  - title: "ICANN — DNSSEC"
    url: "https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-en"
    publisher: "ICANN"
  - title: "Internet Society — Deploying DNSSEC"
    url: "https://www.internetsociety.org/deploy360/dnssec/"
    publisher: "Internet Society"
---

## What it is

DNS Security Extensions add cryptographic signatures to DNS records. A signed zone publishes a public key (`DNSKEY`); each record set is signed (`RRSIG`); the parent zone publishes a hash of your key (`DS`) so a resolver can build a chain of trust from the DNS root down to your domain. Defined originally in RFC 4033 and 4035, with operational guidance in RFC 9364.

A validating resolver that asks for `www.example.com` checks every signature on the way and refuses to return a forged answer.

DNSSEC signs; it does not encrypt. The signatures let a resolver detect a tampered or forged answer, but the query and the answer still travel in clear text, so anyone on the path can still see which names you look up. Confidentiality for DNS is a separate job, done by encrypted transports such as DNS over HTTPS or DNS over TLS. The two solve different problems, authenticity versus privacy, and are often deployed together.

## Why it matters

Plain DNS is unauthenticated. Anyone on the network path — a coffee-shop router, a compromised ISP, a malicious resolver — can lie about which IP your domain points to, where mail should go, or what TXT records exist. That undermines TLS issuance (because Domain Validation depends on DNS or HTTP that depends on DNS), email security (SPF, DKIM, DMARC live in TXT records), and CAA enforcement.

DNSSEC closes the cache-poisoning and on-path spoofing surface for any resolver that validates. It is also a prerequisite for protocols like DANE, which pin TLS keys in DNS.

The honest caveat: DNSSEC is operationally tricky. A misconfiguration — a missing `DS` record after a key rollover, an expired signature — takes your whole domain offline for validating resolvers, which is much worse than the average outage. The benefit is real but only worth taking on with tooling that handles rollovers automatically.

## How to implement

1. **Check support.** Your DNS provider must sign your zone, and your registrar must publish a `DS` record at the parent registry. Most managed DNS providers (Cloudflare, Route 53, Google Cloud DNS, DNSimple) can do both, often with a single toggle. Some legacy registrars cannot.
2. **Enable signing at the DNS provider.** This generates a Key Signing Key (KSK) and a Zone Signing Key (ZSK), publishes `DNSKEY` records, and signs every record set.
3. **Publish the `DS` record at the registrar.** Some providers automate this via CDS/CDNSKEY; otherwise you copy the `DS` from the provider's UI to the registrar's UI.
4. **Verify the chain.** Use `dig +dnssec` or [Verisign DNSSEC Debugger](https://dnssec-analyzer.verisignlabs.com/) to confirm every signature validates and the `DS` at the parent matches.

Example records (truncated):

```
example.com.    3600    IN    DNSKEY    257 3 13 mdsswUyr3DPW132mOi8V9xESWE8j...
example.com.    3600    IN    RRSIG     A 13 2 3600 20260701000000 20260601000000 12345 example.com. ...
com.            86400   IN    DS        12345 13 2 1F987CC6583E92DF0890718C42...
```

Algorithm 13 (ECDSA P-256 with SHA-256) is the recommended modern default; it is small, fast, and widely supported.

Operational hygiene:

- Automate key rollovers (KSK and ZSK). Manual rollovers fail.
- Monitor signature expiry. An expired `RRSIG` is an outage.
- Re-publish `DS` whenever the KSK rotates.
- Pair with [CAA records](/spec/security/caa-records/) for defence in depth around certificate issuance.

## Common mistakes

- **Signing the zone but never publishing the `DS`.** Resolvers ignore the signatures — no protection.
- **Manual key management.** Rollovers will be missed. Use automation.
- **Forgetting to update `DS` after migrating DNS provider.** The chain breaks; the domain disappears.
- **Treating DNSSEC as a replacement for TLS.** It is complementary, not a substitute.

## Verification

- `dig +dnssec example.com` returns `RRSIG` records and the `ad` (authenticated data) flag.
- [DNSViz](https://dnsviz.net/) and the [Verisign DNSSEC Debugger](https://dnssec-analyzer.verisignlabs.com/) both visualise the chain.
- Set up monitoring that alerts before any `RRSIG` expires.
- Test from a validating resolver (Cloudflare `1.1.1.1`, Google `8.8.8.8`). Forged answers should be rejected.
