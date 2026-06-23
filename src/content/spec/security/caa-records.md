---
title: "DNS CAA records"
slug: caa-records
category: security
summary: "A CAA record tells certificate authorities which of them are allowed to issue certificates for your domain. Cheap to add, blocks a class of mis-issuance attacks."
status: recommended
order: 110
appliesTo: [all]
relatedSlugs: [https-tls, hsts, dnssec]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "RFC 8659 — DNS Certification Authority Authorization (CAA) Resource Record"
    url: "https://www.rfc-editor.org/rfc/rfc8659"
    publisher: "IETF"
  - title: "Let's Encrypt — CAA"
    url: "https://letsencrypt.org/docs/caa/"
    publisher: "Let's Encrypt"
  - title: "RFC 8657 — CAA Record Extensions for Account URI and ACME Method Binding"
    url: "https://www.rfc-editor.org/rfc/rfc8657"
    publisher: "IETF"
---

## What it is

A Certification Authority Authorization record is a DNS record that names the certificate authorities allowed to issue TLS certificates for your domain. Specified in RFC 8659, CAA records are mandatory for CAs to check before issuing a publicly trusted certificate. Any CA that finds a CAA record listing a different issuer must refuse the request.

```
example.com.    300    IN    CAA    0 issue "letsencrypt.org"
example.com.    300    IN    CAA    0 issuewild "letsencrypt.org"
example.com.    300    IN    CAA    0 iodef "mailto:security@example.com"
```

## Why it matters

There are around 50 publicly trusted certificate authorities. Without a CAA record, any of them can issue a certificate for your domain — and historically several have, by mistake or after social engineering. A CAA record narrows that list to the CAs you actually use. If an attacker tricks a different CA into issuing a certificate, that CA's automated checks refuse the request before the certificate is signed.

CAA records do not encrypt or sign anything themselves. They are simply a published policy that compliant CAs must honour.

## How to implement

Add CAA records at the apex of your domain. They cover all subdomains unless overridden.

Common tags:

- **`issue`** — names a CA permitted to issue any certificate. A bare hostname like `letsencrypt.org` is the standard form. `";"` (a single semicolon) explicitly forbids all issuance.
- **`issuewild`** — names a CA permitted to issue wildcard certificates. Set this only if you need wildcards.
- **`iodef`** — an email or URL where CAs report failed checks (Incident Object Description Exchange Format).

Recommended starter set for a site using Let's Encrypt:

```
example.com.    300    IN    CAA    0 issue "letsencrypt.org"
example.com.    300    IN    CAA    0 issuewild ";"
example.com.    300    IN    CAA    0 iodef "mailto:security@example.com"
```

To allow a second CA (for redundancy or a different product):

```
example.com.    300    IN    CAA    0 issue "letsencrypt.org"
example.com.    300    IN    CAA    0 issue "sectigo.com"
```

Some CAs support extra parameters that pin the policy to a specific account or validation method. Let's Encrypt documents the `accounturi` and `validationmethods` extensions, which let you lock issuance to a specific ACME account.

Pair CAA with [DNSSEC](/spec/security/dnssec/) where possible. CAA without DNSSEC still helps — CAs check it — but DNSSEC stops an attacker from spoofing the DNS response.

## Common mistakes

- **No CAA record at all.** Every public CA may issue. Set at least one record.
- **Forgetting `issuewild`.** Without it, issuance of wildcards inherits the `issue` tag, which may be more permissive than you intend.
- **Listing a CA you no longer use.** Audit the records when you change provider.
- **Setting CAA on a subdomain you do not control issuance for.** Records at the apex are usually enough; only override per-subdomain when needed.

## Verification

- `dig CAA example.com +short` lists the records.
- Use the [SSLMate CAA Test](https://sslmate.com/caa/) or `curl -s "https://crt.sh/?q=example.com"` to confirm only expected CAs have issued certificates.
- Try to issue a test certificate from a CA not on the list; the issuance should fail with a CAA error.
- Monitor `iodef` mail for unexpected attempts.
