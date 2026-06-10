---
title: "Structured data for agents"
slug: structured-data-for-agents
category: agent-readiness
summary: "JSON-LD with schema.org types gives agents typed facts about your page. It is the same markup search engines use, and agents lean on it just as heavily."
status: recommended
order: 60
appliesTo: [all]
relatedSlugs: [agent-readiness-overview, llms-txt, stable-urls, schemamap]
updated: "2026-06-10T00:00:00.000Z"
sources:
  - title: "schema.org"
    url: "https://schema.org/"
    publisher: "schema.org"
  - title: "Google — Intro to structured data"
    url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"
    publisher: "Google Search Central"
  - title: "JSON-LD 1.1"
    url: "https://www.w3.org/TR/json-ld11/"
    publisher: "W3C"
  - title: "Is It Agent Ready?"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
---

## What it is

Structured data is a machine-readable description of what a page is about, embedded in the page itself. The dominant vocabulary is [schema.org](https://schema.org/), and the recommended syntax is JSON-LD: a `<script type="application/ld+json">` block inside `<head>`.

The same markup that drives rich results in Google also helps agents understand who wrote a page, what it describes, and how it relates to other entities. Agents do not parse open prose well; they parse JSON-LD reliably.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Setting up CSP",
  "datePublished": "2026-05-12",
  "author": {
    "@type": "Person",
    "name": "Joost de Valk",
    "url": "https://example.com/about/joost"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Corp",
    "url": "https://example.com"
  }
}
</script>
```

## Why it matters

- **Disambiguation.** "Joost de Valk" is text. `Person` with a `url` is a typed identity.
- **Extraction quality.** Agents pull facts from JSON-LD with near-perfect accuracy. The same facts in prose are guessed.
- **Cross-page consistency.** A consistent `Organization` block across the site lets agents merge data into a single entity.
- **Search overlap.** What helps agents here is the same work that drives rich results and Knowledge Graph entries.

It is also one of the easiest items in this spec to verify: the markup is right there in the HTML.

## How to implement

Pick the types that match your pages. Common ones:

- `Article`, `BlogPosting`, `NewsArticle` for editorial content.
- `Product` with `Offer`, `AggregateRating`, `Review` for commerce.
- `FAQPage` and `Question` for Q&A content. (Google retired FAQ as a *search* rich result in 2026; the markup stays valid, but no answer engine has confirmed it favours the JSON-LD over the rendered Q&A, so mark up genuine visible Q&A only — not as a "GEO" lever.)
- `Person`, `Organization` for entity pages, used as nested references everywhere else.
- `Event`, `Recipe`, `HowTo`, `JobPosting`, `LocalBusiness` for vertical-specific pages.
- `BreadcrumbList` for breadcrumb trails.
- `WebSite` with `SearchAction` on the homepage.

Rules to follow:

- Use JSON-LD over Microdata or RDFa. Easier to write, easier to keep in sync.
- One block per type is fine; multiple blocks per page are also fine.
- Reuse `@id` URIs so agents can link entities across pages.
- Mirror what is visible on the page. Schema for content that does not appear violates Google's guidelines and trains agents to mistrust your markup.
- Test with the [Schema Markup Validator](https://validator.schema.org/) and Google's Rich Results Test.

## Common mistakes

- Marking up an `Article` that is actually a category page.
- Inflating `AggregateRating` with fake reviews. Both search engines and agents penalise this when caught.
- Leaving stale `datePublished` or `author` after a CMS migration.
- Forgetting to update structured data when the visible content changes.
- Using `@type: "WebPage"` for everything. Pick a specific type.

## Verification

- Run the page through [validator.schema.org](https://validator.schema.org/) and Google's Rich Results Test.
- Fetch the HTML and confirm the JSON-LD is present before JavaScript executes.
- Spot-check that the JSON-LD matches what a reader actually sees.
