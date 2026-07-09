---
title: Spec pages now name what each topic is mistaken for
date: "2026-07-09"
type: changed
relatedSlugs: [title, canonical-url, content-security-policy]
---

Reviewed every spec page and, where a topic is commonly misunderstood, added a short paragraph naming the wrong belief a reader arrives with and contrasting against it. The [`<title>` element](/spec/foundations/title/) is not the `<h1>`, a [canonical URL](/spec/foundations/canonical-url/) is a hint rather than a redirect or `noindex`, and the recommended [Content-Security-Policy](/spec/security/content-security-policy/) only looks self-contradicting until you see how `'strict-dynamic'` and a nonce override the older fallbacks. Pages that already made their contrast were left untouched, and a couple of stale factual claims (such as Safari's Zstandard support) were corrected along the way.
