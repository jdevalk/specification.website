---
title: "Digest Fields (Content-Digest, Repr-Digest and Unencoded-Digest)"
slug: digest-fields
category: security
summary: "Digest Fields let clients check received bytes. Unencoded-Digest works after decompression, with limited browser support."
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
updated: "2026-09-10T00:00:00.000Z"
sources:
  - title: "RFC 9530 — Digest Fields"
    url: "https://www.rfc-editor.org/rfc/rfc9530.html"
    publisher: "IETF"
  - title: "HTTP Unencoded Digest — IETF working-group draft"
    url: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-unencoded-digest/"
    publisher: "IETF"
  - title: "MDN browser compatibility data — Unencoded-Digest"
    url: "https://github.com/mdn/browser-compat-data/blob/main/http/headers/Unencoded-Digest.json"
    publisher: "MDN"
  - title: "Signature-based Integrity — Unencoded-Digest validation"
    url: "https://wicg.github.io/signature-based-sri/#unencoded-digest-validation"
    publisher: "W3C Web Incubator Community Group"
---

## What it is

RFC 9530 defines `Content-Digest` and `Repr-Digest`, HTTP request and response fields carrying cryptographic hashes so the recipient can check the bytes arrived intact. The newer `Unencoded-Digest` complements them when content compression is involved.

```
Content-Digest: sha-256=:MaQTBTcydo27elAT7IySnGWPjltWKdB+8bxmm3LlAk0=:
```

The RFC 9530 fields are [Structured Fields](https://www.rfc-editor.org/rfc/rfc8941.html) Dictionaries: the key names the algorithm, the value is a Byte Sequence, and the wrapping colons are what mark it as one. Listing several algorithms in one field is legal, and is how you migrate between them without breaking older clients.

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

Spend the effort where a client will act on it: JSON APIs, file downloads, and machine-readable endpoints that agents fetch and cache. Browsers do not automatically validate `Content-Digest` or `Repr-Digest`; `Unencoded-Digest` has separate, limited browser support.

This site emits `Content-Digest` and `Repr-Digest` on every Markdown representation, covering the per-page [`.md` endpoints](/spec/agent-readiness/markdown-source-endpoints/), `/llms.txt` and `/checklist.md`, and honours `Want-Content-Digest`.

### Unencoded-Digest: checking after decompression

`Unencoded-Digest` hashes the **entire selected representation with no content coding applied**. The same value can survive gzip or Brotli recompression when decoding restores exactly the same bytes. It does not cover just one range: a client must reconstruct the complete representation before checking it.

Use it when the receiving client checks decoded bytes, such as after transparent decompression. Hash the original bytes with `sha-256` or `sha-512` and use the same Structured Fields dictionary syntax. It complements the encoded-byte checks above; it does not authenticate the sender.

As checked on 10 September 2026, MDN records support in **Chrome and Edge from version 141**, with Firefox and Safari unsupported. The [signature-based integrity specification](https://wicg.github.io/signature-based-sri/#unencoded-digest-validation) defines validation against the decoded response body. Test your target browser and resource type: emitting a header does not make every client enforce it. The HTTP field definition is still an Internet-Draft, currently in the RFC Editor queue.

`Want-Unencoded-Digest` expresses algorithm preferences using integers from 0 to 10, just like the other preference fields. It is a hint, not a guarantee of a digest response; browser support for `Unencoded-Digest` does not establish support for this companion field.

This site does not emit `Unencoded-Digest`: its current digest service targets uncompressed Markdown, where the existing fields already cover the same bytes.

## Common mistakes

- **Hashing before downstream compression for `Content-Digest` or `Repr-Digest`.** These two fields are tied to `Content-Encoding`. A CDN that gzips a response _after_ your application computed the hash leaves you advertising a digest of bytes the client never receives, and every conformant validation fails. Hash what goes on the wire, or omit the field on responses your edge may recompress. That is why the digests here stop at Markdown: our HTML is brotli-compressed downstream of the middleware that would compute them.
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

For `Unencoded-Digest`, hash the decoded body instead. Request a complete response with `curl --compressed -D headers.txt -o body https://example.com/data.json`, then compare its hash with `Unencoded-Digest`. Repeat with identity encoding: if the decoded bytes are identical, the digest should match across both responses. In a controlled browser test, serve a correct digest and then a deliberately incorrect one; confirm that the supporting browser rejects the mismatch for your intended resource type.
