---
title: "/.well-known/security.txt"
slug: security-txt
category: security
summary: "A standard text file at /.well-known/security.txt tells security researchers how to report vulnerabilities. It is cheap to publish and dramatically lowers the bar for responsible disclosure."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [well-known-overview, https-tls, hsts]
updated: "2026-06-08T12:00:00.000Z"
sources:
  - title: "RFC 9116 — A File Format to Aid in Security Vulnerability Disclosure"
    url: "https://www.rfc-editor.org/rfc/rfc9116"
    publisher: "IETF"
  - title: "securitytxt.org"
    url: "https://securitytxt.org/"
    publisher: "securitytxt.org"
  - title: "RFC 8615 — Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615"
    publisher: "IETF"
---

## What it is

`security.txt` is a plain-text file served at `/.well-known/security.txt` that lists the contact methods, policy URL, and encryption keys a security researcher should use to report a vulnerability in your site. It is defined by RFC 9116.

```http
GET /.well-known/security.txt HTTP/1.1
Host: example.com
```

A minimal file:

```
Contact: mailto:security@example.com
Expires: 2027-01-01T00:00:00Z
```

## Why it matters

When a researcher finds a vulnerability, the first question is "who do I tell?". Without a known address, reports go to `info@`, get lost in support queues, or — worse — get posted publicly because no one answered. `security.txt` removes the guesswork. It is the security equivalent of `robots.txt`: a small, standard, machine-readable file in a known location.

Bug-bounty platforms, automated scanners, and security teams check for it. Publishing one signals that you take reports seriously, and many researchers will not bother with a site that has no clear contact.

## How to implement

Create the file at `/.well-known/security.txt`. Serve it over HTTPS with `Content-Type: text/plain; charset=utf-8`. RFC 9116 fields:

- **`Contact:`** — required. One or more `mailto:`, `https:`, or `tel:` URIs. Use a monitored mailbox or form.
- **`Expires:`** — required. ISO 8601 timestamp. Set it to roughly a year out and update it before it lapses.
- **`Encryption:`** — optional. URL to a PGP key for encrypted reports.
- **`Preferred-Languages:`** — optional. Comma-separated BCP 47 tags.
- **`Canonical:`** — optional. The canonical HTTPS URL of the file itself; helps when the file is mirrored.
- **`Policy:`** — optional. URL to your responsible-disclosure or bug-bounty policy.
- **`Acknowledgments:`** — optional. URL to a hall of fame.
- **`Hiring:`** — optional. URL to security-team job listings.

Full example:

```
Contact: mailto:security@example.com
Contact: https://example.com/security/report
Expires: 2027-05-29T00:00:00Z
Encryption: https://example.com/.well-known/pgp-key.txt
Preferred-Languages: en, nl
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security/policy
```

RFC 9116 allows the file to be cryptographically signed with an inline PGP signature. Useful for high-trust environments, optional for most sites.

## Common mistakes

- **No `Expires:`.** The file is invalid per RFC 9116 without it.
- **Letting `Expires:` lapse.** Treat it like a certificate. Calendar reminder, automated check, or both.
- **Pointing `Contact:` at an unmonitored address.** Worse than no file at all.
- **Serving the file from `/security.txt` instead of `/.well-known/security.txt`.** RFC 9116 says the well-known path is canonical.

## Verification

- `curl -s https://example.com/.well-known/security.txt` should return the file.
- The response must be `200` and `Content-Type: text/plain`.
- Parse it with the validator at [securitytxt.org](https://securitytxt.org/).
- Check the `Expires:` date in your monitoring.
