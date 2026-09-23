---
title: "/.well-known/funding-manifest-urls"
date: "2026-09-23"
reason: too-early
revisit: "Documented use by independent consumers, such as another funder, a package registry or a forge, showing that domain-verified funding metadata provides a useful website convention beyond the currently documented FLOSS/fund tooling."
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

This is a general funding metadata format for open-source projects. It can describe funding needs, payment channels and provenance independently of a particular grant application. The specification lists real publishers, including F-Droid, Python and OpenStreetMap, and links to the FLOSS/fund directory and validator as consumers. Those examples establish publisher adoption and a working use of the format. They do not establish that only grant applicants publish it, or that other funders cannot use it.

For this specification, the remaining question is whether the convention has enough independent consumer adoption to recommend it to websites seeking funding. The sources reviewed document FLOSS/fund's tooling but do not establish broader consumption; that is an evidence limit, not proof that no other reader exists. We therefore record it as **too early** for a standalone recommendation. Documented use by another funder, a forge or a package registry would make the case stronger. Any future page would apply to project funding sites, rather than requiring every website to publish a manifest.
