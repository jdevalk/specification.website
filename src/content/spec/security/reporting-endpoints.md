---
title: "Reporting API (Reporting-Endpoints)"
slug: reporting-endpoints
category: security
summary: "A response header that names HTTP endpoints to which the browser POSTs structured violation reports — CSP and COOP breaches, permissions-policy violations, deprecations, interventions, and crashes — so you learn what is breaking in the field."
status: recommended
order: 35
appliesTo: [all]
relatedSlugs: [content-security-policy, cross-origin-isolation, permissions-policy, monitoring-uptime, trusted-types]
updated: "2026-06-16T00:00:00.000Z"
sources:
  - title: "Reporting API"
    url: "https://w3c.github.io/reporting/"
    publisher: "W3C"
  - title: "MDN — Reporting-Endpoints header"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Reporting-Endpoints"
    publisher: "MDN"
  - title: "MDN — Reporting API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API"
    publisher: "MDN"
  - title: "Monitor your web application with the Reporting API"
    url: "https://developer.chrome.com/docs/capabilities/web-apis/reporting-api"
    publisher: "Chrome for Developers"
---

## What it is

The **Reporting API** is a W3C standard that lets a site collect structured reports the browser generates while rendering a page — things the user never sees and that rarely surface in server logs. You declare named endpoints with the `Reporting-Endpoints` response header, and the browser POSTs batched JSON reports to them.

```http
Reporting-Endpoints: default="https://example.com/reports", csp-endpoint="https://example.com/csp"
```

Each name maps to a URL. Other headers then reference a name: a Content Security Policy points its `report-to` directive at one endpoint, while reports that have no header of their own — deprecations, browser interventions, and crashes — go to the endpoint named `default`.

The Reporting API supersedes the older, never-standardised `Report-To` header and the CSP-only `report-uri` directive. `Reporting-Endpoints` uses a simpler structured-header syntax and is the form to use today.

## Why it matters

A strict Content Security Policy, cross-origin isolation, or a tight Permissions-Policy can break a page in ways that are invisible from the server: a blocked inline script, a third-party widget that no longer loads, an embed that violates COOP. Without reporting, you discover these only when a user complains. With a reporting endpoint wired up, the browser tells you the moment a real visitor hits the problem — which directive fired, on which URL, from which source.

It is also the only channel for several report types that exist nowhere else: **deprecation** reports warn you that an API your site depends on is being removed from browsers, and **crash** and **intervention** reports tell you when the browser killed or throttled your page. That turns a strict policy from a deploy-and-pray gamble into something you can roll out behind report-only mode, watch, and tighten with evidence.

This site ships `Reporting-Endpoints: csp-endpoint="/reports", default="/reports"` and wires its Content Security Policy to it with `report-to csp-endpoint` — see [`public/_headers`](https://github.com/jdevalk/specification.website/blob/main/public/_headers). A small same-origin collector ([`functions/reports.ts`](https://github.com/jdevalk/specification.website/blob/main/functions/reports.ts)) records the aggregate report type, path, and directive — no IP address, no cookies, no URL query strings.

## How to implement

1. Send `Reporting-Endpoints` on HTML responses, naming at least a `default` endpoint and any policy-specific ones you need.
2. Point each policy at its endpoint — e.g. add `report-to csp-endpoint` to your CSP, and ship it first as `Content-Security-Policy-Report-Only` so violations are reported without blocking.
3. Stand up a collector that accepts `POST` with `Content-Type: application/reports+json` and stores the batched array of reports.
4. Watch the stream, fix the genuine violations, then switch the policy from report-only to enforcing.

## Common mistakes

- **Using the deprecated `Report-To` header or CSP `report-uri`.** Migrate to `Reporting-Endpoints` plus `report-to`.
- **Forgetting the `default` endpoint.** Deprecation, intervention, and crash reports have no directive of their own and are silently dropped without it.
- **Expecting reports cross-origin without CORS.** A collector on another origin must answer the browser's preflight.
- **Enforcing a new policy before reading its reports.** Run report-only first.

## Verification

- `curl -sI https://example.com | grep -i reporting-endpoints` confirms the header is present and well-formed.
- Trigger a deliberate CSP violation in DevTools and confirm a `POST` arrives at your collector with a `csp-violation` report body.
- Check the **Application → Reporting API** panel (Chromium) to see queued and delivered reports per document.
