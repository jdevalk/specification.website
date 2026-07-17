---
title: "Avoid automatic IP-based language redirects"
slug: avoid-auto-geo-redirects
category: i18n
summary: "Automatically redirecting visitors to a locale based on IP geolocation or Accept-Language is an anti-pattern. It traps users in the wrong language, breaks search crawlers, and breaks shared links. Let users choose."
status: avoid
order: 18
appliesTo: [all]
relatedSlugs: [hreflang, international-url-structure, language-switcher]
updated: "2026-05-29T18:54:03.000Z"
sources:
  - title: "Google Search Central — Managing multi-regional and multilingual sites"
    url: "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites"
    publisher: "Google Search Central"
  - title: "W3C i18n — When should I use language negotiation?"
    url: "https://www.w3.org/International/questions/qa-when-lang-neg"
    publisher: "W3C"
  - title: "W3C i18n — Using select to link to localized content"
    url: "https://www.w3.org/International/questions/qa-navigation-select"
    publisher: "W3C"
---

## What it is

An automatic locale redirect is when the server, CDN, or edge function inspects the visitor's IP address (geolocation) or the `Accept-Language` request header and issues an HTTP redirect — typically `302` — to a localised URL such as `/de/` or `de.example.com`, without giving the visitor a choice.

The classic shapes:

- A visitor on a German IP requests `/en/pricing` and is bounced to `/de/pricing`.
- A visitor with `Accept-Language: fr-FR` requests `https://example.com/` and is redirected to `/fr/`, with no way to land on the English root.
- A localised URL silently rewrites its content based on the visitor's country, so `/de/about` shows English text to a US visitor.

In each case, the URL no longer determines the content. The visitor's network location does.

## Why it matters

**Search engines never see the localised content they need to index.** Googlebot crawls predominantly from US IPs. If every request from a US IP is redirected to `/en-us/`, the German, French, and Japanese pages are never reached. The site effectively de-indexes its own translations.

**Users get trapped in the wrong language.** A British expat in Berlin gets German pages they cannot read. A French speaker on a US-exit VPN gets English. A traveller checking a booking from abroad cannot return to their own locale. There is often no visible way out, because the switcher itself redirects them back.

**Shared links break.** A user in Paris sends `/fr/article-x` to a colleague in Tokyo. The colleague clicks it and lands on `/ja/article-x` — or, worse, on the homepage. The link no longer means what it said.

**`Accept-Language` is unreliable.** Most browsers ship a default of `en-US,en;q=0.9` regardless of the user's actual preference, and most users never change it. Treating it as a preference signal is guessing.

## What to do instead

- Ship a visible [language switcher](/spec/i18n/language-switcher) on every page. The user, not the server, picks the locale.
- On first visit, it is acceptable to show a **non-blocking banner** suggesting another locale based on detected hints ("This page is also available in Deutsch — switch?"). Never auto-redirect.
- Persist the user's *explicit* choice in a cookie, `localStorage`, or account preference — but only after they have picked. Do not persist a guess.
- Use [hreflang](/spec/i18n/hreflang) so search engines route the right query to the right locale.
- Localised URLs (`/de/`, `/fr-ca/`) must serve their declared content unconditionally to every visitor and every crawler. The URL is the contract.
- Content negotiation on the **root URL only** is fine as a soft default, provided the localised URLs are stable and the user can override the choice.

## Verification

- Open a localised URL through a VPN exit in another country. The content must match the URL, not the exit's location.
- `curl -H "Accept-Language: de" https://example.com/en/pricing` must return the English page.
- `curl -A "Googlebot" https://example.com/de/pricing` must return the German page, with `200 OK` and no redirect.
- Click the language switcher, copy the resulting URL, open it in a private window from a different country. It must still resolve to the same locale.
