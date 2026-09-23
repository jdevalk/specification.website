---
title: "/.well-known/funding-manifest-urls"
date: "2026-09-23"
reason: too-narrow
revisit: "A second independent consumer reading funding.json — a package registry, a forge, or another funder — rather than one directory crawling for one grant programme. At that point the topic stops being 'how to be found by FLOSS/fund' and becomes 'how a project declares its funding needs machine-readably', which would be worth a page."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615.html"
    publisher: "IETF"
  - title: "funding.json — an open manifest schema for open source projects"
    url: "https://fundingjson.org/"
    publisher: "FLOSS/fund"
  - title: "FLOSS/fund directory"
    url: "https://dir.floss.fund/"
    publisher: "FLOSS/fund"
---

`funding-manifest-urls` has been a **provisional** entry in the IANA Well-Known URIs registry since 2 April 2025, with `info@floss.fund` as change controller and `fundingjson.org` as its reference. It is not the funding manifest itself. The manifest — `funding.json`, a JSON document describing who maintains a project, what it needs money for, and how to send it — lives at an ordinary URL of the publisher's choosing. The well-known file is the proof of control that sits underneath it: a plain-text list, one URL per line, saying "these manifests are allowed to speak for this domain". A manifest hosted on `example.com` that claims a project at `project.net` is unverified until `project.net/.well-known/funding-manifest-urls` names it back.

The mechanism is sound and the scope test is close to passing: it is a file a content origin serves, it is checkable from outside, and cross-origin claims genuinely do need something like it. What it is not is a property of websites in general. It answers one question — how an open-source project proves a funding claim — for one audience, and it is read, in practice, by one crawler: the FLOSS/fund directory, built to distribute a single annual grant pool. Real projects have published manifests, F-Droid and MetaBrainz among them, so this is not a standard nobody uses. It is a standard used by everybody who wants that grant and nobody who does not.

That makes it narrow rather than early, and the distinction matters for what would change our mind. Waiting longer will not help; more publishers joining the same directory would only make the same programme bigger. What would help is a second reader — a package registry, a forge, another funder — parsing `funding.json` for its own purposes. Domain-verified funding metadata that several independent systems consume is a website outcome. A manifest that one grant programme crawls is an application form with a URL.
