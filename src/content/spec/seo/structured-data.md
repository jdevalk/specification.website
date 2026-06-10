---
title: "Structured data (JSON-LD)"
slug: structured-data
category: seo
summary: "Machine-readable annotations that describe the content of a page using the schema.org vocabulary. JSON-LD is the format search engines and AI agents expect."
status: recommended
order: 100
appliesTo: [all]
relatedSlugs: [breadcrumbs, heading-hierarchy, xml-sitemaps, canonical-url, schemamap, server-side-rendering]
updated: "2026-06-10T00:00:00.000Z"
sources:
  - title: "Schema.org"
    url: "https://schema.org/"
    publisher: "schema.org"
  - title: "FAQPage (FAQ) structured data"
    url: "https://developers.google.com/search/docs/appearance/structured-data/faqpage"
    publisher: "Google Search Central"
  - title: "Introduction to structured data markup in Google Search"
    url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"
    publisher: "Google Search Central"
  - title: "JSON-LD 1.1 Specification"
    url: "https://www.w3.org/TR/json-ld11/"
    publisher: "W3C"
---

## What it is

Structured data is a set of machine-readable statements that describe what a page is about, using the shared vocabulary at [schema.org](https://schema.org/). The recommended serialisation is JSON-LD: a `<script type="application/ld+json">` block inside `<head>` (or, less commonly, `<body>`).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "What is HSTS?",
  "datePublished": "2026-05-29",
  "author": {
    "@type": "Person",
    "name": "Jane Doe"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example",
    "url": "https://example.com"
  }
}
</script>
```

Microdata and RDFa are also accepted, but JSON-LD is the de facto standard because it sits separate from the visible markup.

## Why it matters

Two audiences read it heavily:

- **Search engines** use structured data to power rich results (article cards, breadcrumbs, product carousels, knowledge-panel facts). Without it, you get a plain blue link.
- **AI agents and answer engines** rely on it as the ground truth for facts they may quote. A `Person` schema with a `sameAs` linking to your verified profiles is the cleanest way to assert identity.

It is also the most stable contract between a publisher and the rest of the web. The HTML can change; the JSON-LD describes meaning.

## How to implement

Stick to a small set of well-supported types:

- **`WebSite`** — site-wide, on the home page. Include `url` and `name`, and `potentialAction` for sitelinks search if appropriate.
- **`Organization`** or **`Person`** — for the publisher and authors. Include `sameAs` arrays pointing at verified profiles.
- **`BreadcrumbList`** — on every page that has a breadcrumb trail.
- **`Article`** or **`BlogPosting`** — for articles, with `headline`, `datePublished`, `dateModified`, `author`, `image`.
- **`Product`**, **`Offer`**, **`AggregateRating`** — for e-commerce, where eligibility is strict.
- **`FAQPage`** — only when the page genuinely has a Q-and-A list visible to users. Note that Google [retired the FAQ rich result in 2026](https://developers.google.com/search/docs/appearance/structured-data/faqpage): `FAQPage` is still valid schema.org vocabulary, but it no longer produces a Google search feature, and no answer engine has confirmed it favours the markup over rendered HTML — so add it for genuine visible content, not for SERP or "GEO" gain. Never stuff fake FAQs. ([Further reading](https://joost.blog/faq-schema-cycle/) on why the format was abused into deprecation, and the proposed `FAQSection` type for Q-and-A that is a *section* of a page rather than its main entity.)

Rules:

- **Mirror what is visible on the page.** Do not declare facts in JSON-LD that the page does not state. Google calls this "out of sync" data and ignores or penalises it.
- **One graph per page is cleaner than many fragments.** Use `@graph` to nest related entities and `@id` URIs to cross-reference them.
- **Use absolute URLs** in `@id`, `url`, `image`, and `sameAs`.
- **Keep dates in ISO 8601.**
- **Validate.** Schema.org evolves; what is valid one year may be deprecated the next.

## Common mistakes

- Fabricating `aggregateRating` or `Review` to win stars. Google detects this and removes the rich result, sometimes the whole site's eligibility.
- Marking up navigation, footers, or sidebars as if they were the main content.
- Forgetting to update structured data when the page content changes.
- Multiple disagreeing `@type` declarations across plugins or templates on the same page.

## Verification

- Use the [Schema.org validator](https://validator.schema.org/) for spec conformance.
- Use Google's [Rich Results Test](https://search.google.com/test/rich-results) for eligibility.
- Check Search Console's "Enhancements" reports after deployment.
