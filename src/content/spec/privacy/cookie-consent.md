---
title: "Cookie consent"
slug: cookie-consent
category: privacy
summary: "In the EU and UK, non-essential cookies and similar storage require freely given, informed, specific, and unambiguous opt-in consent before they are set."
status: required
order: 20
appliesTo: [all]
relatedSlugs:
  [
    privacy-policy,
    third-party-scripts,
    analytics-privacy,
    global-privacy-control,
    focus-not-obscured,
  ]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "EDPB Guidelines 03/2022 on deceptive design patterns in social media"
    url: "https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-032022-deceptive-design-patterns-social-media_en"
    publisher: "EDPB"
  - title: "ICO — Cookies and similar technologies"
    url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/"
    publisher: "ICO"
  - title: "CNIL — Cookies and other tracking devices: new guidelines"
    url: "https://www.cnil.fr/en/cookies-and-other-tracking-devices-cnil-publishes-new-guidelines"
    publisher: "CNIL"
  - title: "ePrivacy Directive 2002/58/EC, Article 5(3)"
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02002L0058-20091219"
    publisher: "EUR-Lex"
---

## What it is

In the EU and UK, the ePrivacy Directive — implemented through national laws such as PECR in the UK — requires consent before storing or reading information on a user's device. The GDPR then defines what valid consent looks like: a freely given, specific, informed, and unambiguous indication of the user's wishes, given by a clear affirmative action.

This applies to cookies, but also to localStorage, sessionStorage, IndexedDB, fingerprinting, and pixel trackers. The technology does not matter; the storage and access do.

A banner is not what the law requires. The obligation is narrow: do not store or read non-essential information on the device without prior consent. A banner is one way to collect that consent, not the requirement itself. A site that sets no non-essential storage needs no banner at all, and a banner that drops analytics cookies before the user has chosen is non-compliant however polished it looks. The compliant state is defined by what your site does before the click, not by the presence of the dialog.

## Why it matters

Cookie consent is the most enforced part of EU privacy law on the public web. National regulators — CNIL, the Garante, the ICO, the Belgian DPA — issue fines regularly, and most of them target the same patterns: pre-ticked boxes, "reject" buttons hidden two clicks away, and banners that count scrolling as consent.

A non-compliant banner is also a poor user experience. Visitors do not want to negotiate with your site before reading it.

## How to implement

The principles are simpler than vendors make them sound:

- **Strictly necessary cookies do not need consent.** Session cookies for login, shopping carts, security tokens, and load balancing are exempt. Analytics, advertising, social embeds, and A/B testing are not.
- **Set no non-essential cookies before the user accepts.** This includes Google Analytics, Meta Pixel, Hotjar, YouTube embeds, and most "marketing" tags.
- **Give "accept" and "reject" equal prominence.** Same size, same colour weight, same number of clicks. A bright green "Accept all" next to a grey "Manage preferences" is non-compliant.
- **Rejecting must be as easy as accepting.** One click. Not a maze of toggles.
- **Reject means reject.** No tracking cookies, no fingerprinting fallback, no "legitimate interests" toggle that is on by default.
- **Be specific about purposes.** "Analytics" and "marketing" are categories users can choose between; "improving your experience" is not.
- **Let users change their mind.** A persistent link in the footer to reopen the banner.
- **Re-ask only when the purposes change**, not every visit.

The banner is not the consent record. Store the user's choice — what they consented to, when, and which version of the notice they saw.

## Common mistakes

- Pre-ticked boxes for any non-essential purpose. The CJEU ruled this invalid in *Planet49* (2019).
- "By using this site you agree" — implied consent is not valid consent under GDPR.
- Loading analytics scripts before the user has chosen.
- A "reject" button that is visually deprioritised, or only appears after clicking "preferences".
- No way to withdraw consent later.
- Treating the UK as exempt from these rules — UK GDPR and PECR are substantively the same.
