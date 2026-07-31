---
title: "WebSub"
date: "2026-07-23"
reason: too-narrow
revisit: 'Evidence that rel="hub" has become a normal part of publishing a feed rather than a fediverse and IndieWeb speciality — for example, mainstream feed readers or CMSs advertising hubs by default.'
sources:
  - title: "WebSub — W3C Recommendation"
    url: "https://www.w3.org/TR/websub/"
    publisher: "W3C"
---

WebSub turns feed polling into push: a publisher advertises a hub with `<link rel="hub">`, subscribers register with that hub, and the hub delivers new content as it appears instead of every reader re-fetching the feed on a timer. It is a W3C Recommendation, re-published on 2 June 2026 with added cross-site-scripting mitigations for the subscription verification step.

It clears the bar on every count but one. The convention is real, it is implemented, and it is auditable — `rel="hub"` is right there in the feed. But outside the fediverse and the IndieWeb, very few sites publish a hub, and fewer still would benefit: for a site with a handful of new items a week, polling costs almost nothing and adds no moving parts. Recommending a hub to every site that ships a feed would be recommending infrastructure most of them should not run.

The existing pages on [feed discovery](/spec/foundations/feed-discovery/) and [feed hygiene](/spec/foundations/feed-hygiene/) cover what nearly every site actually needs from a feed.
