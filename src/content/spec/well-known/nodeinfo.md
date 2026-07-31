---
title: "/.well-known/nodeinfo"
slug: nodeinfo
category: well-known
summary: "A discovery URI for federated platforms. It returns links to NodeInfo documents that describe the software, version and basic statistics of a server."
status: optional
order: 70
appliesTo: [all]
relatedSlugs: [well-known-overview, webfinger]
updated: "2026-07-29T00:00:00.000Z"
sources:
  - title: "NodeInfo — Protocol overview"
    url: "https://nodeinfo.diaspora.software/"
    publisher: "NodeInfo project"
  - title: "NodeInfo Protocol specification"
    url: "https://nodeinfo.diaspora.software/protocol.html"
    publisher: "NodeInfo project"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

NodeInfo is a small, two-step discovery mechanism for federated and decentralised servers. A client first fetches `/.well-known/nodeinfo`, which returns a list of links pointing at versioned NodeInfo documents (typically `/nodeinfo/2.0` or `/nodeinfo/2.1`). Those documents then describe what software the server runs, which protocols it speaks, and basic statistics about users and posts.

The protocol started in Diaspora and is now used across Mastodon, PeerTube, Pleroma, Misskey, Friendica, GoToSocial, Lemmy, Funkwhale and most of the rest of the Fediverse.

## Why it matters

- **Server identification.** Crawlers, statistics sites (such as fediverse.observer), and admin tools use NodeInfo to recognise what platform a domain runs without screen-scraping HTML.
- **Federation health.** Admins can quickly check whether a peer is reachable, what version it runs, and whether it supports the protocols their server speaks.
- **Compatibility hints.** Clients can adapt to platform-specific quirks once they know whether they are talking to Mastodon, Misskey or something else.

If your site is not a federated server, you do not need NodeInfo.

## How to implement

Serve `/.well-known/nodeinfo` as JSON. The body lists one or more `rel`/`href` pairs that point at the actual NodeInfo documents.

```json
{
  "links": [
    {
      "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
      "href": "https://example.com/nodeinfo/2.0"
    },
    {
      "rel": "http://nodeinfo.diaspora.software/ns/schema/2.1",
      "href": "https://example.com/nodeinfo/2.1"
    }
  ]
}
```

Then serve the actual NodeInfo document at the linked URL:

```json
{
  "version": "2.1",
  "software": {
    "name": "examplesocial",
    "version": "1.4.2",
    "repository": "https://github.com/example/social"
  },
  "protocols": ["activitypub"],
  "services": { "inbound": [], "outbound": [] },
  "openRegistrations": false,
  "usage": {
    "users": { "total": 142, "activeMonth": 38, "activeHalfyear": 95 },
    "localPosts": 3120
  },
  "metadata": {}
}
```

Rules:

- Serve over **HTTPS** with `Content-Type: application/json`.
- Set permissive CORS (`Access-Control-Allow-Origin: *`) so browser-based dashboards can read it.
- Cache for **minutes**, not days — stats change.
- Support at least one of the current schema versions (2.0 or 2.1). Older versions (1.0, 1.1) are deprecated.

## Common mistakes

- Returning the NodeInfo document directly from `/.well-known/nodeinfo`. The well-known URI is a pointer; the document lives elsewhere.
- Returning HTML or `text/plain` because the response was wrapped by a framework.
- Hard-coding `openRegistrations: true` when registrations are actually closed, breaking sign-up flows from third-party clients.
- Forgetting to update `software.version` on deploy, so peer servers think you are running a year-old release.

## Verification

```
curl -s https://example.com/.well-known/nodeinfo | jq .
curl -s https://example.com/nodeinfo/2.1 | jq .
```

Cross-check on a statistics site (such as fediverse.observer) that your server appears with the correct software name and version.
