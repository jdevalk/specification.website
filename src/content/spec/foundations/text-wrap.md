---
title: "Balanced text wrapping"
slug: text-wrap
category: foundations
summary: "Let the browser break headings and body copy intelligently with text-wrap: balance and pretty — no orphaned words, no manual line breaks, no layout shift."
status: recommended
order: 150
appliesTo: [all]
relatedSlugs: [color-scheme, font-loading, core-web-vitals]
updated: "2026-06-25T00:00:00.000Z"
sources:
  - title: "CSS Text Module Level 4 — the text-wrap shorthand"
    url: "https://drafts.csswg.org/css-text-4/#text-wrap"
    publisher: "W3C CSS Working Group"
  - title: "MDN — text-wrap"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap"
    publisher: "MDN"
  - title: "CSS text-wrap: balance"
    url: "https://developer.chrome.com/docs/css-ui/css-text-wrap-balance"
    publisher: "Chrome for Developers"
  - title: "Better typography with text-wrap: pretty"
    url: "https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/"
    publisher: "WebKit"
---

## What it is

`text-wrap` is a CSS shorthand that tells the browser _how_ to break a run of text across lines, beyond the default greedy "fill each line, then break". Two values matter for content:

- **`text-wrap: balance`** — even out the number of characters per line so a block doesn't end on a lonely word. Best for short runs: headings, blockquotes, captions, card titles. Browsers cap it (six lines in Chromium, ten in Firefox), so it stays cheap.
- **`text-wrap: pretty`** — optimise the _last few_ lines of a longer block to avoid orphans (a single word on the final line) and bad breaks. Intended for body copy.

Both are part of the `text-wrap` shorthand in CSS Text Module Level 4, alongside `text-wrap-mode` (`wrap` / `nowrap`) and `text-wrap-style` (which carries `balance` / `pretty` / `stable`).

```css
h1,
h2,
h3 {
  text-wrap: balance;
}
p {
  text-wrap: pretty;
}
```

## Why it matters

- **Readability.** A heading that wraps "Balanced text\nwrapping" reads better than one that leaves "wrapping" stranded alone. Avoiding orphans and ragged breaks is a typographic baseline print has always had.
- **No manual line breaks.** The common workaround — `<br>` or `&nbsp;` to force "good" wrapping — breaks the moment the viewport, font, or translated string changes. `balance` adapts to whatever width it is given.
- **It degrades safely.** Unsupported browsers ignore the declaration and fall back to normal wrapping. There is no polyfill, no JavaScript, and no layout to repair. `balance` is also cheap — browsers cap it to a handful of lines — though `pretty` is not (see below).

This site ships it: `text-wrap: balance` on spec headings and `text-wrap: pretty` on body paragraphs, in [`global.css`](https://github.com/jdevalk/specification.website/blob/main/src/styles/global.css).

## How to implement

Apply `balance` to short, heading-like elements and `pretty` to flowing prose. Set it globally in your base stylesheet; you do not need a feature query because the fallback is simply default wrapping.

Reserve `balance` for short blocks — the browser stops balancing past its line cap, so using it on long paragraphs does nothing useful. Use `pretty` for the long stuff.

Unlike `balance`, `pretty` is not free: it deliberately trades layout speed for typography, running a slower algorithm with no line cap, so the cost scales with how much text it touches. That is a fine trade for genuine body copy, but think before blanket-applying it to every text node on the page — scope it to your prose containers rather than a bare `*` or `p` selector across the whole document.

## Common mistakes

- **`balance` on long body text.** Past the browser's line cap it is a no-op, and where it does apply to long blocks it can cost layout performance. Keep it for headings and other short runs.
- **Keeping old `<br>` hacks.** Manual breaks fight the browser's balancing and produce double breaks at some widths. Remove them once you adopt `text-wrap`.
- **Expecting `pretty` everywhere.** Engine support for `pretty` trails `balance`; treat it as a progressive enhancement, never as something a layout depends on.
- **Applying `pretty` indiscriminately.** It runs a slower wrapping algorithm by design, and unlike `balance` it has no line cap, so applying it site-wide carries a real layout cost. Reserve it for actual body copy; do not hang it off a universal selector.

## Verification

- In a supporting browser, resize a balanced heading: the lines stay evenly filled rather than leaving a one-word last line.
- `caniuse.com/css-text-wrap-balance` — `balance` is Baseline across Chromium, Firefox, and Safari; `pretty` has narrower support.
