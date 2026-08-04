---
title: "Maintenance pages and 503"
slug: maintenance-pages
category: resilience
summary: "When the site is intentionally offline, return HTTP 503 with a Retry-After header and a page that tells users what is happening and when to come back."
status: recommended
order: 20
appliesTo: [all]
relatedSlugs: [error-pages, monitoring-uptime, graceful-degradation, robots-for-ai-crawlers]
updated: "2026-08-04T00:00:00.000Z"
sources:
  - title: "RFC 9110 — HTTP Semantics: 503 Service Unavailable"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable"
    publisher: "IETF"
  - title: "RFC 9110 — HTTP Semantics: Retry-After"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after"
    publisher: "IETF"
  - title: "RFC 6585 — Additional HTTP Status Codes: 429 Too Many Requests"
    url: "https://www.rfc-editor.org/rfc/rfc6585#section-4"
    publisher: "IETF"
  - title: "Google Search Central — Temporarily pause or disable a website"
    url: "https://developers.google.com/search/docs/crawling-indexing/pause-online-business"
    publisher: "Google Search Central"
---

## What it is

A maintenance page is what visitors see during planned downtime — a database migration, a major deploy, a hardware swap. The page itself is only half of the requirement. The other half is the HTTP response: status `503 Service Unavailable` with a `Retry-After` header that tells crawlers and clients when to come back.

```
HTTP/2 503
Retry-After: 3600
Content-Type: text/html; charset=utf-8
```

## Why it matters

A maintenance page that returns `200 OK` is indistinguishable from your real site to a search engine. Googlebot will happily index "We're back in an hour" as the content of every URL on your domain. If the outage lasts a day, you can wake up to a site that ranks for nothing.

`503` is the explicit signal that the server is unavailable on purpose and that the condition is temporary. Crawlers slow down or pause. CDNs may serve stale content from cache. Monitoring tools record an outage instead of a successful response. Browsers and SDKs that respect `Retry-After` back off cleanly.

## How to implement

Configure the edge or load balancer to return the maintenance response, not the application itself — the application is the thing you're taking down.

- Status code: `503`.
- `Retry-After` header: either an integer number of seconds (`Retry-After: 1800`) or an HTTP date (`Retry-After: Wed, 29 May 2026 14:00:00 GMT`). Use the form that matches your confidence in the ETA.
- Body: a single HTML page that loads no external dependencies, no analytics, and no fonts from CDNs that may also be down.
- Tell the user: what is happening, when you expect to be back, and where to get updates (status page, social account).

Most edge providers (Cloudflare, Fastly, Nginx, HAProxy) can serve a static maintenance page with a 503 from a single rule. Allow an admin IP through so you can verify the deploy before lifting the block.

```nginx
# Nginx example
if (-f /etc/nginx/maintenance.flag) {
  return 503;
}
error_page 503 @maintenance;
location @maintenance {
  root /var/www/maintenance;
  rewrite ^.*$ /index.html break;
  add_header Retry-After 1800 always;
}
```

## Rate limiting: 429, not 503

`503` is for the whole site being down. When you are throttling a *single* client that is sending too many requests, the correct status is `429 Too Many Requests` (RFC 6585), and it takes the same `Retry-After` header:

```
HTTP/2 429
Retry-After: 60
```

The distinction matters for crawlers and AI agents. A 429 with `Retry-After` says "you specifically are going too fast — slow down and come back"; a well-behaved bot backs off to the interval you name and keeps its place. A `503`, a silent connection drop, or a `200` with an error body all teach it the wrong lesson: that the whole site is down, or that the throttled response was real content. If you rate-limit crawlers (see [controlling AI crawlers](/spec/agent-readiness/robots-for-ai-crawlers/)), do it with 429 and an honest `Retry-After`, not a block that looks like an outage.

This is an edge or origin behaviour — a static host does not emit it on its own. Configure it where the throttling happens (your CDN's rate-limiting rules, a reverse proxy, or the application).

## Common mistakes

- Returning `200 OK` with a "we'll be back soon" message. Search engines treat this as the new content of every URL.
- Throttling a busy client with a `503` or a silent drop instead of a `429` with `Retry-After`.
- Returning `503` with no `Retry-After`. Clients have to guess.
- Loading third-party scripts (analytics, chat widgets, fonts) on the maintenance page. Most of them will fail and the page may not render.
- Forgetting to remove the maintenance flag after the deploy and leaving the site at 503 for hours.

## Verification

- `curl -I https://example.com/` returns `HTTP/2 503` and a `Retry-After` header.
- A rate-limited client receives `HTTP/2 429` with `Retry-After`, not a `503` or a silent drop.
- The page renders without the application backend running.
- Status page (if you have one) shows the planned window.
