---
title: "Breadcrumbs"
slug: breadcrumbs
category: seo
summary: "A short trail showing the page's position in the site hierarchy. Visible in the UI for users, marked up as BreadcrumbList JSON-LD for search engines."
status: recommended
order: 110
appliesTo: [all]
relatedSlugs: [structured-data, internal-linking, url-structure, heading-hierarchy]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "Schema.org — BreadcrumbList"
    url: "https://schema.org/BreadcrumbList"
    publisher: "schema.org"
  - title: "Breadcrumb structured data"
    url: "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb"
    publisher: "Google Search Central"
  - title: "ARIA Authoring Practices — Breadcrumb"
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/"
    publisher: "W3C WAI"
  - title: "MDN — aria-current"
    url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current"
    publisher: "MDN"
---

## What it is

Breadcrumbs are a short, one-line navigation trail showing the path from the site root to the current page. They serve users (an at-a-glance "where am I"), assistive technology (a labelled landmark to skip to or escape from), and search engines (a hierarchy signal that often replaces the URL in search results).

The visible markup is a `<nav>` containing an ordered list of links, with the current page marked using `aria-current`. The same trail is also serialised as JSON-LD `BreadcrumbList` for search engines.

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/seo">SEO</a></li>
    <li><a href="/seo/breadcrumbs" aria-current="page">Breadcrumbs</a></li>
  </ol>
</nav>
```

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",        "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "SEO",         "item": "https://example.com/seo" },
    { "@type": "ListItem", "position": 3, "name": "Breadcrumbs", "item": "https://example.com/seo/breadcrumbs" }
  ]
}
</script>
```

## Why it matters

- **Search engines** display breadcrumb trails under the page title in results instead of the raw URL. A clean `Home › SEO › Breadcrumbs` reads better than `example.com/seo/breadcrumbs/`.
- **Screen-reader users** rely on the labelled `<nav>` landmark to find the trail in one keystroke.
- **Sighted users** use breadcrumbs to escape upwards, especially when they arrived from a search result deep in the site.
- **AI agents** parse the JSON-LD to understand the site's taxonomy, which helps them answer questions like "what is the parent topic of this page".

## How to implement

The pattern is small and stable; do it once and reuse it.

- **Wrap the trail in `<nav aria-label="Breadcrumb">`.** The label is what screen readers announce. "Breadcrumb" is the conventional value.
- **Use an ordered list (`<ol>`).** Order is part of the meaning.
- **Each item except the last is a link to its level.** The last item is the current page, marked `aria-current="page"`. It should not be a link.
- **Match the visible trail to the JSON-LD exactly.** Same items, same order, same names, same URLs.
- **Use a CSS separator (`::before`), not a literal `›` character in the markup.** Avoids the separator being announced as part of the link.
- **Anchor breadcrumbs at "Home".** Some sites omit Home, but including it makes the JSON-LD more useful and matches what Google displays.
- **Keep them short.** Three to five levels is normal; ten levels suggests the URL structure is too deep.

For dynamic sites, derive the trail from the URL or the page's place in the navigation tree, not from a hand-maintained per-page list.

## Common mistakes

- Visible trail and JSON-LD list disagree.
- The current-page item is a link to itself.
- `aria-label` missing or set to something unhelpful like "Navigation".
- Breadcrumbs based on the user's click path ("you came from Search") rather than the site hierarchy. That is "history", not "breadcrumbs".
- Adding a separator character inside the `<a>` text, so the link reads "Home ›".

## Verification

- Tab through with a screen reader. The trail should be announced as "Breadcrumb navigation, list with 3 items".
- Use the Rich Results Test to confirm Google recognises the `BreadcrumbList`.
- Visually check that the current-page item is not clickable.
