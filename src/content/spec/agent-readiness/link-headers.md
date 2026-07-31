---
title: "HTTP Link headers for discovery"
slug: link-headers
category: agent-readiness
summary: "Use the HTTP Link header to advertise machine-readable resources — llms.txt, sitemap, api-catalog, RSS — directly in the response. Agents that never parse your HTML can still find what they need."
status: recommended
order: 75
appliesTo: [all]
relatedSlugs: [llms-txt, llms-full-txt, markdown-source-endpoints, machine-readable-formats, agent-readiness-overview, feed-discovery, websub, agent-skills-discovery, a2a-agent-cards, schemamap]
updated: "2026-05-29T14:13:42.000Z"
sources:
  - title: "RFC 8288 — Web Linking"
    url: "https://www.rfc-editor.org/rfc/rfc8288"
    publisher: "IETF"
  - title: "RFC 9727 — Publishing Organisation API Information"
    url: "https://www.rfc-editor.org/rfc/rfc9727"
    publisher: "IETF"
  - title: "RFC 9264 — Linkset: Media Types and a Link Relation Type for Link Sets"
    url: "https://www.rfc-editor.org/rfc/rfc9264"
    publisher: "IETF"
  - title: "IANA — Link Relations Registry"
    url: "https://www.iana.org/assignments/link-relations/link-relations.xhtml"
    publisher: "IANA"
  - title: "Is It Agent Ready? — Link headers check"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
---

## What it is

The `Link` HTTP response header points the client at related resources. It is the same mechanism as `<link rel="…">` in HTML — same syntax, same registered relation types — except it travels with every response, including responses that have no HTML body (a JSON endpoint, a PDF, a 204).

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Link: </llms.txt>; rel="describedby"; type="text/markdown"; title="Site index for LLMs",
      </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json",
      </sitemap-index.xml>; rel="sitemap"; type="application/xml",
      </rss.xml>; rel="alternate"; type="application/rss+xml"
```

Multiple links may be sent as comma-separated entries inside a single `Link` header (the form above) or as several `Link` headers. Both are valid per [RFC 8288 §3](https://www.rfc-editor.org/rfc/rfc8288#section-3).

## Why it matters

- **HTML-free discovery.** A crawler fetching `HEAD /` sees every machine-readable surface without downloading or parsing the body.
- **Universal.** Works on any response — `application/json`, `image/png`, a 304 Not Modified. There is no `<head>` on a JSON endpoint to put `<link>` tags in.
- **Cache-friendly.** A CDN can route to alternative representations purely from the `Link` header.
- **Required by agent-readiness validators.** [isitagentready.com](https://isitagentready.com/) explicitly checks for it on the homepage. Failing this check is a fail of the whole "discoverability" group.

## How to implement

**Pick registered relation types.** The [IANA Link Relations Registry](https://www.iana.org/assignments/link-relations/link-relations.xhtml) is the source of truth. Inventing your own is a bad signal. The relations a content site usually wants:

| `rel` | Purpose |
|---|---|
| `describedby` | A machine-readable description of this resource. Right for `llms.txt`. |
| `alternate` | An alternative representation of the same content (different format or language). Right for `.md` siblings, RSS, Atom, JSON Feed. |
| `api-catalog` | RFC 9727 — the location of `/.well-known/api-catalog`. |
| `sitemap` | The XML sitemap (or sitemap index). |
| `service-desc` / `service-doc` | A machine-readable / human-readable description of an API. |
| `security` | The `security.txt` policy. |
| `author` | Author resource. |
| `license` | Licence terms. |

**Send absolute or root-relative URLs.** Both are valid in `Link`; prefer root-relative for portability across protocols and ports.

**Include `type` and `title`.** They are optional in the header but make the link self-describing without an extra fetch.

**Ship on the homepage at minimum.** If you can afford it, ship on every response — the discovery benefit compounds when the agent enters mid-site.

**Edge configuration is the right layer.** Set `Link` headers at the CDN or reverse proxy, not in application code, so non-HTML responses get them too. On Cloudflare Pages this is one line in [`_headers`](https://developers.cloudflare.com/pages/configuration/headers/). On nginx it is `add_header Link …;`. On Vercel and Netlify it is config-driven.

## Common mistakes

- Sending `Link` only on HTML responses. Defeats the "HTML-free" point — agents looking at your `/api/users.json` get nothing.
- Inventing a custom `rel`. Crawlers ignore it. Use IANA-registered relations only.
- Wrapping URLs in quotes. Per RFC 8288, the URI goes inside `<>` angle brackets, not quotes.
- Forgetting to comma-separate when listing multiple links in one header. Without the comma, parsers see one malformed entry.
- Sending `Link` headers that contradict the HTML `<link rel>` entries. The headers and the HTML should be consistent — they describe the same site.

## Verification

- `curl -sI https://example.com/ | grep -i ^link` — lists every advertised relation in one shot.
- [Is It Agent Ready?](https://isitagentready.com/) flips `discoverability.linkHeaders` to `pass`.
- [Web Linking validator](https://datatracker.ietf.org/doc/html/rfc8288) — parse-and-render tools spot syntactic errors.
- Cross-check against `<head>`: every `rel` in the HTML should have an equivalent in the headers.
