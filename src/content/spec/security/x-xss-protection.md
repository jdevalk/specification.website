---
title: "X-XSS-Protection"
slug: x-xss-protection
category: security
summary: "A dead header that roughly a third of major sites still send. No shipping browser reads it, it was never standardised, and the values people copy-paste were the dangerous ones. Stop sending it and rely on CSP."
status: avoid
order: 96
appliesTo: [all]
relatedSlugs:
  [content-security-policy, trusted-types, x-content-type-options, frame-ancestors]
updated: "2026-08-08T00:00:00.000Z"
sources:
  - title: "MDN — X-XSS-Protection"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-XSS-Protection"
    publisher: "MDN"
  - title: "W3C — Content Security Policy Level 3"
    url: "https://www.w3.org/TR/CSP3/"
    publisher: "W3C"
  - title: "OWASP — Cross Site Scripting Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
    publisher: "OWASP"
---

## What it is

`X-XSS-Protection` was a response header that switched on a browser's built-in reflected-XSS filter — Internet Explorer's XSS Filter, and later Chrome's and Safari's XSS Auditor. The filter compared the request URL against the response body; when a chunk of the query string turned up inside the returned HTML as script, the browser assumed an attack and either stripped that chunk or refused to render the page at all.

```http
X-XSS-Protection: 0             # filter off
X-XSS-Protection: 1             # filter on, sanitise the page
X-XSS-Protection: 1; mode=block # filter on, refuse to render the page
```

Two things about it are widely misremembered.

**It is not a standard.** It appears in no WHATWG, W3C, or IETF document, and never did. It was a vendor feature with a `X-` name that spread by copy-paste through hardening guides.

**`1; mode=block` was the harmful setting, not the safe one.** That is the value nearly every "secure headers" snippet recommends, and it is backwards: the values that turned the filter *on* are the ones that introduced problems, and `0` — the value that reads like you are disabling security — was the defensible one. That inversion is why the header is worth a page rather than a shrug.

Today the argument is moot, because nothing implements it. Firefox never shipped the filter. Edge dropped it in version 17, Chrome in version 78, and Safari in 15.4. Any browser a visitor is realistically using ignores every value above.

## Why it matters

A filter that rewrites your response based on a URL an attacker controls is a mechanism the attacker can aim. Because the filter decided what to suppress by matching the request against the body, an attacker could put a *legitimate* fragment of your own page into the query string and have the browser remove it — turning a safe page unsafe. MDN's worked example is the classic shape: a page sets `productionMode = true` in one inline script and guards debug code on it in another. Feed the first script back through the query string, the filter removes it as a suspected injection, `productionMode` evaluates to `undefined`, and the debug branch runs. Nothing on the server changed. The same selective-suppression trick was extended into cross-origin side channels, using the filter's block behaviour as an oracle for whether a given string appeared in a page the attacker could not otherwise read. That is what got the auditors removed: they cost more than they caught.

Now that no browser reads the header, the harm has changed shape rather than disappeared. Mark Nottingham's [survey of 120 million HTTP responses](https://mnot.net/blog/2026/linting_the_web) found `X-XSS-Protection` on 29% of the Tranco top 100,000 — within a few points of the 32% that send a Content-Security-Policy, which is the defence that actually replaces it. Its persistence is the point: it is the header nobody has to think about, so it stays in the config forever, and it keeps scoring points on security-header scanners that grade on presence rather than effect. A team can read a green report, believe reflected XSS is handled, and have shipped nothing that stops it.

## How to implement

Delete the header.

Removing it entirely is better than setting `X-XSS-Protection: 0`. The zero value existed to switch off a filter that no longer exists; sending it now just documents that you once had to think about this. If a compliance checklist insists the header be present with a specific value, `0` is the only value to give it — never `1` or `1; mode=block`.

Then do the work the header was pretending to do. Reflected XSS is defeated by [a Content Security Policy](/spec/security/content-security-policy/) that does not allow `'unsafe-inline'` in `script-src`, so an injected `<script>` has no way to execute; by context-correct output encoding wherever request data reaches HTML; and, for DOM-based sinks, by [Trusted Types](/spec/security/trusted-types/). OWASP's Cross Site Scripting Prevention Cheat Sheet covers the encoding rules per context, and — telling in itself — does not mention `X-XSS-Protection` anywhere.

This site sends no `X-XSS-Protection` header; see [`public/_headers`](https://github.com/jdevalk/specification.website/blob/main/public/_headers), which sets a CSP with no `'unsafe-inline'` on `script-src` instead.

## Common mistakes

- **Reading the `X-` prefix as "same family as `X-Content-Type-Options`".** [`X-Content-Type-Options: nosniff`](/spec/security/x-content-type-options/) shares the naming accident and nothing else: it is specified in the WHATWG Fetch Standard, implemented everywhere, and required. Legacy-looking name, current header.
- **Copying a hardening snippet that sets `1; mode=block`.** Most published header bundles still do. Check the date on any guide that recommends it — it predates the removals.
- **Treating a scanner's green tick as coverage.** Tools that score on header presence cannot tell an inert header from a working defence. The question to ask about a security header is which shipping browser acts on it.
- **Leaving it in place "for old browsers".** The only engine that would act on it is Internet Explorer, and a site still serving IE has a longer list of problems than this one.

## Verification

- `curl -sI https://example.com | grep -i x-xss-protection` should return nothing.
- Check the whole chain, not just the origin: CDNs, WAFs, reverse proxies, and framework security middleware all inject this header by default in some configurations, so a clean origin config does not prove a clean response.
- Confirm the replacement actually landed: the response carries a `Content-Security-Policy` whose `script-src` has no `'unsafe-inline'`.
