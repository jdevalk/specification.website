---
title: "Web font loading"
slug: font-loading
category: performance
summary: "Self-host WOFF2 fonts, subset them, set font-display: swap so text is readable while the font loads, and preload the critical face only when it styles above-the-fold content."
status: recommended
order: 70
appliesTo: [all]
relatedSlugs: [preload-prefetch-preconnect, critical-css, core-web-vitals, text-wrap]
updated: "2026-05-29T20:27:54.000Z"
sources:
  - title: "MDN — @font-face"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face"
    publisher: "MDN"
  - title: "web.dev — Best practices for fonts"
    url: "https://web.dev/articles/font-best-practices"
    publisher: "web.dev"
  - title: "MDN — font-display"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display"
    publisher: "MDN"
  - title: "web.dev — Avoid invisible text during font loading"
    url: "https://web.dev/articles/avoid-invisible-text"
    publisher: "web.dev"
---

## What it is

Web fonts are font files (TTF, OTF, WOFF, WOFF2) downloaded by the browser and applied via `@font-face`. Loading them well means short delay, no flash of invisible text, no layout shift when they swap in.

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

## Why it matters

A custom font that loads late causes one of two bad outcomes: **FOIT** (flash of invisible text — the page renders blank rectangles), or **FOUT** (flash of unstyled text — system font flashes, then jumps to the custom font, causing CLS). Both hurt user experience and Core Web Vitals.

Fonts can also be heavy. A single weight of a Latin font is ~30KB in WOFF2; a full multi-script variable font can be 300KB+. They block paint of the text they style.

## How to implement

**Self-host.** Third-party font services add a DNS lookup, TLS handshake, and a second domain to track. Download the WOFF2 files and serve them from your origin.

**Use WOFF2 only.** All modern browsers support it. WOFF2 is pre-compressed (do not gzip), 30% smaller than WOFF, and 50% smaller than TTF.

**Subset to what you use.** Google Fonts' default Latin subset covers most English-language sites. If your content is English only, drop Cyrillic, Greek, and Vietnamese subsets — that can halve the file. Tools: `pyftsubset`, `glyphhanger`, `subfont`.

**Preload the critical face — when it pays off.** A `<link rel="preload">` issues a high-priority fetch before CSS is parsed, so it competes with the HTML and critical CSS for bandwidth. Worth it when the font styles above-the-fold text *and* you have inlined critical CSS to free up the budget. On slow connections — or when you ship a heavy variable font and only need one weight up top — the preload steals bandwidth from more important requests and can delay first paint. If you use `font-display: optional` with a well-matched fallback, the preload usually buys nothing.

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

`crossorigin` is mandatory even for same-origin fonts — without it the preload misses the cache and the font fetches twice.

**Set `font-display`.** `swap` shows the fallback immediately and swaps when the custom font arrives. `optional` is stricter: if the font isn't cached and ready within ~100ms, the fallback is used permanently — best for CLS. Avoid `block`, which causes FOIT.

**Use variable fonts when you need multiple weights.** A variable font replaces several weight + style files, but each variable file is itself heavier than a single static weight — a Latin-subsetted Inter variable runs ~80–120KB; a single static Inter weight is ~30KB. Break-even is roughly three weights, or a weight plus its italic. Below that, ship the specific static weights.

**Match metrics to reduce shift.** Use `size-adjust`, `ascent-override`, and `descent-override` on the fallback `@font-face` so the swap doesn't reflow the layout.

## Common mistakes

- Loading from `fonts.googleapis.com` and a self-host preload. Double-fetch.
- Preloading without `crossorigin`. Double-fetch.
- Preloading a font without `font-display: swap` (or `optional`) — the preload steals bandwidth from critical CSS *and* you still get a FOIT if the font arrives late.
- Preloading a heavy variable font when only one weight is used above the fold — ship the static weight instead.
- `font-display: block` (or the default `auto`). Causes invisible text for up to 3 seconds.
- Shipping six static weights when a variable font covers all of them; or shipping a variable font when one or two static weights would do.
- Loading the full multi-script font for a Latin-only site.

## Verification

- DevTools → Network → filter by Font. Count requests; check sizes; confirm WOFF2.
- DevTools → Rendering → Emulate "Slow 4G" and reload. Watch for FOIT or large layout shifts.
- Lighthouse "Ensure text remains visible during webfont load" flags missing `font-display`.
