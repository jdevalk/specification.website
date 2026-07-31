---
title: "The HTTP QUERY method (RFC 10008)"
date: "2026-07-23"
reason: out-of-scope
revisit: "Nothing likely. If a discovery convention grows around it — a well-known URI, or a Link relation that advertises QUERY support — that convention would be the topic, not the method."
sources:
  - title: "RFC 10008 — The HTTP QUERY Method"
    url: "https://www.rfc-editor.org/rfc/rfc10008.html"
    publisher: "IETF"
---

`QUERY` is a safe, idempotent HTTP method that carries a request body, filling the long-standing gap between `GET` (safe and cacheable, but no body) and `POST` (body, but neither). It is a real addition to the platform, published as a Proposed Standard in June 2026.

It is also a property of an API, not of a website. A site does not become better for a visitor, a crawler, or an agent by supporting `QUERY`; the sites that need it are the ones exposing a search or filter API, and for them the method is an implementation choice among several reasonable ones. There is nothing here to check from the outside and no outcome to describe in terms of the people using the site.

That is the line this spec draws throughout: HTTP methods are how you build a thing, not what a good website does.
