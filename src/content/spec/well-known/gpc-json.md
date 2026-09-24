---
title: "/.well-known/gpc.json"
slug: gpc-json
category: well-known
summary: "A small JSON document at /.well-known/gpc.json in which an origin declares that it is aware of Global Privacy Control and intends to honour the signal. Only applicable to sites that process personal data in ways an opt-out signal touches."
status: optional
order: 33
appliesTo: [all]
relatedSlugs:
  [well-known-overview, global-privacy-control, privacy-policy, cookie-consent]
updated: "2026-09-24T00:00:00.000Z"
sources:
  - title: "Global Privacy Control (GPC) — §4 GPC Support Resource (W3C Working Draft, 17 September 2026)"
    url: "https://www.w3.org/TR/gpc/"
    publisher: "W3C Privacy Working Group"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Global Privacy Control — Implementation guide for publishers"
    url: "https://globalprivacycontrol.org/implementation"
    publisher: "Global Privacy Control"
---

## What it is

`/.well-known/gpc.json` is the **GPC support resource**: a JSON document in which an origin states, in machine-readable form, that it is aware of [Global Privacy Control](/spec/privacy/global-privacy-control/) and intends to honour the signal.

```json
{
  "gpc": true,
  "lastUpdate": "2026-09-24"
}
```

That is the whole document. `gpc` is a boolean — `true` means the origin intends to honour GPC requests to the extent it is legally required to; `false` means it does not. Any other value leaves support unknown. `lastUpdate` is an RFC 3339 date (`YYYY-MM-DD`, or a full timestamp) saying when the statement was last made. The name is registered with IANA and the document is defined in §4 of the W3C Global Privacy Control specification.

**The file is not how you honour GPC.** This is the confusion worth naming up front. The obligation under California, Colorado and the other state opt-out laws attaches to what your server *does* when a request arrives carrying `Sec-GPC: 1` — you stop selling or sharing that user's personal information. Publishing `{"gpc": true}` changes nothing about that request handling, and publishing it without doing the work is simply a false statement in public. The spec is unusually blunt about the boundary: the support resource conveys an origin's awareness of and support for GPC, and is "not intended to convey whether the origin abides by GPC requests from the user agent accessing the resource." It is a site-wide declaration, not a per-request receipt and not a consent record.

By default, an origin's GPC support is **unknown**. The file's job is to replace that unknown with a stated position.

## Why it matters

The `Sec-GPC` header only tells you something when a user who has enabled GPC visits. There is no way, from the outside, to ask a site whether it honours the signal — a crawler cannot send a request and infer intent from the response body. The support resource is the answer to that question, at a fixed path, for anyone who wants to ask it without visiting.

That matters to three audiences. Privacy extensions and GPC-aware browsers can show a user whether the site they are on has declared support. Regulators and researchers can survey compliance across a population of sites rather than testing them one at a time. And consent-management platforms and privacy tooling use it as the site's own statement of position.

It is also the cheapest possible part of a GPC implementation: a static file. If you have already done the hard part — actually processing the signal — declaring it costs one commit.

## How to implement

Serve the document at exactly `/.well-known/gpc.json` on the canonical host, over HTTPS, with `Content-Type: application/json`. A different media type leaves your support status unknown, which defeats the point.

```http
GET /.well-known/gpc.json HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Type: application/json

{ "gpc": true, "lastUpdate": "2026-09-24" }
```

Then:

- **Only publish `"gpc": true` if it is true.** Process `Sec-GPC: 1` first; publish second.
- **Set `lastUpdate` to the day the statement was last reviewed**, and revisit it when your data practices change.
- **Keep it reachable.** No login wall, no user-agent blocking, no WAF rule that treats a bare `/.well-known/` probe as suspicious.
- **Say the same thing in your [privacy policy](/spec/privacy/privacy-policy/).** The JSON is for machines; the prose is what a person reads, and the two must not disagree.

A site with no advertising, no data brokers and no third-party trackers has nothing an opt-out signal changes. Publishing `{"gpc": true}` there is accurate but empty, and omitting the file is a perfectly good answer — this site does not ship one for exactly that reason. The file earns its place on sites where the signal actually alters behaviour.

## Common mistakes

- **Publishing the file instead of implementing GPC.** The declaration is the visible part; the request handling is the part with legal consequences.
- Serving it as `text/plain` or `text/html` because a framework or static host guessed the content type from something other than the extension.
- Wrapping the object in an array, or using `"gpc": "true"` as a string. Only a JSON object with a boolean `gpc` member counts.
- Letting `lastUpdate` rot for years after the site's data practices changed.
- Treating it as a replacement for a cookie banner under the GDPR. GPC is an opt-out mechanism; EU consent is opt-in, and neither the header nor this file satisfies the other regime.

## Verification

```
curl -sI https://example.com/.well-known/gpc.json
curl -s  https://example.com/.well-known/gpc.json
```

The first should return `200` with `Content-Type: application/json`; the second should return an object with a boolean `gpc`. Then check the claim is true: send a request with `Sec-GPC: 1` and confirm the response does not set advertising or data-broker tags.
