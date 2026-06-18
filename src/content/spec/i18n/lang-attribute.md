---
title: "lang attribute on inline content"
slug: lang-attribute
category: i18n
summary: "Mark passages, phrases, and inline elements that differ from the document language with a lang attribute. WCAG 3.1.2 requires it so assistive tech can switch pronunciation."
status: required
order: 20
appliesTo: [all]
relatedSlugs: [hreflang, rtl-support, locale-content, language-switcher, localised-metadata, translate-attribute]
updated: "2026-05-29T18:54:03.000Z"
sources:
  - title: "WCAG 3.1.2 — Language of Parts (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html"
    publisher: "W3C"
  - title: "W3C i18n — Declaring language in HTML"
    url: "https://www.w3.org/International/questions/qa-html-language-declarations"
    publisher: "W3C"
  - title: "MDN — The lang global attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang"
    publisher: "MDN"
---

## What it is

`lang` is a global HTML attribute that names the natural language of the element's content. The root document language belongs on `<html lang="…">` (covered by [the html lang attribute spec page](/spec/foundations/html-lang/)). This page is about the *other* `lang` declarations — the ones you add to spans, paragraphs, quotes, and any inline content whose language differs from the page default.

```html
<p>The German verb <span lang="de">verschlimmbessern</span> means to make
something worse by trying to improve it.</p>
```

## Why it matters

WCAG 2.4.2 Level A requires a page-level language. [WCAG 3.1.2 Level AA](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) requires per-part language declarations for any passage or phrase whose language differs from the surrounding text. The benefits are concrete:

- **Screen readers** switch voice and pronunciation rules. VoiceOver reads a French sentence with a French voice when it sees `lang="fr"`; without it, it mangles the words with the document-language voice.
- **Browsers** apply the correct spellcheck dictionary, font fallback, hyphenation rules, and quotation marks.
- **Search engines and translation tools** know which spans to leave alone and which to translate.
- **CSS** can target language with the `:lang()` pseudo-class — useful for typography and quotation marks.

## How to implement

Use [BCP 47](https://www.rfc-editor.org/info/bcp47) tags, the same tagging system used for `hreflang`. Language subtag first, optional script and region after.

```html
<html lang="en-GB">
  <body>
    <blockquote lang="fr">
      Je pense, donc je suis.
    </blockquote>
    <p>The motto <i lang="la">per aspera ad astra</i> is Latin.</p>
    <p>The Japanese term <span lang="ja">改善</span>
       (<span lang="ja-Latn">kaizen</span>) means continuous improvement.</p>
  </body>
</html>
```

Rules of thumb:

- **Mark the smallest correct element.** A `<span>` around a foreign phrase is fine.
- **Mark scripts when relevant.** `zh-Hans` vs `zh-Hant` matters for font selection. `ja-Latn` distinguishes romanised Japanese from kanji.
- **Do not mark proper names** that are widely used in the page language ("Paris" in an English text does not need `lang="fr"`).
- **Quotes and citations** are good candidates — `<blockquote lang="…">` and `<q lang="…">` change quotation-mark glyphs via the browser.

## Common mistakes

- Tagging every loanword. "Café" and "ad hoc" in English text are English now.
- Using invalid codes like `lang="english"` or `lang="UK"`. Use `en` or `en-GB`.
- Setting `lang=""` (empty) on an element to "unset" it — that is only valid on `<html>` when the language is genuinely unknown.
- Forgetting the script subtag for CJK content, which causes wrong font rendering.
