---
title: "Descriptive link text"
slug: link-text
category: accessibility
summary: "Every link's text must describe where it goes. 'Click here' and 'read more' fail screen-reader users who scan a page by jumping from link to link."
status: required
order: 90
appliesTo: [all]
relatedSlugs: [empty-links-buttons, semantic-html]
updated: "2026-05-29T10:57:27.000Z"
sources:
  - title: "WCAG 2.4.4 — Link Purpose (In Context) (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html"
    publisher: "W3C"
  - title: "WCAG 2.4.9 — Link Purpose (Link Only) (Level AAA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-link-only.html"
    publisher: "W3C"
  - title: "Accessibility Checker — Ambiguous Anchor Text"
    url: "https://equalizedigital.com/accessibility-checker/ambiguous-anchor-text/"
    publisher: "Equalize Digital"
  - title: "WP Accessibility — Content and images: Links"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
---

## What it is

Link text is the visible (or accessible) name of a link — the bit screen readers announce and the bit a sighted user scans for. WCAG 2.4.4 (Level A) requires that the purpose of each link is determinable from the link text together with its immediate context. The stricter 2.4.9 (AAA) requires the link text alone to be enough.

## Why it matters

Screen-reader users routinely call up a list of all links on the page to navigate. If that list is "click here, click here, read more, read more, learn more", the page has no usable structure. Sighted users skim links too — descriptive link text helps everyone. Search engines also use link text as one of the strongest signals of what the target page is about.

## How to implement

Write link text that names the destination or the action:

```html
<!-- Don't -->
<p>To read our refund policy, <a href="/refunds">click here</a>.</p>

<!-- Do -->
<p>Read our <a href="/refunds">refund policy</a>.</p>
```

For repeated "Read more" patterns on a card list, give each link a unique accessible name — the card heading is the easiest source:

```html
<article>
  <h2 id="post-42">How we cut bundle size by 60%</h2>
  <p>…</p>
  <a href="/blog/bundle-size" aria-labelledby="post-42">Read more</a>
</article>
```

Or include the title visually-hidden inside the link:

```html
<a href="/blog/bundle-size">
  Read more
  <span class="visually-hidden"> about cutting bundle size by 60%</span>
</a>
```

Further rules:

- **Don't put the URL in the link text** ("visit https://example.com/very/long/path") — screen readers spell it out character by character.
- **Don't repeat the destination twice** in the same paragraph with two different links.
- **Different link text for different destinations.** Two links named "Documentation" pointing at different pages are a fail.
- **Same link text for the same destination.** Two different names for the same URL is confusing.
- **Indicate file type and language changes** when relevant: "Annual report (PDF, 2.4 MB)".

## Common mistakes

- "Click here", "read more", "learn more", "here", with no context in the link itself.
- Image links with no alt text — the screen reader falls back to the URL.
- Identical link text on every card in a list, with no `aria-label` to disambiguate.
- A long sentence wrapped in `<a>` so the entire paragraph becomes the link text.
- Whitespace-only links produced by CSS background images.

## Verification

- Use a screen reader's link-list shortcut. Every entry should make sense out of context.
- Run an automated checker; "Ambiguous Anchor Text" is a standard rule.
- Read the page through a print stylesheet that lists every link — it should still be navigable.
