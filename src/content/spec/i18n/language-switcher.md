---
title: "Language switcher"
slug: language-switcher
category: i18n
summary: "List each locale in its own language ('Deutsch', '日本語', 'العربية') and mark it with the right lang attribute. Don't use flags — flags are countries, not languages."
status: recommended
order: 25
appliesTo: [all]
relatedSlugs: [hreflang, lang-attribute, avoid-auto-geo-redirects, international-url-structure]
updated: "2026-05-29T18:54:03.000Z"
sources:
  - title: "W3C i18n — Using select to link to localized content"
    url: "https://www.w3.org/International/questions/qa-navigation-select"
    publisher: "W3C"
  - title: "W3C — Internationalization Quick Tips for the Web"
    url: "https://www.w3.org/International/quicktips/"
    publisher: "W3C"
  - title: "BCP 47 — Tags for Identifying Languages"
    url: "https://www.rfc-editor.org/info/bcp47"
    publisher: "IETF"
---

## What it is

A language switcher is the UI control that lets a visitor pick which localised version of your site they want to read. It pairs with [`hreflang`](/spec/i18n/hreflang) (which tells search engines about alternates) and with the page-level [`lang` attribute](/spec/i18n/lang-attribute) (which tells assistive tech what language the current page is in). The switcher is the human-facing half: a discoverable, persistent control that puts the choice in the user's hands.

## Why it matters

A visitor who landed on the wrong locale has to be able to fix it without reading the current page. That sounds obvious, and it's the one rule most sites break. If your German switcher option is labelled "German" in English, a user who only reads German cannot find it. If you label locales with flags, you have told a Mexican Spanish speaker that Spanish belongs to Spain, and an Arabic speaker that their language belongs to a single country it does not. The switcher is also what makes it safe to [avoid automatic geo-redirects](/spec/i18n/avoid-auto-geo-redirects): you can serve a sensible default and trust users to correct it.

## How to implement

- **Label each option in its own language.** "Deutsch", not "German". "日本語", not "Japanese". "Français", not "French". W3C is explicit about this: users who can't read the current page need the link in their own language.
- **Add the region only when it disambiguates.** "Português (Portugal)" vs "Português (Brasil)", "English (UK)" vs "English (US)".
- **Mark each link with `lang` (and `hreflang`).** Screen readers switch voice on `lang`, so the option is announced correctly even when the surrounding page is in another language.
- **Don't use flags for languages.** Spanish is not Spain. Arabic is not any single country. English is neither the UK nor the US. Use flags only when you genuinely mean a country (a regional storefront, a shipping selector).
- **Make it discoverable.** Visible without hover, in or near the header or the footer. Not buried inside a hamburger menu or hidden behind an icon-only button.
- **Persist the choice.** When a user picks a locale, remember it (cookie, `localStorage`, account preference) and honour it on return — but never override an explicit URL. `/de/` always serves German.
- **Link to the equivalent page, not the locale homepage.** If a user switches language from `/pricing/`, they should land on `/de/pricing/`, not `/de/`.
- **Indicate the current locale.** Mark it with `aria-current="true"` (or style it as non-interactive) so screen-reader users know where they are.

```html
<nav aria-label="Language">
  <ul>
    <li><a href="/de/" lang="de" hreflang="de">Deutsch</a></li>
    <li><a href="/ja/" lang="ja" hreflang="ja">日本語</a></li>
    <li><a href="/ar/" lang="ar" hreflang="ar">العربية</a></li>
    <li><a href="/pt-br/" lang="pt-BR" hreflang="pt-BR">Português (Brasil)</a></li>
    <li><a aria-current="true">English</a></li>
  </ul>
</nav>
```

## Common mistakes

- Labelling locales in the page's current language ("German", "Japanese") instead of the target language.
- Flags as language indicators.
- Omitting `lang` on each option, so screen readers mispronounce "日本語" in an English voice.
- Switching language always sends the user to the locale homepage, losing their context.
- The switcher overrides an explicit `/de/` URL with a stored preference for English.
- The switcher only appears after JavaScript runs, or only on hover.

## Verification

- A visitor who cannot read the current page can still find and recognise the link to their language.
- Test with a screen reader: each option is announced in its own voice, confirming the per-link `lang` attribute works.
- The current locale is indicated (`aria-current="true"` or equivalent styling), not just unlinked or invisible.
- Switching language from a deep page lands on the equivalent localised URL, not the homepage.
- A stored preference does not override an explicit locale URL.
