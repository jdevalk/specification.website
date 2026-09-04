---
title: "Unencoded-Digest and Want-Unencoded-Digest"
date: "2026-09-04"
reason: too-early
revisit: "A server, CDN or client that emits or checks `Unencoded-Digest` without a hand-written recipe. Cloudflare or Fastly adding it alongside their existing `Content-Digest` support would be the clearest signal; so would a package manager or software-distribution endpoint adopting it for the integrity case the draft was written for."
sources:
  - title: "draft-ietf-httpbis-unencoded-digest — HTTP Unencoded Digest"
    url: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-unencoded-digest/"
    publisher: "IETF HTTP Working Group"
  - title: "RFC 9530 — Digest Fields"
    url: "https://www.rfc-editor.org/rfc/rfc9530.html"
    publisher: "IETF"
  - title: "IANA — HTTP Field Name Registry"
    url: "https://www.iana.org/assignments/http-fields/http-fields.xhtml"
    publisher: "IANA"
---

[RFC 9530](/spec/security/digest-fields/) gives HTTP two integrity fields: `Content-Digest`, which hashes the bytes actually on the wire, and `Repr-Digest`, which hashes the selected representation. Neither hashes the resource as it exists before any content coding is applied — so a client that receives a gzipped response cannot compare its digest against the one the origin's build pipeline computed over the raw file, and a proxy that recompresses the body invalidates `Content-Digest` on the way through. `Unencoded-Digest` (and its request-side companion `Want-Unencoded-Digest`) closes exactly that gap: one digest that survives being compressed, decompressed and recompressed by anything on the path.

It is real work and it is nearly done. The draft is an HTTP Working Group document, both fields carry provisional entries in the IANA HTTP Field Name registry, SECDIR and GENART reviews came back clean, and as of this scan it sits in the RFC Editor queue awaiting an editor. What it does not have is a single implementation we could point a reader at. No CDN emits it, no server produces it, no client checks it — the field exists in a registry and a draft and nowhere else. Our own [Digest Fields](/spec/security/digest-fields/) page is already `optional` on the grounds that `Content-Digest` is thinly deployed; a sibling field with strictly less deployment than that does not clear a bar the parent barely clears.

This is the reference case for **registration is not adoption**, which is the mistake the IANA registries most invite. A provisional entry in an IANA table looks like a fact about the web — the name is taken, the semantics are fixed, the reference is stable — and it is none of those things about what any server actually sends. Reading a registry top to bottom is a good way to find candidates and a bad way to decide between them; every entry there had someone who wanted it, and that is all the entry proves. Wait for the second implementation, not the registration.
