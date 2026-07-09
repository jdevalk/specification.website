---
title: "Custom error pages (404, 500)"
slug: error-pages
category: resilience
summary: "Custom error pages must return the correct HTTP status code, explain what went wrong in plain language, and offer the user a way forward without leaking implementation details."
status: required
order: 10
appliesTo: [all]
relatedSlugs: [soft-404, monitoring-uptime, maintenance-pages, deprecation-and-sunset]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "RFC 9110 — HTTP Semantics: 404 Not Found"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found"
    publisher: "IETF"
  - title: "RFC 9110 — HTTP Semantics: 500 Internal Server Error"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error"
    publisher: "IETF"
  - title: "Google Search Central — Soft 404 errors"
    url: "https://developers.google.com/search/docs/crawling-indexing/http-network-errors#soft-404-errors"
    publisher: "Google Search Central"
  - title: "MDN — HTTP response status codes"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"
    publisher: "MDN"
---

## What it is

A custom error page is the document a server returns when it cannot fulfil a request. The two pages every site needs are the **404 Not Found** for missing resources and the **500 Internal Server Error** for unexpected failures.

A custom error page has two parts that are easy to conflate. One is the document the human reads: a styled page, matching the rest of the site, that explains what went wrong. The other is the HTTP status code in the response headers, which the human never sees but every crawler, link checker, and monitoring tool reads. Only the status code is the contract. A well-designed "page not found" that returns `200 OK` has reassured the visitor and misinformed every machine.

## Why it matters

That mismatch has a name. A "page not found" message that returns `200 OK` is a **soft 404**: search engines index the error page, link checkers see no broken links, and analytics tools count failures as normal traffic. Google explicitly treats soft 404s as a quality problem.

For humans, a generic server error page or a stack trace damages trust and may leak file paths, framework versions, or database details that help an attacker. A custom page keeps users in the site and gives them an obvious next step.

## How to implement

For a **404**:

- Return HTTP status `404`. Verify with `curl -I https://example.com/does-not-exist`.
- Set a clear heading: "We could not find that page."
- Offer a search box, a link to the homepage, and links to the most visited sections.
- Keep navigation, header, and footer so the user can carry on browsing.
- Log the request so you can find broken inbound links.

For a **500**:

- Return HTTP status `500`.
- Acknowledge the failure in one sentence. Do not show stack traces, framework names, or environment variables.
- Offer a retry, a link home, and a support contact if you have one.
- Log the underlying error server-side with a request ID and surface that ID to the user so support can correlate.

Configure both pages at the server or edge layer (Nginx `error_page`, Apache `ErrorDocument`, Cloudflare custom error pages, Netlify `_redirects` with status overrides) so they work even when the application is down.

**Localise error pages too.** On a multilingual site, the 404 a French visitor lands on should be in French — the URL prefix (`/fr/this-page-does-not-exist`) already tells the server which locale to render. Match the page's `lang` attribute, translate the heading and copy, and keep the search box and home link pointed at the same locale.

## Common mistakes

- Returning `200 OK` for a "page not found" message — the classic soft 404.
- Redirecting all unknown URLs to the homepage with a `302`. Search engines flag this as a soft 404 too.
- Exposing stack traces, SQL errors, or framework debug pages in production.
- A 404 page that loads a heavy JavaScript bundle before showing the message.
- Forgetting the 500 page entirely, so users see the default web server error.

## Verification

- `curl -I https://example.com/this-does-not-exist` returns `HTTP/2 404`.
- Force a 500 in staging and confirm the response code and that no stack trace leaks.
- Check Google Search Console under **Pages** for "Soft 404" warnings.
- Run a link checker against your site and confirm broken links surface as 404s, not 200s.
