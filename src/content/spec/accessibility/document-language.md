---
title: "Document and parts language"
slug: document-language
category: accessibility
summary: "Set the page's primary language on <html lang> and mark any inline content in a different language with its own lang attribute, so screen readers pronounce it correctly."
status: required
order: 120
appliesTo: [all]
relatedSlugs: [foundations/html-lang, semantic-html]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "WCAG 3.1.1 — Language of Page (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html"
    publisher: "W3C"
  - title: "WCAG 3.1.2 — Language of Parts (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html"
    publisher: "W3C"
  - title: "Accessibility Checker — Missing Language Declaration"
    url: "https://equalizedigital.com/accessibility-checker/documentation/missing-language-declaration/"
    publisher: "Equalize Digital"
  - title: "MDN — The lang global attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang"
    publisher: "MDN"
---

## What it is

The `lang` attribute tells browsers, screen readers, search engines, translation tools, and AI agents what language a piece of content is written in. WCAG 3.1.1 (Level A) requires the page's primary language to be set on the root `<html>` element. WCAG 3.1.2 (Level AA) requires any inline passage in a different language to be marked too.

The value is a BCP 47 language tag — `en`, `nl`, `de`, `pt-BR`, `zh-Hant` — not a free-text string.

## Why it matters

Screen readers switch their pronunciation and accent based on `lang`. Without it, a Dutch screen reader will sing English words like Dutch, and an English one will mangle French. Translation tools and AI agents use it to decide whether to translate the text. Spell-checkers, hyphenation, and quotation marks all depend on it.

A missing `lang` is a Level A failure — the lowest possible bar — and one of the easiest accessibility findings for an automated scanner to catch.

## How to implement

Set the page language on `<html>`:

```html
<!doctype html>
<html lang="en-GB">
  <head>…</head>
  <body>…</body>
</html>
```

For a French quotation inside an English page, wrap it and mark the language:

```html
<p>
  As Antoine de Saint-Exupéry wrote,
  <q lang="fr">on ne voit bien qu'avec le cœur</q> —
  one sees clearly only with the heart.
</p>
```

A few rules:

- **Use BCP 47 tags.** `en`, `en-GB`, `pt-BR` — not `english` or `EN_GB`.
- **Match the actual content language.** A site delivered in Dutch with `lang="en"` is worse than no lang at all.
- **Set the directionality too** when needed: `<html lang="ar" dir="rtl">`.
- **Loanwords don't count.** "Café" in an English sentence does not need `lang="fr"`. Mark whole quotations or passages, not individual borrowed words.
- **Update the attribute on language switches.** A single-page app that changes language in the navigation must update `document.documentElement.lang`.

Related: see the [foundations/html-lang](/spec/foundations/html-lang) page for the underlying HTML requirement.

## Common mistakes

- Template ships with `<html lang="en">` and never changes, regardless of which language the page is rendered in.
- `lang=""` (empty) — counts as missing.
- Full-language names ("english") instead of BCP 47 codes.
- Inline quotations in another language with no marker, mispronounced by every screen reader.
- Right-to-left content without `dir="rtl"`, breaking layout.

## Verification

- View source. `<html>` must have a non-empty `lang` matching the page's actual language.
- Listen to a sample with a screen reader and confirm pronunciation matches the language.
- Run an automated checker; missing or invalid `lang` is a standard high-confidence rule.
