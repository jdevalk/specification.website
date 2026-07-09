---
title: "Internal linking"
slug: internal-linking
category: seo
summary: "Links from one page on a site to another. The strongest signal you control for telling crawlers and AI agents what a page is about and how important it is."
status: recommended
order: 90
appliesTo: [all]
relatedSlugs: [url-structure, breadcrumbs, heading-hierarchy, xml-sitemaps, robots-txt]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "Yoast — Internal linking for SEO"
    url: "https://yoast.com/internal-linking-for-seo-why-and-how/"
    publisher: "Yoast"
  - title: "Google — Links and link building"
    url: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable"
    publisher: "Google Search Central"
  - title: "Google — Qualify your outbound links"
    url: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links"
    publisher: "Google Search Central"
  - title: "MDN — Creating hyperlinks"
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links"
    publisher: "MDN"
---

## What it is

An internal link is an `<a href>` from one URL on a site to another URL on the same site. Internal links form the graph that crawlers walk, that screen-reader users navigate, and that AI agents follow to gather context.

```html
<p>
  Read the <a href="/seo/xml-sitemaps">XML sitemap spec</a>
  to see how this page is discovered.
</p>
```

## Why it matters

Three audiences read internal links differently:

- **Crawlers** use them to discover pages and to weight importance. A page linked from the home page is considered more important than one linked only from a deep archive.
- **AI agents and answer engines** use anchor text as a strong signal for what the destination is about, often stronger than the destination's own `<title>`.
- **Humans** scan link text to decide whether the click is worth it.

Internal links are also the easiest SEO lever you fully control. External backlinks are won; internal links are decided.

## How to implement

Anchor text is the single most important variable.

- **Use descriptive anchor text.** "XML sitemap spec" is good. "Click here" tells the user and the crawler nothing.
- **Vary anchor text naturally.** Link the same destination from different pages using slightly different phrasings. Identical anchors on every link looks templated.
- **Link to the canonical URL** of the destination, not a redirect. Every link to a redirect costs a hop.
- **Link to topically related content.** Each article should link to two to five other relevant pages on the site. A page with zero outbound internal links is an orphan from the crawler's perspective even if it links inwards.
- **Avoid orphan pages.** Every URL in the sitemap should be reachable from at least one other page through normal navigation, not just from the sitemap itself.
- **Keep link depth shallow.** Pages more than three clicks from the home page get crawled and updated less often.
- **Cross-link from breadcrumbs.** They give crawlers a clean hierarchical view and let users escape upwards.
- **Open in the same tab unless there is a reason.** `target="_blank"` is for downloads and third-party flows, not internal navigation.

Avoid linking inside long lists of navigation that repeat on every page. Those count, but contextual links inside body content carry more weight per link.

## Common mistakes

- "Click here" or "read more" used as the only anchor text in the body.
- Hundreds of footer links to every page on the site. Dilutes the signal and clutters screen-reader rotors.
- Linking to staging or preview URLs by accident.
- Building the entire navigation in JavaScript with no `<a href>` fallback. Crawlers and screen readers cannot follow it.
- Pointing internal links at redirect chains created by an old migration.
- Using `rel="nofollow"` on internal links to "sculpt" ranking signals or save crawl budget. Google treats nofollow as a hint, not an instruction, so nofollowed pages can still be crawled and indexed through your sitemap or other links. It is not a crawl-control lever: to keep your own pages out of the crawl, Google's guidance is a robots.txt `disallow`, not `nofollow`.

## Verification

- Crawl the site and check the orphan-pages report. Anything in the sitemap but not reachable through links needs a contextual link added.
- Use Search Console's Links report to see the top linked-to pages. The list should match your idea of what is important.
- Check that anchor text varies and is descriptive — a crawler that exports a list of `(anchor, target)` pairs tells you a lot in one read.
