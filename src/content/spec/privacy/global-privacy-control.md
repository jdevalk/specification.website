---
title: "Global Privacy Control (GPC)"
slug: global-privacy-control
category: privacy
summary: "Global Privacy Control is a browser-level signal that tells websites the user opts out of the sale or sharing of their personal data. California and Colorado require sites to honour it."
status: recommended
order: 30
appliesTo: [all]
relatedSlugs: [cookie-consent, privacy-policy, analytics-privacy]
updated: "2026-06-09T00:00:00.000Z"
sources:
  - title: "Global Privacy Control specification"
    url: "https://w3c.github.io/gpc/"
    publisher: "W3C Community Group"
  - title: "California Attorney General — Frequently Asked Questions: CCPA"
    url: "https://oag.ca.gov/privacy/ccpa"
    publisher: "California Office of the Attorney General"
  - title: "Colorado Privacy Act Rules — Universal Opt-Out Mechanism"
    url: "https://coag.gov/resources/colorado-privacy-act/"
    publisher: "Colorado Attorney General"
---

## What it is

Global Privacy Control (GPC) is a simple machine-readable signal that a user — through their browser, an extension, or a privacy-focused tool like DuckDuckGo or Brave — broadcasts to every site they visit. It says: *I do not want my personal data sold or shared.*

The signal is sent two ways:

- An HTTP request header: `Sec-GPC: 1`
- A JavaScript property: `navigator.globalPrivacyControl === true`

Both are read-only and trivial to detect server-side or client-side.

## Why it matters

Under the California Consumer Privacy Act (CCPA/CPRA), the California Attorney General has confirmed that GPC is a valid opt-out signal that businesses must honour. Enforcement has followed — Sephora paid \$1.2 million in 2022 in part for failing to process GPC signals. The Colorado Privacy Act explicitly lists GPC-style universal opt-out mechanisms as a required path from July 2024 onward. Connecticut and several other states have followed.

GPC does not replace cookie banners under EU law, because the EU regime is opt-in rather than opt-out. But it is a strong privacy signal everywhere, and respecting it costs almost nothing.

## How to implement

Detect the signal on every request:

```js
// Client-side
if (navigator.globalPrivacyControl) {
  // user has opted out
}
```

```
# Server-side (any language)
if request.headers.get("Sec-GPC") == "1":
    opt_out = True
```

When the signal is present:

- **Do not sell or share** personal information as those terms are defined under the user's applicable law.
- **Do not load advertising trackers**, retargeting pixels, or data-broker tags.
- **Suppress consent-banner "accept" defaults** — the user has already expressed a preference.
- **Record the opt-out** as you would any other privacy request, including the timestamp and the URL.
- **Disclose your behaviour** in the privacy policy: state that you honour GPC and what that means in practice.

For sites that serve both EU and US users, GPC should be treated as one of several inputs alongside cookie consent and any in-product privacy settings. The strictest preference wins.

## Common mistakes

- Ignoring the signal entirely and continuing to load tracking scripts.
- Honouring GPC only for users who identify themselves as Californian. The signal does not include a state, and the AG has been clear: process it for any user who sends it.
- Treating GPC as a cookie banner replacement under GDPR. EU consent is opt-in; GPC is opt-out.
- Failing to mention GPC in the privacy policy, so users have no way to verify the site respects it.
