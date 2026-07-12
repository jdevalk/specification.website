---
title: "<meta name=\"description\">"
slug: meta-description
category: foundations
summary: "A short, unique summary of the page used by search engines and social platforms as a snippet. Google may rewrite it, but a good one is rewritten less often."
status: recommended
order: 60
appliesTo: [all]
relatedSlugs: [title, open-graph, canonical-url]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "MDN — <meta>: the metadata element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta"
    publisher: "MDN"
  - title: "Google — Create good meta descriptions"
    url: "https://developers.google.com/search/docs/appearance/snippet"
    publisher: "Google Search Central"
  - title: "HTML Living Standard — Standard metadata names"
    url: "https://html.spec.whatwg.org/multipage/semantics.html#standard-metadata-names"
    publisher: "WHATWG"
---

## What it is

A meta description is a short summary of the page, declared in `<head>`:

```html
<meta name="description" content="The Website Specification is a platform-agnostic spec of what a good website must do, from doctype to security headers." />
```

The browser does not render it. It is metadata for crawlers, social platforms, and AI agents that fetch the page.

## Why it matters

The meta description does not directly affect search ranking, but it strongly affects whether the user clicks. Search engines often use it as the snippet shown beneath the title in results:

- A good description that matches the user's query gives them a reason to click.
- A missing description forces the engine to invent one from the page body, which is often less compelling.
- Google rewrites the description for about 70% of results, but matches the source more often when it is high quality.

Social platforms (Slack, Discord, iMessage, LinkedIn) use it as the preview text when no Open Graph description is set. AI agents and answer engines use it as a short canonical summary.

A description that is missing, duplicated across pages, or stuffed with keywords is a wasted asset on every result and every share.

## How to implement

Write one description per page, specific to that page:

- **120–160 characters** is the sweet spot. Google typically truncates around 920 pixels on desktop, roughly 155–160 characters.
- **Front-load the unique value.** Truncation eats the end.
- **Describe what the page is about, not the site.** A reader skimming SERPs should be able to predict what they will find.
- **Plain language.** No keyword lists, no marketing slogans, no all-caps.
- **One per page.** Two pages with the same description is a duplicate-content signal.

```html
<!-- Good -->
<meta name="description" content="The lang attribute on <html> tells screen readers, browsers, and search engines what language the page is written in. Use a valid BCP 47 tag." />

<!-- Bad: too long, generic, no useful information -->
<meta name="description" content="Welcome to our website. We are the best in the industry, providing world-class solutions for all your needs. Contact us today to learn more about what we do and how we can help your business grow in 2026." />
```

For the homepage, summarise the site as a whole. For article pages, summarise the article. For category or archive pages, describe what is in the category. Do not leave the description empty and do not auto-generate it from the first 160 characters of the body — that almost always picks up navigation or boilerplate.

If the page also sets `<meta property="og:description">`, write each separately. Social platforms prefer the OG version; search engines prefer the plain meta description. They can be similar but rarely identical, because the audience and the truncation length differ.

## Common mistakes

- Reusing the same description on every page (often pulled from a site-wide template field).
- Stuffing keywords: "cheap shoes, buy shoes, shoes online, shoe shop". Search engines ignore this and users distrust it.
- Including the page title verbatim. The snippet shows both — repeating wastes space.
- Going to 300+ characters. Anything past the truncation line is invisible.
- Ending mid-sentence because the CMS truncates blindly. Write to fit.

## Verification

- View source. `<meta name="description" content="...">` must be in `<head>` and non-empty.
- Run `document.querySelector('meta[name="description"]').content` in DevTools.
- Crawl the site and check for duplicate descriptions. Any duplication is worth fixing.
- Use a SERP preview tool to see how the snippet looks at the truncation length.
