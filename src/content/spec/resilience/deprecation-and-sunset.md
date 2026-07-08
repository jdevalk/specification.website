---
title: "Deprecation and Sunset"
slug: deprecation-and-sunset
category: resilience
summary: "When you retire an endpoint, announce it in machine-readable form: the Deprecation and Sunset response headers tell clients it is going away, when, and where to go next — so integrations migrate before anything breaks."
status: optional
order: 55
appliesTo: [all]
relatedSlugs: [error-pages, redirects, maintenance-pages, stable-urls]
updated: "2026-07-08T00:00:00.000Z"
sources:
  - title: "RFC 9745 — The Deprecation HTTP Response Header Field"
    url: "https://www.rfc-editor.org/rfc/rfc9745"
    publisher: "IETF"
  - title: "RFC 8594 — The Sunset HTTP Header Field"
    url: "https://www.rfc-editor.org/rfc/rfc8594"
    publisher: "IETF"
  - title: "IANA — Link Relations Registry"
    url: "https://www.iana.org/assignments/link-relations/link-relations.xhtml"
    publisher: "IANA"
---

## What it is

When you retire an HTTP endpoint — an old API version, a moved feed, a well-known URI you no longer serve — two response headers let you announce it in machine-readable form so clients migrate before anything breaks.

- **`Deprecation`** (RFC 9745) marks a resource as deprecated. Its value is a date: `Deprecation: @1717200000`. A date in the past means it _was_ deprecated then; a future date means it _will_ be. The resource still works — this is advance notice.
- **`Sunset`** (RFC 8594) gives the date the resource is expected to stop responding: `Sunset: Tue, 30 Jun 2026 23:59:59 GMT`. It should be a future date while the resource is live; once it passes, requests typically return `410 Gone`.

The `Sunset` date **must not be earlier** than the `Deprecation` date. Pair either header with a `Link`: `rel="deprecation"` points to human documentation about the change, `rel="sunset"` to a retirement or migration policy, and `rel="successor-version"` to the replacement.

## Why it matters

- **Clients and agents find out on their own.** A consumer hitting the endpoint reads the date and the link, and schedules migration — no out-of-band emails or guesswork.
- **It turns a silent break into a planned one.** Without these headers an endpoint simply vanishes one day and every integration fails at once.
- **The signal is auditable.** Anyone can `curl -I` the endpoint and see when it is going away and where to go next.
- **It complements a real status code.** A retired URL should still return the right status (`404`/`410`) and, where a replacement exists, a [redirect](/spec/seo/redirects/); these headers add the _when_ and _why_.

## How to implement

While the resource is still live, emit the headers and keep serving it normally:

```
Deprecation: @1717200000
Sunset: Tue, 30 Jun 2026 23:59:59 GMT
Link: <https://api.example.com/v2/orders>; rel="successor-version",
      <https://developer.example.com/deprecation/orders-v1>; rel="deprecation"
```

Announce as early as you can — the point is lead time. Do not start failing before the Sunset date. Once the resource is genuinely gone, return `410 Gone` (or `404`); you may keep the `Sunset` header to record when it went, plus a `rel="deprecation"` link so latecomers still find the explanation. RFC 8594 explicitly covers this post-sunset `410` case.

This site ships a worked example. `/.well-known/ai.txt` was retired, and rather than a bare 404 it returns `410 Gone` carrying `Deprecation`, `Sunset`, and a `rel="deprecation"` link back to this page (see `functions/_middleware.ts`). The `ai.txt` convention itself proved defunct — express AI-crawler preferences via [robots.txt](/spec/seo/robots-txt/) and content signals instead.

## Common mistakes

- A `Sunset` earlier than `Deprecation`. Invalid per RFC 9745.
- Emitting `Deprecation` but never a `Sunset` or a successor link — consumers learn it is deprecated but not when it dies or what to use instead.
- Failing the resource _before_ the announced Sunset. Deprecation is a promise to keep working until then.
- Using a bare `Deprecation: true`. The value is a structured-field date, not a boolean.

## Verification

```
curl -sI https://api.example.com/v1/orders | grep -iE 'deprecation|sunset|link'
```

Confirm `Deprecation` carries a date, `Sunset` is not earlier, and a `rel="deprecation"` or `rel="successor-version"` link is present. On a fully retired URL, confirm the status is `410`/`404`, not `200`.
