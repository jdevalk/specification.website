---
title: "HTTPS and TLS"
slug: https-tls
category: security
summary: "Serve every page over HTTPS using TLS 1.2 or 1.3, redirect plain HTTP to HTTPS, and disable obsolete SSL and early TLS versions on every host you control."
status: required
order: 10
appliesTo: [all]
relatedSlugs: [hsts, caa-records, content-security-policy, mixed-content]
updated: "2026-07-17T00:00:00.000Z"
sources:
  - title: "RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3"
    url: "https://www.rfc-editor.org/rfc/rfc9846"
    publisher: "IETF"
  - title: "RFC 9851 — TLS 1.2 is in Feature Freeze"
    url: "https://www.rfc-editor.org/rfc/rfc9851"
    publisher: "IETF"
  - title: "Mozilla SSL Configuration Generator"
    url: "https://ssl-config.mozilla.org/"
    publisher: "Mozilla"
  - title: "MDN — Transport Layer Security"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security"
    publisher: "MDN"
  - title: "Qualys SSL Labs Server Test"
    url: "https://www.ssllabs.com/ssltest/"
    publisher: "Qualys"
---

## What it is

HTTPS is HTTP carried over TLS, a protocol that encrypts and authenticates the connection between the browser and the server. TLS 1.3 is the current version, specified by RFC 9846 — a July 2026 revision that obsoleted RFC 8446 without changing the version number or breaking compatibility. TLS 1.2 remains acceptable. Everything earlier — TLS 1.0, TLS 1.1, and all versions of SSL — is broken and must be disabled.

"Acceptable" is not the same as "equal", though, and the gap is widening rather than holding steady. TLS 1.2 is in feature freeze (RFC 9851): it receives urgent security fixes and nothing else, and post-quantum key exchange is being specified for TLS 1.3 and later only. Keeping TLS 1.2 enabled for the clients that still need it is sound; treating it as a version you can sit on indefinitely is not.

What HTTPS does not do is vouch for the site. The certificate proves you are talking to the genuine holder of the name in the address bar, and that nobody on the path can read or alter the bytes. It says nothing about whether that party is honest: a phishing page served over flawless HTTPS shows the same padlock a bank does. HTTPS secures the channel, not the character of whatever is at the far end of it.

## Why it matters

- **Confidentiality.** Without TLS, anyone on the path can read form data, cookies, and page content.
- **Integrity.** Network operators and middleboxes routinely inject ads, trackers, and malware into plain HTTP.
- **Authentication.** The certificate proves the visitor is talking to the right host, not a captive portal or attacker.
- **Modern web features.** Service workers, HTTP/2, HTTP/3, geolocation, camera, and most powerful browser APIs require a secure context.
- **SEO and trust.** Browsers mark HTTP pages as "Not Secure". Search engines prefer HTTPS.

## How to implement

Get a certificate from an ACME-supported certificate authority — Let's Encrypt and ZeroSSL are free, automated, and well supported. Most hosting platforms issue and renew certificates automatically.

Configure your server using the Mozilla SSL Configuration Generator. The "Intermediate" profile is the right default for public sites in 2026 — it supports TLS 1.2 and 1.3 and works on every browser still in use.

Redirect every HTTP request to HTTPS with a 301:

```http
HTTP/1.1 301 Moved Permanently
Location: https://example.com/path
```

Serve the same redirect on every hostname you own, including the apex, `www`, and any legacy subdomains. After HTTPS works, add [HSTS](/spec/security/hsts/) so browsers stop trying HTTP at all.

Cipher and protocol checklist:

- TLS 1.3 enabled, TLS 1.2 enabled, everything older disabled.
- OCSP stapling on.
- Forward-secret cipher suites only (ECDHE).
- A complete certificate chain — serve the intermediate, not just the leaf.

## Common mistakes

- [Mixed content](/spec/security/mixed-content/): an HTTPS page that loads a script, image, or iframe over HTTP. Browsers block it.
- Self-signed certificates on production. Use a real CA.
- A valid certificate on `www.example.com` but not the apex `example.com`, or vice versa.
- Leaving TLS 1.0 or 1.1 enabled "for old clients" that no longer exist.
- Forgetting to renew. Automate it.

## Verification

- Run the [Qualys SSL Labs test](https://www.ssllabs.com/ssltest/) and aim for an A or A+.
- `curl -vI https://example.com` should report `TLS 1.3` or `TLS 1.2` and a valid chain.
- Visit `http://example.com` and confirm it 301s to `https://`.
- Check the browser console for mixed-content warnings.
