---
title: "Lazy loading images, iframes, and video"
slug: lazy-loading
category: performance
summary: 'Native lazy loading defers off-screen images, iframes, and (recently) video until the user scrolls near them. Use loading="lazy" — but never on the LCP element.'
status: recommended
order: 30
appliesTo: [all]
relatedSlugs: [image-optimization, core-web-vitals, preload-prefetch-preconnect]
updated: "2026-05-29T09:51:43.000Z"
sources:
  - title: "MDN — <img> loading attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#loading"
    publisher: "MDN"
  - title: "MDN — <iframe> loading attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#loading"
    publisher: "MDN"
  - title: "MDN — <video> loading attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#loading"
    publisher: "MDN"
  - title: "HTML Living Standard — The video element"
    url: "https://html.spec.whatwg.org/multipage/media.html#the-video-element"
    publisher: "WHATWG"
  - title: "web.dev — Browser-level image lazy loading"
    url: "https://web.dev/articles/browser-level-image-lazy-loading"
    publisher: "web.dev"
  - title: "MDN — decoding attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#decoding"
    publisher: "MDN"
---

## What it is

The `loading` attribute lets the browser defer fetching a resource until it is close to the viewport. It is a single HTML attribute — no JavaScript, no IntersectionObserver. It applies to three elements:

```html
<img src="diagram.webp" width="800" height="600" loading="lazy" decoding="async" alt="…">
<iframe src="https://www.youtube.com/embed/…" loading="lazy" title="Demo"></iframe>
<video src="clip.mp4" loading="lazy" controls width="800" height="450"></video>
```

Valid values: `lazy` (defer), `eager` (load immediately — the default).

`<img>` has supported `loading="lazy"` since Chrome 77 (2019) and is universally available across modern browsers. `<iframe>` followed shortly after. **`<video loading="lazy">` is the newest member** — added to the HTML Living Standard in 2026 and shipping in Chromium-based browsers; treat it as progressive enhancement, since older browsers simply ignore the attribute and fall back to the element's existing `preload` behaviour.

## Why it matters

A typical article page has a dozen images below the fold that the user may never scroll to. Loading them eagerly costs bandwidth, blocks more important requests, and steals decode time from the main thread. Lazy loading defers that work, often cutting initial bytes by 30–60% on long pages.

`decoding="async"` is complementary: it lets the browser decode the image off the main thread, so the image arriving doesn't jank scrolling or interactions.

## How to implement

**Default off-screen images to lazy.** Anything below the fold — gallery thumbnails, author avatars, embedded tweets, YouTube embeds — should be `loading="lazy"`.

**Keep the LCP image eager.** The hero image, the article lead, the product photo — these must not be lazy-loaded. Browsers honour `loading="lazy"` even when the image is just below the fold on a small viewport, and the LCP cost is significant. When in doubt, use `loading="eager"` (or omit the attribute) for above-the-fold images.

**Add `decoding="async"` to all images.** It has no downside and helps with main-thread responsiveness.

**Lazy-load iframes by default.** YouTube and map embeds pull hundreds of kilobytes of JavaScript on every page view. `loading="lazy"` on the iframe defers all of it.

**Lazy-load below-the-fold video.** Combine `loading="lazy"` with `preload="none"` (or `preload="metadata"` if you need the poster frame) so neither the video bytes nor its metadata are fetched until the user reaches it. In older browsers without `loading="lazy"` support, `preload` alone still gives you most of the win.

```html
<video loading="lazy" preload="none" poster="poster.webp" controls
       width="800" height="450">
  <source src="clip.av1.mp4" type="video/mp4; codecs=av01.0.05M.08">
  <source src="clip.h264.mp4" type="video/mp4; codecs=avc1.42E01E">
</video>
```

**Keep `width` and `height`.** Lazy loading does not change layout — without dimensions you still get CLS when the resource arrives.

## Common mistakes

- `loading="lazy"` on the LCP image. The single biggest lazy-loading mistake. Lighthouse and PageSpeed Insights flag it explicitly.
- Custom JavaScript lazy-loaders running on top of native lazy loading, doubling the work.
- Lazy-loading every image to "be safe" — the first screenful must load eagerly.
- Omitting dimensions, so lazy-loaded images shift the layout on arrival.

## Verification

- DevTools → Network → throttle to "Slow 4G", reload, watch which images fetch immediately and which wait for scroll.
- Lighthouse audit: "Largest Contentful Paint image was lazily loaded" is a hard failure to fix.
- View source: every below-the-fold `<img>` and `<iframe>` should have `loading="lazy"`.
