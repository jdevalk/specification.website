---
title: "Feed content hygiene"
slug: feed-hygiene
category: foundations
summary: "If you publish a feed, ship it well-formed. Identify the feed inside itself with atom:link rel=\"self\", give every item a stable guid, declare an update cadence with the Syndication module, and validate before deploy."
status: recommended
order: 120
appliesTo: [all]
relatedSlugs: [feed-discovery, websub, canonical-url, machine-readable-formats, llms-txt]
updated: "2026-05-29T15:19:28.000Z"
sources:
  - title: "RSS 2.0 Specification"
    url: "https://www.rssboard.org/rss-specification"
    publisher: "RSS Advisory Board"
  - title: "RSS Best Practices Profile"
    url: "https://www.rssboard.org/rss-profile"
    publisher: "RSS Advisory Board"
  - title: "RFC 4287 — The Atom Syndication Format"
    url: "https://www.rfc-editor.org/rfc/rfc4287"
    publisher: "IETF"
  - title: "RDF Site Summary 1.0 Modules: Syndication"
    url: "https://web.resource.org/rss/1.0/modules/syndication/"
    publisher: "RSS-DEV Working Group"
  - title: "RFC 5005 — Feed Paging and Archiving"
    url: "https://www.rfc-editor.org/rfc/rfc5005"
    publisher: "IETF"
  - title: "W3C Feed Validation Service"
    url: "https://validator.w3.org/feed/"
    publisher: "W3C"
---

## What it is

[`Feed discovery`](/spec/foundations/feed-discovery/) tells the world *where* your feed is. Feed hygiene is about whether the feed itself is well-formed once they fetch it. Aggregators, feed readers, and AI agents all behave better — and waste fewer of your bytes — when the channel identifies itself, every item has a stable identifier, and the publishing cadence is declared.

The conventions are old and stable. The base specs are RSS 2.0 (RSS Advisory Board), RFC 4287 (Atom), and JSON Feed 1.1. The practical layer — what makes a feed actually portable — lives in the *RSS Best Practices Profile*, which both the [W3C Feed Validation Service](https://validator.w3.org/feed/) and the RSS Validator use to flag warnings.

## Why it matters

- **Self-identification (`atom:link rel="self"`)** makes a feed portable. If the feed is mirrored, cached, or sent to you by a friend, every reader can still find the canonical subscription URL.
- **Stable, unique `<guid>`** lets aggregators detect updates without re-displaying old items. Get this wrong and every refresh re-floods subscribers with duplicates.
- **`sy:updatePeriod` and `sy:updateFrequency`** tell polite aggregators how often to poll. A weekly blog declaring `daily` cadence wastes bandwidth on both sides; declaring `hourly` invites unnecessary load.
- **`<lastBuildDate>`** lets a reader skip parsing when nothing has changed.
- **Paging headers (RFC 5005)** keep archive feeds usable. Without `rel="next"`/`rel="prev"`, anything past the first page is invisible to readers that follow links.

The cost of getting these right is one-time and small. The cost of getting them wrong shows up as duplicate posts in every reader, weeks of stale entries, or 100× more polling traffic than you intended.

## How to implement

Declare the Atom and Syndication namespaces on the `<rss>` root, then ship a self-link, channel metadata, and per-item GUIDs:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>Example — Posts</title>
    <link>https://example.com/</link>
    <description>Engineering writing from the Example team.</description>
    <language>en-GB</language>

    <atom:link href="https://example.com/feed.xml"
               rel="self" type="application/rss+xml" />
    <lastBuildDate>Mon, 27 May 2026 09:00:00 GMT</lastBuildDate>
    <sy:updatePeriod>daily</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>

    <item>
      <title>Shipping the new search</title>
      <link>https://example.com/blog/new-search/</link>
      <guid isPermaLink="true">https://example.com/blog/new-search/</guid>
      <pubDate>Mon, 27 May 2026 09:00:00 GMT</pubDate>
      <description>Why we rebuilt search on Pagefind.</description>
    </item>
  </channel>
</rss>
```

Key points:

- **`atom:link rel="self"`** must point at the canonical URL of the feed itself. Both feed validators flag its absence as a warning.
- **`<guid isPermaLink="true">`** is the simplest correct form when the URL never changes. If the URL is unstable, use `isPermaLink="false"` with a tag URI: `<guid isPermaLink="false">tag:example.com,2026:post/123</guid>`. Once chosen, **the GUID for an item must never change** — that is the identifier readers key off.
- **`sy:updatePeriod`** accepts `hourly`, `daily`, `weekly`, `monthly`, `yearly`. `sy:updateFrequency` is a positive integer (count per period). A site updating twice a day declares `<sy:updatePeriod>daily</sy:updatePeriod><sy:updateFrequency>2</sy:updateFrequency>`.
- **Dates** use RFC 822 format (`Mon, 27 May 2026 09:00:00 GMT`). Atom uses RFC 3339.
- **For archive feeds**, add RFC 5005 paging:

```xml
<atom:link rel="next" href="https://example.com/feed.xml?page=2" />
<atom:link rel="last" href="https://example.com/feed.xml?page=14" />
```

Atom and JSON Feed have direct equivalents for all of the above — JSON Feed's `feed_url` is the self-link, and its `id` per item is the GUID.

## Common mistakes

- Missing `atom:link rel="self"`. Both validators warn on it, and most production feeds in the wild still don't ship it.
- Generating a fresh GUID per build instead of per item. Every reader re-floods subscribers on every deploy.
- Mismatched dates — `pubDate` newer than `lastBuildDate`, or per-item timestamps in the future. Some aggregators silently drop the item.
- Declaring a cadence (`<sy:updatePeriod>hourly</sy:updatePeriod>`) the site does not actually meet. Aggregators back off if the feed is stale relative to the declared cadence.
- Putting absolute URLs in `<link>` but relative URLs in `<atom:link rel="self">`. Both should be absolute.
- Forgetting `xmlns:atom` or `xmlns:sy` namespace declarations. The elements are then technically invalid in RSS 2.0.

## Verification

- Paste the feed URL into [validator.w3.org/feed](https://validator.w3.org/feed/) — expect a clean pass.
- Paste it into [rssboard.org/rss-validator](https://www.rssboard.org/rss-validator/) — the second-opinion validator catches things the W3C one misses.
- `curl -s https://example.com/feed.xml | grep -i 'rel="self"'` should return your self-link.
- Subscribe in two different readers (NetNewsWire and a web reader). Trigger a deploy that does not change content. Confirm no item duplicates appear in either reader.
- Inspect a few items: each `<guid>` should be stable across builds for the same post.
