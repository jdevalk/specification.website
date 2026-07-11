---
title: "Soft 404s"
slug: soft-404
category: seo
summary: "A page that looks like a 'not found' message to a user but returns 200 OK to a crawler. Search engines treat soft 404s as a quality problem and often refuse to index them."
status: avoid
order: 70
appliesTo: [all]
relatedSlugs: [redirects, url-structure, server-side-rendering]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "Soft 404 errors"
    url: "https://developers.google.com/search/docs/crawling-indexing/http-network-errors#soft-404-errors"
    publisher: "Google Search Central"
  - title: "RFC 9110 — 404 Not Found"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found"
    publisher: "IETF"
  - title: "MDN — HTTP response status codes"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status"
    publisher: "MDN"
---

## What it is

A soft 404 is a URL that **returns `200 OK`** but **renders a page indicating the content is missing**. The classic examples:

- An empty search results page that says "no results found" but returns 200.
- A category page with zero products that renders the chrome and a "nothing here" message.
- A single-page app that routes every unknown URL to a generic "page not found" component without changing the status code.
- A CMS that, when a slug is missing, redirects to the home page (a different bug, but classified by Google in the same family).

The HTTP semantics and the human-readable content disagree. RFC 9110 is explicit: `404 Not Found` is the correct status for a missing target. A page that says "not found" with `200` is lying to the protocol.

## Why it matters

Crawlers use the status code as the source of truth. When they see `200`, they assume the content is valid, index it, and may rank it for queries it should never appear for. When the user clicks through, they land on an empty page and bounce.

Once Google's quality systems notice the pattern, they reclassify the URL as a soft 404 and drop it from the index, often along with similar URLs across the site. Search Console's "Soft 404" report exists specifically to surface these. A site with many soft 404s gets crawled less, because the crawler stops trusting the status codes.

It is also an accessibility and user-experience problem. Screen readers and browser back-button behaviour rely on status codes being accurate.

## How to detect

- **Search Console → Pages → Why pages aren't indexed → Soft 404.** This is the authoritative list of URLs Google has reclassified.
- **Server logs.** Look for `200` responses on URLs that match patterns like `/search`, `/category/<id>`, or known SPA fallback routes, especially with very low time-on-page.
- **Crawl with a status-aware tool.** Compare the rendered DOM (for phrases like "no results", "page not found", "this product is no longer available") against the HTTP status.

## How to fix

- **Return the right status.** A missing page returns `404`. A removed page that will never come back returns `410 Gone` — both signal "do not index" and are correct.
- **For SPAs**, configure the server or edge to return the correct status before serving the fallback HTML. The same shell can render, but the response must be `404`.
- **For empty category and search pages**, decide whether the URL should exist at all. If it should, return a useful page (suggestions, related products) but keep `200`. If it should not, return `404`.
- **Do not redirect missing pages to the home page.** That is the worst of both worlds — Google treats it as a soft 404 anyway, and users get no signal about what went wrong.

## Verification

- `curl -sI https://example.com/this-does-not-exist` should return `404` or `410`, not `200` and not `302`.
- After deploying the fix, request reindexing for affected URLs in Search Console and watch the Soft 404 count fall on the next crawl cycle.
