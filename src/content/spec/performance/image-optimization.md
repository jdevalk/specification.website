---
title: "Image optimisation"
slug: image-optimization
category: performance
summary: "Serve images in modern formats (WebP, AVIF), at the right size for the viewport, with explicit dimensions. Images are the largest payload on most pages."
status: required
order: 20
appliesTo: [all]
relatedSlugs: [lazy-loading, core-web-vitals, preload-prefetch-preconnect]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "MDN — <img>: The Image Embed element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"
    publisher: "MDN"
  - title: "web.dev — Use modern image formats"
    url: "https://web.dev/articles/serve-images-webp"
    publisher: "web.dev"
  - title: "web.dev — Serve responsive images"
    url: "https://web.dev/articles/serve-responsive-images"
    publisher: "web.dev"
  - title: "HTTP Archive — Web Almanac: Media"
    url: "https://almanac.httparchive.org/en/2024/media"
    publisher: "HTTP Archive"
---

## What it is

Image optimisation is the practice of shipping the smallest visually acceptable image for the user's device. It covers format, dimensions, compression, and how the browser chooses between sources.

```html
<img
  src="hero-800.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
  sizes="(max-width: 600px) 100vw, 800px"
  width="800"
  height="450"
  alt="Wide view of the harbour at dusk"
/>
```

## Why it matters

Images are the single largest contributor to page weight on the web — typically 40–50% of total bytes per the HTTP Archive Web Almanac. They are usually the LCP element, so their delivery directly drives Core Web Vitals. Oversized images also waste mobile data, drain battery, and hurt users on slow connections.

## How to implement

**Use a modern format.** AVIF gives the smallest files but encodes slowly; WebP is well-supported and faster to produce. Both beat JPEG and PNG by 25–50% at equivalent quality. Use `<picture>` to offer fallbacks:

```html
<picture>
  <source srcset="photo.avif" type="image/avif">
  <source srcset="photo.webp" type="image/webp">
  <img src="photo.jpg" width="1200" height="800" alt="…">
</picture>
```

**Serve responsive sizes.** Generate the same image at several widths and let `srcset` plus `sizes` pick the right one. A 4000px image in a 400px slot wastes ~99% of the bytes.

**Always set `width` and `height`.** The browser computes the aspect ratio and reserves the slot, preventing CLS when the image loads.

**Compress aggressively.** Quality 75–80 in WebP is visually indistinguishable from quality 95 for photos. Use tools such as `sharp`, `squoosh`, or `cwebp`.

**Strip metadata.** EXIF, colour profiles, and thumbnails can add tens of kilobytes per image.

## Common mistakes

- Shipping the original camera JPEG (5MB, 6000px) into a 400px card.
- PNG for photos. PNG is for graphics with sharp edges and few colours.
- Omitting `width` and `height`, then wondering why CLS is poor.
- Single fixed `src` with no `srcset` — mobile users download the desktop image.
- Serving an "optimised" image that is still 1MB because compression was set to 100.

## Verification

- DevTools → Network → Img. Sort by size. Anything over 200KB needs a second look.
- Lighthouse flags "Properly size images" and "Serve images in next-gen formats".
- Run [Squoosh](https://squoosh.app) on the worst offenders and compare.
