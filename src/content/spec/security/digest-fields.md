---
title: "Digest Fields (Content-Digest and Repr-Digest)"
slug: digest-fields
category: security
summary: "RFC 9530 lets a server publish a cryptographic hash of what it sent, so a client can detect corruption in transit. Worth shipping on APIs, file downloads, and machine-readable endpoints; browsers ignore it."
status: optional
order: 92
appliesTo: [all]
relatedSlugs:
  [
    subresource-integrity,
    https-tls,
    markdown-source-endpoints,
    conditional-requests,
  ]
updated: "2026-07-08T00:00:00.000Z"
sources:
  - title: "RFC 9530 — Digest Fields"
    url: "https://www.rfc-editor.org/rfc/rfc9530.html"
    publisher: "IETF"
  - title: "RFC 9110 — HTTP Semantics §8.1 (Representation Data), §6.4 (Content)"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-representation-data"
    publisher: "IETF"
  - title: "IANA — Hash Algorithms for HTTP Digest Fields"
    url: "https://www.iana.org/assignments/http-digest-hash-alg/http-digest-hash-alg.xhtml"
    publisher: "IANA"
  - title: "RFC 9421 — HTTP Message Signatures"
    url: "https://www.rfc-editor.org/rfc/rfc9421.html"
    publisher: "IETF"
---

## What it is

Digest Fields are two HTTP response fields carrying a cryptographic hash of what the server sent, so the recipient can check the bytes arrived intact.

```
Content-Digest: sha-256=:MaQTBTcydo27elAT7IySnGWPjltWKdB+8bxmm3LlAk0=:
```

Both are [Structured Fields](https://www.rfc-editor.org/rfc/rfc8941.html) Dictionaries: the key names the algorithm, the value is a Byte Sequence, and the wrapping colons are what mark it as one. Listing several algorithms in one field is legal, and is how you migrate between them without breaking older clients.

They differ in coverage. `Content-Digest` hashes the message content actually transferred. `Repr-Digest` hashes the entire selected representation, whether or not all of it was sent. On an ordinary full response they are identical. They diverge on a range request: for `Range: bytes=10-18` against `{"hello": "world"}`, `Repr-Digest` still covers the whole object while `Content-Digest` covers only the nine bytes returned.

Two request fields, `Want-Content-Digest` and `Want-Repr-Digest`, let a client ask for a digest and rank algorithms by an integer preference from 0 to 10, where 0 means "not acceptable".

RFC 9530 obsoletes RFC 3230's `Digest` field, which failed to interoperate precisely because it never settled whether the hash covered the bytes on the wire or the resource behind them.

## Why it matters

TLS already stops a network attacker, and the RFC is blunt that digests add nothing there: an on-path actor can strip the field or recompute it over altered content.

The value is in catching accidents. A transforming proxy that recompressed a payload, a truncated upload, a storage backend that silently returned the wrong object. For any client that caches or redistributes what it fetched, a digest is the difference between trusting a pipeline and verifying it.

Digests also compose with signatures. [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html) cover header fields, not bodies; signing `Content-Digest` is how that coverage is extended to the content. Only then does a digest resist a deliberate attacker, because the signature makes stripping it detectable.

## How to implement

Hash the body and emit the field. Use `sha-256` or `sha-512`, the only algorithms the [IANA registry](https://www.iana.org/assignments/http-digest-hash-alg/http-digest-hash-alg.xhtml) marks `Active`. Everything else there, including `md5`, `sha` (SHA-1), `crc32c` and `adler`, is registered `Deprecated`.

Emit `Repr-Digest` when you can hash the whole resource and `Content-Digest` when you can only hash what you sent. On a plain `200` with no compression, one value satisfies both.

If you honour `Want-Content-Digest`, the algorithm depends on a request header, so add that field to `Vary` or caches will serve one client's SHA-512 to a client that asked for SHA-256.

Spend the effort where a client will act on it: JSON APIs, file downloads, and machine-readable endpoints that agents fetch and cache. Browsers do not validate these fields, so adding them to ordinary HTML buys nothing.

This site emits both fields on every Markdown representation, covering the per-page [`.md` endpoints](/spec/agent-readiness/markdown-source-endpoints/), `/llms.txt` and `/checklist.md`, and honours `Want-Content-Digest`.

## Common mistakes

- **Hashing the body before something else re-encodes it.** Digest fields are tied to `Content-Encoding`. A CDN that gzips a response _after_ your application computed the hash leaves you advertising a digest of bytes the client never receives, and every conformant validation fails. Hash what goes on the wire, or omit the field on responses your edge may recompress. That is why the digests here stop at Markdown: our HTML is brotli-compressed downstream of the middleware that would compute them.
- **Assuming `Repr-Digest` is encoding-independent.** It is independent of _transfer_ codings such as HTTP/1.1 chunking, which is a different thing. The same resource has one `Repr-Digest` served identity and another served brotli.
- **Treating a digest as authentication.** It proves nothing about origin.
- **Reaching for MD5 out of habit.** It is `Deprecated` and collision-vulnerable.

## Verification

Recompute the hash independently. The digest is base64 of the raw hash, not of its hex form:

```
curl -sS -D headers.txt -o body https://example.com/data.json
grep -i '^content-digest' headers.txt
echo "sha-256=:$(openssl dgst -sha256 -binary body | openssl base64 -A):"
```

The two lines must match byte for byte, colons and all. Repeat with `Accept-Encoding: gzip` and with `identity`, and confirm the advertised digest still describes what you received. That is where a misconfigured proxy shows itself.
