---
title: "Schemamap — discoverable JSON-LD endpoints per resource"
slug: schemamap
category: agent-readiness
summary: "A convention this site proposes — no external standard exists yet. `/schemamap.xml` indexes one JSON-LD endpoint per resource so agents fetch the structured-data graph directly instead of extracting it from HTML."
status: optional
order: 90
appliesTo: [all]
relatedSlugs: [structured-data-for-agents, structured-data, markdown-source-endpoints, link-headers, xml-sitemaps, llms-txt]
updated: "2026-05-29T14:13:42.000Z"
sources:
  - title: "JSON-LD 1.1 Specification"
    url: "https://www.w3.org/TR/json-ld11/"
    publisher: "W3C"
  - title: "Schema.org"
    url: "https://schema.org/"
    publisher: "schema.org"
  - title: "RFC 8288 — Web Linking"
    url: "https://www.rfc-editor.org/rfc/rfc8288"
    publisher: "IETF"
  - title: "IANA — Link Relations Registry"
    url: "https://www.iana.org/assignments/link-relations/link-relations.xhtml"
    publisher: "IANA"
  - title: "Sitemaps XML format"
    url: "https://www.sitemaps.org/protocol.html"
    publisher: "sitemaps.org"
---

## What it is

Schemamap is a convention this site proposes. It has no external standard, no IANA-registered link relation, and no second implementer at the time of writing. It is documented here as a worked proposal — not as settled web infrastructure. Treat the status as `optional` and adopt it because the design fits your needs, not because anyone else expects you to ship it.

The shape:

1. **A per-resource JSON-LD endpoint.** Every page that has structured data exposes its JSON-LD graph at a predictable URL — by convention, the canonical URL with a `.jsonld` suffix — served with `Content-Type: application/ld+json`. The endpoint returns the same `@graph` the HTML embeds, in a stable shape, with no surrounding markup to parse.

2. **An index — `/schemamap.xml`.** A sitemap-shaped XML file at the site root lists every resource that has a JSON-LD endpoint. Each `<resource>` carries the canonical URL, the `.jsonld` URL, the schema.org `@type`s present, and an optional `<lastmod>`.

3. **HTML discovery.** Two `<link>` tags in `<head>`. The site-wide one points at the index using the proposed `rel="schemamap"`. The per-page one points at this resource's JSON-LD endpoint using the registered `rel="alternate" type="application/ld+json"` — so agents that do not recognise `schemamap` still find the per-page graph through a standard relation.

```html
<!-- Per page -->
<link rel="alternate" type="application/ld+json"
      href="https://example.com/articles/foo.jsonld"
      title="Foo — JSON-LD graph">

<!-- Site-wide -->
<link rel="schemamap" type="application/xml"
      href="/schemamap.xml"
      title="Schemamap index">
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<schemamap xmlns="https://example.com/schemas/schemamap/0.1">
  <resource>
    <loc>https://example.com/articles/foo/</loc>
    <jsonld>https://example.com/articles/foo.jsonld</jsonld>
    <type>Article</type>
    <type>BreadcrumbList</type>
    <lastmod>2026-05-29</lastmod>
  </resource>
</schemamap>
```

**This site ships it.** Every spec page exposes a JSON-LD graph at `/spec/<category>/<slug>.jsonld`, and the index at [`/schemamap.xml`](/schemamap.xml) lists all of them. The per-page graph is also registered in the [api-catalog Linkset](/.well-known/api-catalog) under a URI-based rel so the discovery path is self-describing without the IANA registry.

## Why it matters

The status quo for structured data is "parse the HTML and pick out every `<script type=\"application/ld+json\">`". That works, but it has costs:

- **Lossy extraction.** Some sites ship multiple disagreeing JSON-LD blocks across plugins or templates on the same page; the [structured-data page](/spec/seo/structured-data/) flags this as a common mistake. There is no contract that says which block is canonical.
- **Hydration risk.** Frameworks that emit JSON-LD after JavaScript runs make the markup invisible to non-rendering crawlers. A dedicated endpoint runs no JavaScript.
- **No index.** The XML sitemap lists URLs; it does not say which of those URLs carries `Article`, `Product`, or `BreadcrumbList` markup. An agent that wants every `Recipe` on a site has to fetch every page.
- **Cross-page `@id` linking is harder than it should be.** When the graph lives in `<script>` tags scattered across the site, you cannot dereference an `@id` URI unless every page that mentions the entity is fetched.

A discoverable index of JSON-LD endpoints fixes all four cheaply. The cost is one new endpoint type and one extra file. Compare with the [Markdown source endpoints](/spec/agent-readiness/markdown-source-endpoints/) convention, which solves the same kind of problem for prose.

## How to implement

**Expose the per-page endpoint first.** Without `.jsonld` URLs, the index has nothing to point at. For each page that ships structured data, render the same graph you embed in the HTML to a separate endpoint:

```http
GET /articles/foo.jsonld HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/ld+json; charset=utf-8
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=3600
```

Use a stable `@id` on every node (the canonical URL with a fragment is fine — `#article`, `#breadcrumb`, `#organization`). Include a `license` field on the graph if your content is licensed.

**Build the index from the same content source.** On `specification.website`, [`src/pages/schemamap.xml.ts`](https://github.com/jdevalk/specification.website/blob/main/src/pages/schemamap.xml.ts) iterates the content collection that drives the rest of the site, so the index cannot drift from the per-page endpoints. Sort entries by category then order then title — agents that incrementally fetch will see the same ordering as humans on `/spec/`.

**Advertise discovery in `<head>`.**

```html
<link rel="alternate" type="application/ld+json" href="…/page.jsonld" title="… JSON-LD graph">
<link rel="schemamap" type="application/xml" href="/schemamap.xml" title="Schemamap index">
```

Add the per-page link on every page that has a JSON-LD endpoint. Add the schemamap link site-wide.

**Pick the right serving headers.** `Content-Type: application/ld+json` for the endpoints, `application/xml` for the index. Set `Access-Control-Allow-Origin: *` so cross-origin agents can fetch the graph from a browser context. Cache aggressively — the graph only changes when the source content does.

**Be honest in the index about the registration gap.** The `rel="schemamap"` value is not in the [IANA Link Relations Registry](https://www.iana.org/assignments/link-relations/link-relations.xhtml). [HTTP Link headers](/spec/agent-readiness/link-headers/) explicitly warns against inventing custom `rel` values for that reason. Two ways to handle it:

- **In HTML `<head>` only.** Ship `rel="schemamap"` in the page — that link tag *is* the proposal under test. Do not add it to the global HTTP `Link` header until the relation is registered. This site takes that route.
- **Use a URI-form `rel` instead.** Per [RFC 8288 §2.1.1](https://www.rfc-editor.org/rfc/rfc8288.html#section-2.1.1), a `rel` value that is a URI does not require IANA registration. This site exposes the schemamap entry in `/.well-known/api-catalog` under `https://specification.website/schemas/schemamap/0.1#index`, so any client that reads the api-catalog finds it without depending on a bare-name relation at all.

Registration is the prerequisite for promoting any of this beyond `optional`. Until then, treat schemamap as an opt-in proposal you can audit and walk back from.

## Common mistakes

- **Drift between the HTML graph and the `.jsonld` endpoint.** They have to be generated from the same source at the same time. If the page changes and the endpoint does not, every agent that trusted the index now has stale facts.
- **Inventing `@type` values to fill the index.** Only list real, valid schema.org types. Lying about types pollutes the only thing that makes the index more useful than a sitemap.
- **Forgetting CORS.** Without `Access-Control-Allow-Origin: *`, a browser-side agent cannot fetch the JSON-LD even though a backend crawler can — the discovery surface fragments by client.
- **Listing pages whose JSON-LD is just `WebSite`.** The homepage's `WebSite` block is the same on every page; it carries no resource-specific facts. The index should list resources whose graph adds something — articles, products, events, recipes, persons — not boilerplate.
- **Treating schemamap as a substitute for the XML sitemap or `llms.txt`.** They answer different questions: the sitemap lists URLs for indexing, `llms.txt` summarises content for LLMs, schemamap lists structured-data endpoints. Ship all three.

## Verification

- `curl -sI https://example.com/articles/foo.jsonld` returns `200` with `Content-Type: application/ld+json` and `Access-Control-Allow-Origin: *`.
- `curl -s https://example.com/schemamap.xml | xmllint --noout -` parses cleanly. Every `<jsonld>` URL it lists fetches with `200`.
- Compare the `.jsonld` body to the `<script type="application/ld+json">` block on the same page — the graph (after sorting keys) should be identical.
- Fetch the page HTML and confirm both `<link rel="alternate" type="application/ld+json">` and `<link rel="schemamap">` are present in `<head>`.
- Validate the JSON-LD body with the [Schema Markup Validator](https://validator.schema.org/).
