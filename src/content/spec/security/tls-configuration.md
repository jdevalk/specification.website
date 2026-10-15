---
title: "TLS configuration hardening"
slug: tls-configuration
category: security
summary: "Beyond protocol versions and key exchange: TLS compression off, secure renegotiation only, no unsafe 0-RTT, Extended Main Secret on, server cipher order, SHA-2 signatures, and certificate keys of adequate size."
status: recommended
order: 15
appliesTo: [all]
relatedSlugs: [https-tls, hsts, compression, dane]
updated: "2026-10-15T00:00:00.000Z"
sources:
  - title: "RFC 9325 (BCP 195) — Recommendations for Secure Use of Transport Layer Security (TLS) and Datagram Transport Layer Security (DTLS)"
    url: "https://www.rfc-editor.org/rfc/rfc9325"
    publisher: "IETF"
  - title: "RFC 5746 — Transport Layer Security (TLS) Renegotiation Indication Extension"
    url: "https://www.rfc-editor.org/rfc/rfc5746"
    publisher: "IETF"
  - title: "RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3"
    url: "https://www.rfc-editor.org/rfc/rfc9846"
    publisher: "IETF"
  - title: "RFC 8470 — Using Early Data in HTTP"
    url: "https://www.rfc-editor.org/rfc/rfc8470"
    publisher: "IETF"
---

## What it is

[HTTPS and TLS](/spec/security/https-tls/) covers the decisions that matter most: TLS 1.2 and 1.3 only, ECDHE key exchange, hybrid post-quantum key agreement, a complete certificate chain. This page is the rest of the checklist: the parameters that tools such as Internet.nl and SSL Labs test one by one, each closing a specific, named attack.

Most of these settings only matter for TLS 1.2. TLS 1.3 removed compression and renegotiation, always binds the session to the full handshake, and only defines strong cipher suites, so a TLS 1.3-only server passes most of this list by construction. The reason the list still exists is that nearly every public site keeps TLS 1.2 enabled for older clients, and the TLS 1.2 side of the configuration is where the old defaults survive.

## Why it matters

Each item below corresponds to an attack that worked against real deployments: CRIME against TLS compression, the 2009 renegotiation injection attack, the triple-handshake attack, replay of early data, and signature forgery against weak hashes. A server that negotiates TLS 1.3 with a current browser is not exposed to most of them, but an attacker chooses the weakest protocol version the server will accept, not the one a typical visitor gets.

## How to implement

Start from the Mozilla SSL Configuration Generator's "Intermediate" profile, which covers most of this list, then check each item against your server, since older server versions and hand-edited configurations drift.

- **TLS compression off.** TLS-level compression leaks the contents of encrypted records through their length, which the CRIME attack used to recover session cookies. RFC 9325 says deployments **SHOULD NOT** support it. TLS 1.3 removed it entirely. This is separate from HTTP compression; see [compression](/spec/performance/compression/) for the related BREACH caveat.
- **Secure renegotiation on, client-initiated renegotiation off.** TLS 1.2 servers must support the `renegotiation_info` extension (RFC 5746), which fixes the 2009 plaintext injection attack; RFC 9325 makes it a **MUST**. Separately, disable renegotiation initiated by the client: it gives nothing to a website and lets a single client force repeated expensive handshakes, a cheap denial-of-service lever. TLS 1.3 has no renegotiation at all.
- **0-RTT off, or only for replay-safe requests.** TLS 1.3 early data (0-RTT) lets a returning client send its first request before the handshake finishes, but that data can be replayed by an attacker (RFC 9846, section 8). RFC 9325 says not to use it unless the application profile makes replay safe. For HTTP, RFC 8470 is that profile: only accept idempotent requests such as `GET` in early data, mark them with the `Early-Data: 1` header towards the origin, and answer `425 Too Early` for anything that changes state. If you cannot enforce that, leave 0-RTT off.
- **Extended Main Secret on (TLS 1.2).** The extension originally specified as "Extended Master Secret" (RFC 7627) binds the session keys to the whole handshake transcript, defeating the triple-handshake attack. RFC 9325 makes support a **MUST** for TLS 1.2. RFC 9846 renamed it "Extended Main Secret" and obsoleted RFC 7627 without changing how it works, so tools may use either name.
- **Server cipher order on TLS 1.2, or only strong suites.** If the server offers a mix of strong and weaker suites, configure it to choose from its own preference list rather than the client's, with AEAD suites (`AES-GCM`, `ChaCha20-Poly1305`) over `ECDHE` first; otherwise an old or misconfigured client can steer the connection to the weakest suite you allow. The alternative is to offer only strong suites, in which case the order no longer matters. That is the approach the Mozilla "Intermediate" profile takes: it turns server preference off because every suite it lists is strong, and Internet.nl accepts that too. On TLS 1.3 every defined suite is strong, so the same reasoning applies.
- **SHA-2 for the key-exchange signature.** In TLS 1.2 the server signs its key exchange parameters, and the hash for that signature is negotiated. SHA-1 and MD5 there **MUST NOT** be used (RFC 9155, cited by RFC 9325); offer SHA-256 or stronger only.
- **Certificate key of adequate size.** RSA keys of at least 2048 bits (RFC 9325 requires this), or ECDSA on P-256 or a larger curve. ECDSA P-256 is smaller and faster; many sites serve both an ECDSA and an RSA certificate and let the client choose.
- **Certificate signed with SHA-256 or stronger.** Publicly trusted CAs no longer issue SHA-1-signed certificates, so this mostly catches internal CAs, very old certificates, and SHA-1 intermediates left in a chain.

This site inherits these settings rather than configuring them: TLS is terminated by its CDN, Cloudflare, so its handshake parameters are the CDN's.

## Common mistakes

- **Copying a TLS configuration from before TLS 1.3** that never disabled compression or client renegotiation because the server's defaults at the time did not.
- **Enabling 0-RTT at the CDN for an application that accepts `POST` requests**, without the origin checking `Early-Data` or returning `425`.
- **Fixing the leaf certificate and forgetting the chain.** A SHA-256 leaf served with a SHA-1 intermediate still fails the signature check.
- **Assuming a good score with a modern browser means the TLS 1.2 side is fine.** Test the server, not one client's view of it.

## Verification

- The [Internet.nl website test](https://internet.nl/) checks each item in its HTTPS section: TLS compression, secure and client-initiated renegotiation, 0-RTT, cipher order, key-exchange hash function, certificate public key, certificate signature and Extended Master Secret.
- [Qualys SSL Labs](https://www.ssllabs.com/ssltest/) reports the same parameters, with the handshake each simulated client would get.
- `openssl s_client -connect example.com:443 -tls1_2` shows the negotiated suite and, on recent OpenSSL, whether Extended Master Secret was used.
