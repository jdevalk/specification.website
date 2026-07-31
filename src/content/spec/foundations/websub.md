---
title: "WebSub — push notification for feeds"
slug: websub
category: foundations
summary: "If you publish a feed, advertise a WebSub hub with rel=\"hub\" and rel=\"self\" so subscribers are pushed each update instead of polling for it. Cuts latency to seconds and removes most of the crawl traffic your feed attracts."
status: optional
order: 130
appliesTo: [all]
relatedSlugs: [feed-discovery, feed-hygiene, canonical-url, link-headers]
updated: "2026-07-30T00:00:00.000Z"
sources:
  - title: "WebSub — W3C Recommendation, 2 June 2026"
    url: "https://www.w3.org/TR/websub/"
    publisher: "W3C"
  - title: "IANA Link Relation Types registry — hub, self"
    url: "https://www.iana.org/assignments/link-relations/link-relations.xhtml"
    publisher: "IANA"
  - title: "RFC 8288 — Web Linking"
    url: "https://www.rfc-editor.org/rfc/rfc8288"
    publisher: "IETF"
---

## What it is

WebSub is the standard way to turn a pull feed into a push feed. It is a W3C Recommendation — republished on 2 June 2026 — and it descends from PubSubHubbub, whose wire format it keeps compatible.

Three parties are involved. The **publisher** is you: you own the topic URL, normally a [feed](/spec/foundations/feed-discovery/). The **hub** is a separate service that fans out notifications. The **subscriber** is a feed reader, an aggregator, or an agent that wants your updates. When you publish, you tell the hub; the hub POSTs the new content to every subscriber that has registered a callback.

The part that lives on your site is small: two link relations. `rel="hub"` names a hub that will distribute your topic; `rel="self"` names the topic's own canonical URL. Both are registered at IANA and can travel either as HTTP `Link` headers or as elements inside the document or feed. Subscribers must check the [`Link` headers](/spec/agent-readiness/link-headers/) first and only fall back to embedded elements.

Which makes it worth saying plainly: **`rel="hub"` is an advertisement, not a delivery mechanism.** Adding the link relation does not make updates arrive anywhere. It tells a subscriber where to go and negotiate; the actual delivery only happens because a hub was notified that the topic changed, and because that subscriber renewed its lease. A feed with a `rel="hub"` link and nothing behind it is a feed that still gets polled — the link just makes the failure invisible.

## Why it matters

Polling is how feeds are consumed by default, and it is wasteful in both directions. A reader that polls hourly discovers your post an average of thirty minutes late; one that polls daily can be twenty-three hours behind. Meanwhile every subscriber fetches the same unchanged feed over and over. On a feed with real distribution, that traffic dominates — most requests to a feed URL are polls that return nothing new.

WebSub inverts it. Latency drops to however long the hub takes to fan out, usually seconds. The polling disappears, because subscribers no longer need to guess when to look. For anything time-sensitive — security advisories, status updates, release announcements, breaking news — that difference is the whole point.

It also matters for agents and aggregators specifically. An agent that wants to stay current on your site has two options: poll politely and be slightly stale, or subscribe and be notified. The second costs you almost nothing and is strictly better for both sides.

## How to implement

**1. Advertise the hub and the topic.** Send both relations on the feed response:

```http
Link: <https://hub.example.com/>; rel="hub"
Link: <https://example.com/feed.xml>; rel="self"
```

Or, inside an Atom feed:

```xml
<link rel="hub" href="https://hub.example.com/" />
<link rel="self" href="https://example.com/feed.xml" />
```

`rel="self"` must be the topic's canonical URL — the one you would give in a [`rel="canonical"`](/spec/foundations/canonical-url/) — because that is the identity subscribers key their subscription on. If it disagrees with the URL you actually serve the feed at, subscriptions land on the wrong topic. In HTML, put the link elements in `<head>`; the spec is explicit that `<body>` is unsafe, because injected markup could redirect subscriptions to an attacker's hub.

**2. Notify the hub when you publish.** This is the step people forget. The hub has no way to know your feed changed unless you tell it, so your publish flow must ping the hub on every update. A hub that is never pinged delivers nothing.

**3. Run or choose a hub.** You can operate one, or point at a hosted hub. Either way the hub is a real service with obligations: it verifies every subscription with a `hub.challenge` handshake, enforces lease expiry via `hub.lease_seconds`, and must not issue perpetual leases. If a subscriber supplied a `hub.secret`, the hub signs each delivery with `X-Hub-Signature`, in the form `method=signature` — `sha256`, `sha384`, and `sha512` are the algorithms to use; `sha1` is still recognised but has no business in new deployments.

**4. Keep the feed correct anyway.** WebSub is additive. Subscribers that do not implement it keep polling, so [feed hygiene](/spec/foundations/feed-hygiene/) — stable GUIDs, valid markup, correct `Last-Modified` and `ETag` — still governs how well those clients behave. The push path carries the same feed body, so a malformed feed is malformed for everyone.

## Common mistakes

- Advertising `rel="hub"` without pinging the hub on publish. Nothing is ever distributed, and nothing errors.
- Omitting `rel="self"`, or pointing it at a redirect or a query-string variant of the feed URL. Subscribers cannot agree with each other on what the topic is.
- Putting the discovery links in `<body>` instead of `<head>`.
- Treating the hub as a cache or CDN for the feed. It is a fan-out relay; it does not serve your feed to readers, and it does not remove your obligation to serve it yourself.
- Reading `X-Hub-Signature` as a publisher signature. It is keyed on the secret a *subscriber* chose, so it authenticates the hub to that one subscriber — it says nothing to anyone else about who wrote the content.
- Assuming a subscription is permanent. Leases expire by design; a subscriber that never re-subscribes silently stops receiving updates.

## Verification

- `curl -sI https://example.com/feed.xml | grep -i '^link:'` and confirm both `rel="hub"` and `rel="self"` are present.
- Check that the `rel="self"` URL, fetched directly, returns the feed with a 200 — not a redirect.
- Publish something and watch your hub's delivery log. If the hub records no ping, the publish flow is not wired up.
- Subscribe a test callback to your own topic and confirm you receive the intent-verification GET, echo the `hub.challenge`, and then receive a content POST on the next publish.
