---
title: "Writing modes and CJK line breaking"
slug: writing-modes
category: i18n
summary: "Vertical text (Japanese, Traditional Chinese, Mongolian) needs CSS writing-mode. Chinese, Japanese, Korean, and Thai also need explicit line-break and word-break rules so wrapping respects script-specific conventions."
status: optional
order: 35
appliesTo: [all]
relatedSlugs: [rtl-support, lang-attribute, locale-content]
updated: "2026-05-29T18:54:03.000Z"
sources:
  - title: "CSS Writing Modes Level 3"
    url: "https://www.w3.org/TR/css-writing-modes-3/"
    publisher: "W3C"
  - title: "CSS Text Module Level 3 — Line Breaking and Word Boundaries"
    url: "https://www.w3.org/TR/css-text-3/#line-break-property"
    publisher: "W3C"
  - title: "W3C i18n — Approaches to line breaking"
    url: "https://www.w3.org/International/articles/typography/linebreak.en"
    publisher: "W3C"
  - title: "MDN — writing-mode"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/writing-mode"
    publisher: "MDN"
---

## What it is

Two CSS controls govern how non-Latin scripts flow and wrap, and neither has anything to do with the bidi mirroring covered by [RTL and bidirectional text](/spec/i18n/rtl-support/).

`writing-mode` sets the axis along which lines stack. `horizontal-tb` is the default. `vertical-rl` produces the traditional top-down, right-to-left columns used in Japanese and Traditional Chinese publishing. `vertical-lr` is used for Mongolian and some Manchu typesetting. Combine it with `text-orientation: mixed | upright | sideways` so Latin glyphs and digits inside a vertical CJK run render correctly.

`line-break` and `word-break` control where a line may wrap. Chinese, Japanese, Korean, and Thai each have script-specific rules — Japanese publishers forbid breaks before small kana and between certain punctuation pairs, Thai has no inter-word spaces at all — and CSS exposes them through `line-break: strict` and `word-break: keep-all`.

## Why it matters

Vertical CJK layouts are not decorative — they are how books, newspapers, and signage are typeset for hundreds of millions of readers. Without `writing-mode`, the only fallback is a rotated image, which kills selection, search, and accessibility.

Wrapping rules matter just as much. A Japanese paragraph allowed to break anywhere will split punctuation from its host character, leaving a comma stranded at the start of a line. A Chinese column wrapped with `word-break: break-all` becomes unreadable because Han characters get separated mid-compound. Get this right and the page reads naturally; get it wrong and native readers immediately mark the site as foreign-built.

## How to implement

Pair every styling rule with the correct `lang` on the containing element. Browsers use [`lang`](/spec/i18n/lang-attribute/) to pick the right line-break dictionary; CSS alone is not enough.

```css
:lang(ja), :lang(zh) {
  line-break: strict;
  word-break: keep-all;
}

.vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
```

Use `line-break: strict` for Japanese — it enforces the publisher conventions described in JIS X 4051. Use `word-break: keep-all` for CJK so breaks fall only between Han characters, never inside a compound. For Thai, lean on `line-break: auto` and the browser's ICU-based segmentation; do not force `break-all`.

Switch from physical to logical properties everywhere. `padding-inline-start` and `padding-inline-end` follow the writing mode; `padding-left` and `padding-right` do not. The same applies to `margin-inline-*`, `border-inline-*`, `inset-inline-*`, and `text-align: start | end`.

Remember that flexbox and grid axes follow `writing-mode` too. Under `vertical-rl`, `flex-direction: row` runs vertically. Lay out with logical axes (`row` and `column`) and let the writing mode rotate them.

Enable `hyphens: auto` only where it applies. It needs a correct `lang` to pick a hyphenation dictionary, and most CJK content does not hyphenate at all.

## Common mistakes

- Setting `word-break: break-all` globally because "it stops overflow" — it destroys CJK readability.
- Vertical layouts without `text-orientation: mixed` — Latin runs and digits render sideways and unreadable.
- Forgetting that flexbox and grid axes follow `writing-mode`; a `row` becomes vertical under `vertical-rl`.
- Hard-coding `padding-left` and `padding-right` instead of `padding-inline-start` and `padding-inline-end` — fragile under both RTL and vertical writing modes.
- Omitting `lang` on CJK or Thai content, so the browser cannot pick the right line-break dictionary and falls back to generic wrapping.
