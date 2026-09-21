---
title: "Google Search profile badges"
date: "2026-09-21"
reason: out-of-scope
revisit: "A machine-readable form of the same claim that more than one consumer reads — a registered link relation, a `rel=\"me\"`-style assertion, or structured data — rather than a downloadable image governed by one vendor's brand guidelines. If the badge is ever replaced by markup a site can be audited for, the topic returns as a structured-data question."
sources:
  - title: "Add a Search profile badge to your website"
    url: "https://developers.google.com/search/docs/appearance/search-profiles"
    publisher: "Google Search Central"
  - title: "HTML Standard — Link types"
    url: "https://html.spec.whatwg.org/multipage/links.html#linkTypes"
    publisher: "WHATWG"
---

A Google Search profile collects a publisher's or creator's output from across the web — their site, YouTube, Instagram, TikTok, X, Facebook — into one destination at `profile.google.com/@handle`, which people can follow to make that content likelier to surface in Discover. On 16 September 2026 Google dropped the follower threshold for claiming one to 10,000 and, alongside that, published guidance for putting a **badge** on your own site so readers can find and follow the profile.

The badge is not a web convention. Technically it is an anchor wrapping a supplied SVG — `<a href="https://profile.google.com/@example"><img src="google-search-badge.svg" alt="Google Search"></a>` — with the asset downloaded from Google and its placement governed by Google's brand guidelines. Nothing about it is parsed, registered, or negotiated. No crawler reads it, no second consumer honours it, and there is no outcome to check from outside beyond "an image is present". That is marketing collateral, and this spec does not tell sites which vendors' logos to display, any more than it covers a newsletter badge or an app-store button.

It is worth recording because the underlying question — _how does a site assert that an off-site profile belongs to it?_ — is a real one that the web already answers in vendor-neutral ways. Link relations carry that claim in a registered, machine-readable form, and `Organization` markup with `sameAs` says the same thing to anyone parsing [structured data](/spec/seo/structured-data/), not just to one search engine. Those are the routes a page here would describe. A downloadable badge is the reference case for the opposite: a vendor affordance rendered on your page, which changes how a product treats you rather than what your website is.
