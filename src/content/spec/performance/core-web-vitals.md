---
title: "Core Web Vitals (LCP, INP, CLS)"
slug: core-web-vitals
category: performance
summary: "Core Web Vitals measure loading, responsiveness, and visual stability. Hit LCP ≤ 2.5s, INP ≤ 200ms, and CLS ≤ 0.1 at the 75th percentile of real users."
status: required
order: 10
appliesTo: [all]
relatedSlugs: [image-optimization, critical-css, lazy-loading, server-side-rendering, server-timing]
updated: "2026-05-29T20:27:54.000Z"
sources:
  - title: "web.dev — Web Vitals"
    url: "https://web.dev/articles/vitals"
    publisher: "web.dev"
  - title: "Chrome User Experience Report"
    url: "https://developer.chrome.com/docs/crux"
    publisher: "Chrome for Developers"
  - title: "web.dev — Interaction to Next Paint (INP)"
    url: "https://web.dev/articles/inp"
    publisher: "web.dev"
  - title: "web.dev — Cumulative Layout Shift (CLS)"
    url: "https://web.dev/articles/cls"
    publisher: "web.dev"
  - title: "Chrome for Developers — Break up long tasks with scheduler.yield()"
    url: "https://developer.chrome.com/blog/use-scheduler-yield"
    publisher: "Chrome for Developers"
---

## What it is

Core Web Vitals are three user-centric metrics that Google uses to score the quality of a page experience:

- **Largest Contentful Paint (LCP)** — time from navigation start until the largest visible element is painted. Measures loading.
- **Interaction to Next Paint (INP)** — the slowest interaction the user has with the page, from input to the next frame. Measures responsiveness.
- **Cumulative Layout Shift (CLS)** — the sum of unexpected layout shift scores during the page's lifecycle. Measures visual stability.

The targets, measured at the 75th percentile of page loads across mobile and desktop:

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## Why it matters

The numbers that count are **field data** from real users, captured in the Chrome User Experience Report (CrUX) and surfaced in Search Console, PageSpeed Insights, and the CrUX API. Lab data from Lighthouse is a useful proxy but not the score Google ranks on.

Slow pages lose users. Field studies consistently show conversion, bounce rate, and session depth all degrading sharply past the "good" thresholds. Core Web Vitals are also a confirmed Google ranking signal as part of page experience.

## How to implement

**LCP** — identify the LCP element (usually a hero image or heading) and make it arrive fast. Serve it from the origin, preload it, avoid lazy-loading it, and keep it out of client-rendered components.

**INP** — break up long JavaScript tasks, defer non-critical work, and avoid heavy work in event handlers. Inside a long task, `await scheduler.yield()` between chunks so the browser can process input — the continuation runs at boosted priority, so your work finishes before other queued tasks. To schedule new low-priority work, use `scheduler.postTask(fn, {priority: 'background'})` or `requestIdleCallback`. Audit third-party scripts.

**CLS** — set explicit `width` and `height` on images, iframes, and video. Reserve space for ads and embeds. Avoid inserting content above existing content. Preload fonts to reduce FOUT swaps.

## Common mistakes

- Optimising lab scores while field data stays red.
- Treating LCP as "first paint" — it is the largest element, often well into the page.
- Lazy-loading the LCP image. It must load eagerly.
- Measuring INP only on the homepage — interaction-heavy pages such as forms and search results are usually the worst offenders.

## Verification

- Check field data in [PageSpeed Insights](https://pagespeed.web.dev) — it pulls from CrUX.
- Use the [web-vitals JavaScript library](https://github.com/GoogleChrome/web-vitals) to send real-user metrics to your analytics.
- In Chrome DevTools, the Performance panel flags LCP, INP, and layout shifts.
