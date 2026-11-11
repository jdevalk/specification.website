---
title: "Three pages sharpened from the Modern Web Guidance review"
date: "2026-11-11"
type: changed
relatedSlugs: [webmcp, form-errors, pwa-manifest]
---

Three existing pages gained material from the Modern Web Guidance review: [WebMCP](/spec/agent-readiness/webmcp/) now covers the declarative form API (`toolname`, `toolautosubmit`, `SubmitEvent.respondWith`), tool lifecycle via `AbortSignal`, and the concrete Chromium preview floor; [form errors](/spec/accessibility/form-errors/) now times the error state with `:user-invalid` and keeps `aria-invalid` in sync, initialised explicitly to `false`; and [PWA manifest](/spec/resilience/pwa-manifest/) now specifies the in-page install fallback chain, from the `<install>` element and `navigator.install()` down to `beforeinstallprompt`.
