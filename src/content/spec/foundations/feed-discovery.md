---
title: "Feed discovery with rel=\"alternate\""
slug: feed-discovery
category: foundations
summary: "If your site publishes a feed — RSS, Atom, or JSON Feed — announce it in <head> with <link rel=\"alternate\">. Feed readers, agents, and browsers discover it without guessing the URL."
status: recommended
order: 110
appliesTo: [all]
relatedSlugs: [feed-hygiene, open-graph, canonical-url, machine-readable-formats, llms-txt, markdown-source-endpoints]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "HTML Living Standard — Link types: alternate"
    url: "https://html.spec.whatwg.org/multipage/links.html#link-type-alternate"
    publisher: "WHATWG"
  - title: "MDN — rel=alternate"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel#alternate"
    publisher: "MDN"
  - title: "RSS 2.0 Specification"
    url: "https://www.rssboard.org/rss-specification"
    publisher: "RSS Advisory Board"
  - title: "RFC 4287 — The Atom Syndication Format"
    url: "https://www.rfc-editor.org/rfc/rfc4287"
    publisher: "IETF"
  - title: "JSON Feed 1.1"
    url: "https://www.jsonfeed.org/version/1.1/"
    publisher: "JSON Feed"
---

## What it is

`<link rel="alternate">` in `<head>` declares an alternative representation of the current page or site — most commonly a syndication feed, but also a translated version, a print stylesheet, or, increasingly, the page's Markdown source. Feed readers, browsers, and a growing number of AI agents look for these links to subscribe, switch language, or fetch a machine-friendly version.

For feeds specifically:

```html
<head>
  <link rel="alternate" type="application/rss+xml"
        title="Example — Posts" href="/feed.xml">
  <link rel="alternate" type="application/atom+xml"
        title="Example — Posts (Atom)" href="/atom.xml">
  <link rel="alternate" type="application/feed+json"
        title="Example — Posts (JSON Feed)" href="/feed.json">
</head>
```

The browser, [feed readers](https://en.wikipedia.org/wiki/Comparison_of_feed_aggregators), and tools like the [W3C Feed Validation Service](https://validator.w3.org/feed/) pick these up automatically. The `title` attribute is what the user sees in the subscribe UI — make it specific.

## Why it matters

- **Feed readers cannot subscribe to what they cannot find.** Without `<link rel="alternate">`, the user has to know the URL. With it, every modern reader auto-discovers from the homepage or any article.
- **Browsers and OS-level readers (Safari, NetNewsWire, Reeder) use the same discovery hook.**
- **Search engines and aggregators** treat `rel="alternate"` as the canonical signal for syndication.
- **`rel="alternate"` is a multi-purpose link relation.** Pair the same pattern with `hreflang` for translated URLs (see [hreflang](/spec/i18n/hreflang/)), with `type="text/markdown"` for [Markdown source endpoints](/spec/agent-readiness/markdown-source-endpoints/), and with `media` for print or mobile alternates. Using it consistently teaches every tool that reads your site what to look for.

## How to implement

**Pick the right MIME type.** Browsers and readers branch on it.

| Format | MIME type |
|---|---|
| RSS 2.0 | `application/rss+xml` |
| Atom 1.0 | `application/atom+xml` |
| JSON Feed | `application/feed+json` |
| Markdown source | `text/markdown` |

**Include `title`** for every alternate. A reader's subscribe dialog shows the title verbatim. "RSS Feed" tells the user nothing; "Example — Engineering blog" does.

**Put the most-preferred feed first.** Some readers offer the first alternate by default if there are several.

**Use absolute URLs in the feed itself**, even if the `href` here is relative — see [machine-readable formats](/spec/agent-readiness/machine-readable-formats/).

**Site-wide vs page-specific.** A blog index links to the main feed. An individual category page can additionally link to that category's feed. An individual post does not need its own feed.

**Don't forget HTTP discovery.** Some readers also honour `Link` headers:

```http
Link: </feed.xml>; rel="alternate"; type="application/rss+xml"; title="Example — Posts"
```

Useful for non-HTML responses (e.g. an API root) where there is no `<head>`.

## Common mistakes

- Using `type="text/xml"` or `application/xml` for an RSS feed. Some readers ignore it.
- Linking to a feed that 404s, redirects, or fails validation. Run `https://validator.w3.org/feed/` on every feed URL before shipping.
- Pointing all `<link rel="alternate">` entries at the same URL "to be safe". Each entry must describe a distinct representation.
- Omitting `title` and letting the reader guess.
- Putting `rel="alternate"` on an `<a>` link in the body. It only carries discovery semantics inside `<head>`.

## Verification

- `curl -s https://example.com/ | grep -i 'rel="alternate"'` returns each declared alternate.
- Paste the homepage URL into a feed reader's "Add subscription" dialog — it should resolve to the correct feed without you typing the feed URL.
- The W3C [feed validator](https://validator.w3.org/feed/) returns no errors on the linked feed.
- View source on a per-language page and confirm `rel="alternate" hreflang="…"` siblings sit alongside any feed alternates without conflicting.
