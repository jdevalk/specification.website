---
title: "HTTPS and TLS"
slug: https-tls
category: security
summary: "Serve every page over HTTPS using TLS 1.2 or 1.3, redirect plain HTTP to HTTPS, and disable obsolete SSL and early TLS versions on every host you control."
status: required
order: 10
appliesTo: [all]
relatedSlugs: [hsts, caa-records, content-security-policy, mixed-content]
updated: "2026-08-12T00:00:00.000Z"
sources:
  - title: "RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3"
    url: "https://www.rfc-editor.org/rfc/rfc9846"
    publisher: "IETF"
  - title: "RFC 9851 — TLS 1.2 is in Feature Freeze"
    url: "https://www.rfc-editor.org/rfc/rfc9851"
    publisher: "IETF"
  - title: "RFC 10015 — Deprecating Obsolete Key Exchange Methods in TLS 1.2 and DTLS 1.2"
    url: "https://www.rfc-editor.org/rfc/rfc10015.html"
    publisher: "IETF"
  - title: "RFC 10024 — Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3"
    url: "https://www.rfc-editor.org/rfc/rfc10024.html"
    publisher: "IETF"
  - title: "Mozilla SSL Configuration Generator"
    url: "https://ssl-config.mozilla.org/"
    publisher: "Mozilla"
---

## What it is

HTTPS is HTTP carried over TLS, a protocol that encrypts and authenticates the connection between the browser and the server. TLS 1.3 is the current version, specified by RFC 9846 — a July 2026 revision that obsoleted RFC 8446 without changing the version number or breaking compatibility. TLS 1.2 remains acceptable. Everything earlier — TLS 1.0, TLS 1.1, and all versions of SSL — is broken and must be disabled.

"Acceptable" is not the same as "equal", though, and the gap is widening rather than holding steady. TLS 1.2 is in feature freeze (RFC 9851): it receives urgent security fixes and nothing else, and post-quantum key agreement was standardised for TLS 1.3 alone (RFC 10024) with no plan to back-port it. It is also losing ground it already held — RFC 10015 (July 2026) retired most of its key exchange methods, leaving elliptic-curve Diffie-Hellman as effectively the only permitted way to agree a TLS 1.2 key. Keeping TLS 1.2 enabled for the clients that still need it is sound; treating it as a version you can sit on indefinitely is not.

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
- ECDHE key exchange only, on TLS 1.2 as well as 1.3.
- Hybrid post-quantum key agreement offered on TLS 1.3 — `X25519MLKEM768`.
- A complete certificate chain — serve the intermediate, not just the leaf.

That third line is stricter than the familiar "forward secrecy only" rule, and the difference is where TLS 1.2 configurations tend to be out of date. RFC 10015 says clients and servers **MUST NOT** offer or select RSA key exchange, static finite-field Diffie-Hellman, _or ephemeral finite-field Diffie-Hellman_ in TLS 1.2 — so `DHE` suites are now disallowed even though they are forward-secret, on the grounds that finite-field groups are slow, historically misconfigured, and no longer worth maintaining alongside the elliptic-curve equivalents. Static `ECDH` is a `SHOULD NOT`. In practice this leaves `ECDHE`, which is what a current Mozilla "Intermediate" configuration already gives you.

The fourth line is the newer one. RFC 10024 (August 2026) put three hybrid mechanisms on the standards track — `X25519MLKEM768`, `SecP256r1MLKEM768` and `SecP384r1MLKEM1024` — each pairing the post-quantum ML-KEM with an ordinary elliptic-curve exchange, so a break in either half still leaves the connection secure. `X25519MLKEM768` is the one to offer: the RFC marks it Recommended and describes it as already widely deployed, because browsers and large CDNs shipped it ahead of publication. Its predecessor code points, the draft `X25519Kyber768Draft00` and `SecP256r1Kyber768Draft00`, are obsolete; a server still pinned to those is negotiating something no current client asks for.

It is worth being precise about what this protects, because "post-quantum" gets used as though it were one switch. Hybrid key agreement defends **confidentiality**, and it defends it retroactively: traffic captured today can be stored and decrypted years from now once a sufficient quantum computer exists, so the fix has to be deployed before the threat arrives rather than after. **Authentication** — the certificate chain proving you are the right host — is a separate migration, still governed by CA and root-programme timelines, and nothing you configure on your server today completes it. Turning on `X25519MLKEM768` is real progress on the first problem and no progress at all on the second.

## Common mistakes

- [Mixed content](/spec/security/mixed-content/): an HTTPS page that loads a script, image, or iframe over HTTP. Browsers block it.
- Self-signed certificates on production. Use a real CA.
- A valid certificate on `www.example.com` but not the apex `example.com`, or vice versa.
- Leaving TLS 1.0 or 1.1 enabled "for old clients" that no longer exist.
- Carrying `DHE` or RSA key exchange suites in a TLS 1.2 configuration written before July 2026. Both are now `MUST NOT`.
- Treating post-quantum readiness as a certificate purchase. Hybrid key agreement is a server configuration change; post-quantum certificates are a separate, later migration.
- Forgetting to renew. Automate it.

## Verification

- Run the [Qualys SSL Labs test](https://www.ssllabs.com/ssltest/) and aim for an A or A+.
- `curl -vI https://example.com` should report `TLS 1.3` or `TLS 1.2` and a valid chain.
- Check the negotiated group from a current browser or from SSL Labs; on TLS 1.3 it should read `X25519MLKEM768`, not plain `x25519`.
- Visit `http://example.com` and confirm it 301s to `https://`.
- Check the browser console for mixed-content warnings.
