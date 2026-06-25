---
title: "The lang attribute on <html>"
slug: html-lang
category: foundations
summary: "Set a valid BCP 47 language tag on the <html> element so screen readers, translators, search engines, and browsers know what language the page is in."
status: required
order: 20
appliesTo: [all]
relatedSlugs: [doctype, meta-charset, title]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "HTML Living Standard — The lang and xml:lang attributes"
    url: "https://html.spec.whatwg.org/multipage/dom.html#the-lang-and-xml:lang-attributes"
    publisher: "WHATWG"
  - title: "MDN — HTML lang global attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang"
    publisher: "MDN"
  - title: "BCP 47 — Tags for Identifying Languages"
    url: "https://www.rfc-editor.org/info/bcp47"
    publisher: "IETF"
  - title: "WCAG 3.1.1 — Language of Page (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html"
    publisher: "W3C"
---

## What it is

Every HTML document should declare its primary language on the root element using the `lang` attribute:

```html
<html lang="en">
```

The value is a **BCP 47 language tag** — a short, standardised string that identifies a language and, optionally, a region or script. Examples: `en`, `en-GB`, `nl`, `pt-BR`, `zh-Hant`, `de-AT`.

## Why it matters

The language of the page is metadata that many systems rely on:

- **Screen readers** switch pronunciation engines based on `lang`. Without it, VoiceOver and NVDA read English text with a Dutch accent, or vice versa, making content unintelligible.
- **Browsers** offer translation prompts ("Translate this page from French?") only when they know the source language.
- **Search engines** use it as one signal for which audience to show the page to.
- **Spell checkers** in `<textarea>` and `contenteditable` fields use the document language as their default.
- **CSS** can match `:lang(en-GB)` to apply locale-specific typography (quotation marks, hyphenation).
- **WCAG 3.1.1 Level A** requires the human language of every page to be programmatically determinable.

A missing `lang` is one of the most common accessibility failures, and one of the easiest to fix.

## How to implement

Use a valid BCP 47 tag. The simplest form is just the two-letter ISO 639-1 language code:

```html
<html lang="en">
<html lang="fr">
<html lang="ja">
```

Add a region only when it changes meaning — currency, spelling, or pronunciation:

```html
<html lang="en-GB">   <!-- British English: "colour", "behaviour" -->
<html lang="en-US">   <!-- American English: "color", "behavior" -->
<html lang="pt-BR">   <!-- Brazilian Portuguese -->
<html lang="zh-Hant"> <!-- Traditional Chinese script -->
```

For sections of a page in a different language, use `lang` on a child element:

```html
<p>The French call it <span lang="fr">pamplemousse</span>.</p>
```

For right-to-left scripts (Arabic, Hebrew), pair `lang` with `dir`:

```html
<html lang="ar" dir="rtl">
```

## Common mistakes

- Omitting the attribute entirely. Many CMS templates ship without it.
- Using made-up codes like `lang="english"` or `lang="us"`. Only BCP 47 tags are valid.
- Setting `lang="en"` on a Dutch site because the template was copied from an English boilerplate.
- Over-specifying the region (`lang="en-US"` on a generic global English site is fine but rarely needed).
- Forgetting to update `lang` on translated pages — every locale needs its own value.

## Verification

- View source: confirm `<html lang="...">` is present and matches the actual content language.
- Run `document.documentElement.lang` in DevTools.
- Use an accessibility checker (axe, Lighthouse). Both flag missing or invalid `lang`.
- Listen to the page with a screen reader and confirm pronunciation matches the language.
