---
title: "/.well-known/api-catalog"
slug: api-catalog
category: well-known
summary: "RFC 9727 publishes a machine-readable index of the APIs and resources a host exposes. Served as a Linkset (RFC 9264) JSON document, discoverable via the api-catalog link relation."
status: recommended
order: 35
appliesTo: [all]
relatedSlugs: [well-known-overview, link-headers, llms-txt, machine-readable-formats, a2a-agent-cards]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "RFC 9727 — Publishing Organisation API Information"
    url: "https://www.rfc-editor.org/rfc/rfc9727"
    publisher: "IETF"
  - title: "RFC 9264 — Linkset: Media Types and a Link Relation Type for Link Sets"
    url: "https://www.rfc-editor.org/rfc/rfc9264"
    publisher: "IETF"
  - title: "RFC 8288 — Web Linking"
    url: "https://www.rfc-editor.org/rfc/rfc8288"
    publisher: "IETF"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

`/.well-known/api-catalog` is an IETF-standardised path at which an organisation publishes a machine-readable catalogue of the APIs and structured resources its host exposes. The document is a [Linkset](https://www.rfc-editor.org/rfc/rfc9264) (RFC 9264) — a JSON array of link relations grouped by an anchor URL.

The name undersells it: despite "api", the catalogue is not limited to OpenAPI specs or JSON endpoints. Most of its useful relations, such as `sitemap`, `describedby`, `license` and `alternate`, point at resources that are not APIs at all. Read it as an index of every machine-readable thing on the origin, expressed as a Linkset.

```http
GET /.well-known/api-catalog HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/linkset+json; charset=utf-8
```

```json
{
  "linkset": [
    {
      "anchor": "https://example.com/",
      "describedby": [
        { "href": "https://example.com/llms.txt", "type": "text/markdown" }
      ],
      "alternate": [
        { "href": "https://example.com/rss.xml", "type": "application/rss+xml" }
      ],
      "sitemap": [
        { "href": "https://example.com/sitemap-index.xml", "type": "application/xml" }
      ],
      "license": [
        { "href": "https://creativecommons.org/licenses/by/4.0/" }
      ]
    }
  ]
}
```

The path is registered in the [IANA Well-Known URIs Registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml) by RFC 9727 — unlike many AI-era conventions, this one is standards-track.

## Why it matters

- **One predictable fetch surfaces every machine-readable resource.** Agents that obey `/.well-known/api-catalog` get a typed list of feeds, sitemaps, llms.txt, OpenAPI specs, terms of service, licence URLs — without scraping HTML.
- **Pairs with the `Link` header.** Advertise `Link: </.well-known/api-catalog>; rel="api-catalog"` and the agent never has to guess the path. See [HTTP Link headers](/spec/agent-readiness/link-headers/).
- **Standards-track.** RFC 9727 (May 2024) is final, not a draft. The IANA registration anchors the path.
- **Cheap to ship.** A small static JSON file.

## How to implement

**Serve a Linkset.** RFC 9727 requires the response body to be a valid [Linkset](https://www.rfc-editor.org/rfc/rfc9264). The media type is `application/linkset+json`. Set the `Content-Type` accordingly — most static hosts default to `application/octet-stream` for files without an extension.

**Each `linkset` entry has an `anchor`** (the resource the links describe) and one or more relation-keyed arrays. Useful relations:

- `describedby` — a description of the anchor (llms.txt, OpenAPI).
- `service-desc` — a machine-readable description of an API (OpenAPI, AsyncAPI).
- `service-doc` — a human-readable description of an API.
- `alternate` — alternative representations of the anchor's content.
- `sitemap` — sitemap covering the anchor.
- `license`, `author`, `terms-of-service` — metadata.
- `status` — status / health endpoint.

**Advertise it.** Add the catalogue to your HTTP `Link` header on every response:

```http
Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"
```

This is what makes the path discoverable without an out-of-band hint.

**Update it when the surface changes.** A drifted catalogue is worse than no catalogue. CI should validate it on every change to the public resources it describes.

**Keep it small.** Catalogues are typically a few KB. Linksets are flat — there is no recursion to follow.

## Common mistakes

- Returning the catalogue with `Content-Type: application/json` (or `text/plain`). It must be `application/linkset+json` for RFC 9727 to apply; agents that strictly type-check will skip it otherwise.
- Inventing relation names. Use only those in the [IANA Link Relations Registry](https://www.iana.org/assignments/link-relations/link-relations.xhtml).
- Wrapping the catalogue inside an authentication wall. The whole point is unauthenticated discovery.
- Forgetting to keep it in sync with `/llms.txt`, `/sitemap-index.xml`, and the `<link>` tags in HTML. They are different surfaces for the same statement of fact.
- Pairing it with `Link: </.well-known/api-catalog>; rel="describedby"`. The correct relation is `api-catalog` — that registration is what RFC 9727 added.

## Verification

- `curl -sI https://example.com/.well-known/api-catalog` returns `200` with `Content-Type: application/linkset+json`.
- The body parses as JSON and matches the Linkset schema (RFC 9264 §4).
- [Is It Agent Ready?](https://isitagentready.com/) flips `discovery.apiCatalog` to `pass`.
- Every URL the catalogue points at returns `200` from the same origin.
