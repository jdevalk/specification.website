---
title: "translate attribute for untranslatable content"
slug: translate-attribute
category: i18n
summary: "The translate attribute marks content that automatic translation systems must leave alone — brand names, code, and identifiers. Use translate=\"no\" so Google Translate and the browser's built-in translation don't mangle terms that have no localised form."
status: optional
order: 22
appliesTo: [all]
relatedSlugs: [lang-attribute, localised-metadata, locale-content, language-switcher]
updated: "2026-06-18T00:00:00.000Z"
sources:
  - title: "HTML Standard — The translate attribute"
    url: "https://html.spec.whatwg.org/multipage/dom.html#the-translate-attribute"
    publisher: "WHATWG"
  - title: "W3C i18n — Using the HTML translate attribute"
    url: "https://www.w3.org/International/questions/qa-translate-flag"
    publisher: "W3C"
  - title: "MDN — The translate global attribute"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate"
    publisher: "MDN"
---

## What it is

`translate` is a global HTML attribute that tells automatic translation systems whether an element's text — and its translatable attribute values, like `alt` and `title` — should be translated when the page is localised. It takes two values: `yes` (the empty string also means yes) and `no`.

```html
<footer>
  <small>© 2026 <span translate="no">Verschlimmbessern Inc.</span></small>
</footer>
```

The value inherits: set `translate="no"` on an element and every descendant is excluded too, until a child sets `translate="yes"` again. The default for the document is "yes" — everything is translatable unless you say otherwise.

This is the opposite concern to [the `lang` attribute](/spec/i18n/lang-attribute/). `lang` declares *what language content is in* so assistive tech and browsers handle it correctly; `translate` declares *what must not be machine-translated at all*. The two are complementary, not interchangeable.

## Why it matters

Browsers do not act on `translate` for rendering, but it is respected by the systems that actually translate pages: Google Translate, the browser's built-in page translation (Chrome, Edge, Safari, Firefox), and many tools used by human translators. Without it, those systems happily translate things that should never change:

- **Brand and product names** become nonsense in the target language.
- **Code, commands, and file paths** get "translated" and stop working when copied.
- **Proper nouns and identifiers** — usernames, SKUs, legal entity names — get altered.

Marking this content is the author's job; the translation system has no other way to know a string is a brand name rather than an ordinary noun.

## How to implement

Add `translate="no"` to the smallest element that wraps the untranslatable text.

```html
<p>Install it with <code translate="no">npm install astro</code>.</p>
<p>Your order <span translate="no">#A-4815</span> has shipped.</p>
<p>Written by <span translate="no">Joost de Valk</span>.</p>
```

Good candidates: brand names, code samples, keyboard shortcuts, email addresses, and any string a reader will copy verbatim. The attribute is [Baseline](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate) widely available, so no fallback is needed.

## Common mistakes

- **Putting `translate="no"` on `<html>` or `<body>`.** That opts the whole page out of translation — exactly what most multilingual readers do not want. Mark spans, not pages.
- **Confusing it with `lang`.** `lang="en"` does not stop translation, and `translate="no"` does not declare a language. Untranslatable foreign-language terms often want both.
- **Forgetting attributes are covered too.** `translate="no"` on an `<img>` also protects its `alt` and `title` — useful for a logo whose alt text is the brand name.
