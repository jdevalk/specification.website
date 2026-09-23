---
title: "Google Search profile badges"
date: "2026-09-23"
reason: out-of-scope
revisit: "A distinct, interoperable profile-identity convention consumed by independent systems, beyond the ordinary hyperlink in the badge. If one emerges, assess it alongside existing link-relation and structured-data guidance."
sources:
  - title: "Add a Search profile badge to your website"
    url: "https://developers.google.com/search/docs/appearance/search-profiles"
    publisher: "Google Search Central"
  - title: "HTML Standard — Link types"
    url: "https://html.spec.whatwg.org/multipage/links.html#linkTypes"
    publisher: "WHATWG"
---

A Google Search profile collects a publisher's or creator's output from across the web into one destination at `profile.google.com/@handle`. Readers can follow it to make the linked content more likely to appear for them in Discover. Google's guidance, updated on 16 September 2026, explains how to link to that profile using a **badge** on your own site.

The badge is an ordinary HTML link wrapping a supplied image, with placement governed by Google's brand guidelines. Browsers and crawlers can process that hyperlink, and its destination and accessible name can be checked. Google's instructions also permit a plain text link. They do not define a separate badge protocol or additional machine-readable identity semantics. The badge therefore does not warrant its own spec page: existing link and image guidance covers its technical behaviour, while choosing to display a vendor's branding is outside this specification's scope.

The broader question of associating a site with an off-site identity belongs with link relations and [structured data](/spec/seo/structured-data/), such as `sameAs` on the relevant `Person` or `Organization`. Those mechanisms state relationships explicitly; an ordinary badge link does not acquire the same semantics merely by displaying a logo. We would revisit the topic if a distinct interoperable identity convention emerged, rather than treating this particular visual asset as a website requirement.
