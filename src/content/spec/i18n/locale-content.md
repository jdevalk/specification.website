---
title: "Locale-aware content"
slug: locale-content
category: i18n
summary: "Dates, numbers, currency, and units should be formatted in the user's locale. Use Intl APIs in the browser and the same locale data server-side so output matches expectations."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [hreflang, lang-attribute, rtl-support, plural-rules]
updated: "2026-05-29T18:54:03.000Z"
sources:
  - title: "MDN — Intl"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl"
    publisher: "MDN"
  - title: "W3C i18n — Working with language and locale"
    url: "https://www.w3.org/International/articlelist#locales"
    publisher: "W3C"
  - title: "MDN — Accept-Language header"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language"
    publisher: "MDN"
---

## What it is

Locale-aware content adapts the *presentation* of data to the user's conventions. "9/5/2026" means September 5 in en-US and May 9 in en-GB. "1,000" is one thousand in English and one in German. "10:30 PM" is unfamiliar where 24-hour clocks dominate. Currency symbols, decimal separators, list separators, sort order, plural rules, and unit systems all vary.

The spec is `ECMA-402` (Internationalisation API), exposed in JavaScript as the [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) namespace. Equivalent ICU-backed libraries exist for every server platform.

## Why it matters

Wrong locale formatting introduces real bugs: a US user reads a price as `$1,000.00` when the server emitted `1.000,00 €`, a delivery time is parsed as the wrong day, a sort order looks random because it used codepoint order instead of a locale collator. These errors silently erode trust. Doing it right is cheap because the platform owns the data.

## How to implement

**Pick the locale once, use it everywhere.** Resolve a single locale string per request (e.g. `en-GB`) from, in order: a user preference, a URL segment or subdomain (`/en-gb/`), the `Accept-Language` header, and a sensible default. Store it on the request and pass it to every formatter.

**Format with `Intl` in the browser:**

```js
const locale = document.documentElement.lang; // e.g. "en-GB"

new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date());
// → "29 May 2026"

new Intl.NumberFormat(locale, { style: "currency", currency: "GBP" }).format(1299.5);
// → "£1,299.50"

new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day");
// → "yesterday"

new Intl.ListFormat(locale, { type: "conjunction" }).format(["a", "b", "c"]);
// → "a, b, and c"
```

**Format on the server too.** Send pre-formatted strings in initial HTML so users without JavaScript still see the right output, and so the page does not flash with a server-formatted value being rewritten on hydration. Most languages have an ICU binding: `Intl` in Node and Deno, `babel.dates` in Python, `java.text.MessageFormat` in Java, `NumberFormatter` in PHP.

**Negotiate locale, do not assume it.** Parse `Accept-Language`, match against your supported locales with a proper algorithm (e.g. `Intl.Locale` plus `lookup`/`best-fit`), and let the user override and persist that choice.

**Format the right things.**

- Dates and times — always with a timezone, and prefer `dateStyle`/`timeStyle` over manual patterns.
- Numbers, currency, percentages — `Intl.NumberFormat`.
- Sorting and search — `Intl.Collator`.
- Plurals — `Intl.PluralRules` (English has 2 forms, Arabic has 6). Covered in detail in [plural-rules](/spec/i18n/plural-rules/).
- Lists — `Intl.ListFormat`.

## Common mistakes

- Concatenating strings like `` `${day}/${month}/${year}` `` instead of using a formatter.
- Hard-coding currency symbols rather than `currency` and `currencyDisplay`.
- Using `toLocaleString()` with no locale argument, which depends on the runtime's default and is inconsistent server vs. client.
- Storing locale-formatted strings in the database. Store ISO data (`2026-05-29`, `1299.50 GBP`) and format on read.
- Treating language and locale as the same. `en` is a language; `en-GB` is a locale. Use the locale for formatting.
