---
title: "Fetch Metadata request headers"
slug: fetch-metadata
category: security
summary: "Read Sec-Fetch-Site, Sec-Fetch-Mode and Sec-Fetch-Dest to reject unwanted cross-site browser requests before a handler runs. Keep ordinary inbound links working and retain other CSRF defences."
status: recommended
order: 63
appliesTo: [all]
relatedSlugs:
  [
    cookie-attributes,
    frame-ancestors,
    cross-origin-isolation,
    x-content-type-options,
    content-security-policy,
  ]
updated: "2026-09-10T00:00:00.000Z"
sources:
  - title: "Fetch Metadata Request Headers"
    url: "https://www.w3.org/TR/fetch-metadata/"
    publisher: "W3C Web Application Security Working Group"
  - title: "Cross-Site Request Forgery Prevention Cheat Sheet — Fetch Metadata headers"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"
    publisher: "OWASP"
  - title: "MDN — Fetch metadata"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Fetch_metadata"
    publisher: "MDN"
  - title: "Protect your resources from web attacks with Fetch Metadata"
    url: "https://web.dev/articles/fetch-metadata"
    publisher: "Google"
---

## What it is

Fetch Metadata is a set of headers browsers attach to requests to potentially trustworthy URLs, such as HTTPS endpoints, describing the request's context. The server does not need to opt in. Page JavaScript cannot set or change them because the `Sec-` prefix makes them [forbidden request headers](https://fetch.spec.whatwg.org/#forbidden-request-header). Non-browser clients can supply arbitrary values, so these headers do not authenticate a caller.

Three of them carry the useful signal:

- **`Sec-Fetch-Site`** — the relationship between the initiator and the target: `same-origin`, `same-site`, `cross-site`, or `none` (the user typed the URL or used a bookmark).
- **`Sec-Fetch-Mode`** — how the request was made: `navigate`, `cors`, `no-cors`, `same-origin`, `websocket`.
- **`Sec-Fetch-Dest`** — what the result will be used as: `document`, `image`, `script`, `style`, `iframe`, `empty`, and so on.

A fourth, `Sec-Fetch-User`, is sent only on navigations triggered by real user activation. It is the odd one out: Safari has never shipped it, so a rule that requires it will misjudge every Safari visitor.

```http
GET /account/delete HTTP/1.1
Sec-Fetch-Site: cross-site
Sec-Fetch-Mode: no-cors
Sec-Fetch-Dest: image
```

In a browser, that request came from someone else's page as an `<img>` tag. A deletion endpoint should reject it. It must also reject state changes through `GET`, independently of Fetch Metadata.

**These are request headers you read, not response headers you set.** That is the point most people get backwards on first contact. Every other entry in this category — [CSP](/spec/security/content-security-policy/), [`frame-ancestors`](/spec/security/frame-ancestors/), [`X-Content-Type-Options`](/spec/security/x-content-type-options/) — is something you send and the browser enforces. Fetch Metadata inverts that: the browser sends, and **nothing happens unless your server acts on it**. Adding it to a headers config file does nothing at all.

## Why it matters

Cross-site attacks work by getting the visitor's own browser to make a request the visitor did not intend — a hidden form that posts to your `/settings` endpoint, an `<img>` whose `src` is your `/logout` URL, a `<script>` pointed at a JSON endpoint to read its contents. The requests are indistinguishable from real ones at the network level, because they *are* real: same session cookie, same IP, same user.

Fetch Metadata makes them distinguishable. A password change submitted by your own form arrives as `Sec-Fetch-Site: same-origin`; the same request smuggled in from `evil.example` arrives as `cross-site`. One line of server-side logic separates them, and it separates them for every endpoint at once — including the endpoint someone adds next month and forgets to protect.

Applying a resource isolation policy in middleware gives new routes a common baseline. It does not establish that a route is safe: authentication, authorisation, safe HTTP methods and [CSRF protection](/spec/security/cookie-attributes/) still need review.

Support is effectively universal for the three headers that matter — Chrome and Edge since 2020, Firefox since 90, Safari since 16.4 — which is why OWASP now names Fetch Metadata as a primary CSRF defence rather than an experimental extra.

**This site does not apply a resource isolation policy to its public spec pages.** They serve public, cookieless content; the [browser policy report collector](/spec/security/reporting-endpoints/) deliberately accepts reports sent by browsers. Other endpoints still need their own access controls.

## How to implement

Apply the check in one place — middleware, a reverse proxy, an edge function — so it covers every route rather than the routes someone remembered.

Use an ordered policy, following the [resource isolation example](https://web.dev/articles/fetch-metadata):

1. Identify endpoints that deliberately accept cross-site requests, such as CORS APIs, public embeds, OAuth callbacks and report collectors. Give each exemption its own appropriate validation.
2. If `Sec-Fetch-Site` is absent, fall back to your existing protections, such as CSRF tokens and Origin checks. Absence must not bypass those checks or authentication.
3. Allow `same-origin` and `none` through this policy. Allow `same-site` only if you trust every relevant subdomain; otherwise treat it like `cross-site`.
4. For cross-site requests, allow a navigation only when **all three** conditions hold: the method is `GET`, `Sec-Fetch-Mode` is `navigate`, and `Sec-Fetch-Dest` is neither `object` nor `embed`.
5. Reject the remaining non-exempt cross-site requests, normally with `403`.

This permits an ordinary inbound document link while rejecting a cross-site `GET` navigation into an `object` or `embed`. Keep [`frame-ancestors`](/spec/security/frame-ancestors/) for controlling iframe embedding; this policy does not replace it.

When the policy changes a cacheable response, include the request fields it uses in `Vary`, as the [W3C deployment guidance](https://www.w3.org/TR/fetch-metadata/#vary) explains. For the policy above, append `Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest` to any existing `Vary` fields on allowed and denied responses. Otherwise a cache can reuse an allowed response for a request the policy would reject, or serve a cached denial to a legitimate visitor.

Roll it out in report-only first. Log what the policy *would* have blocked for a week and read the list before enforcing; a legitimate integration you had forgotten about is far more likely to show up than an attack.

## Common mistakes

- **Treating missing headers as proof of safety.** Use the endpoint's existing CSRF and authentication checks when metadata is absent; many non-browser clients omit it.
- **Blocking `cross-site` navigations outright.** Every inbound link from another site is `Sec-Fetch-Site: cross-site` with `Sec-Fetch-Mode: navigate`. Block those and your site becomes unreachable from search results.
- **Treating `same-site` as safe when it is not.** `same-site` includes every subdomain of your registrable domain. If you host untrusted content on one — user pages, a legacy app, a sandbox — it clears the check. Compare against `same-origin` for anything that matters.
- **Requiring `Sec-Fetch-User`.** Safari does not send it. A rule that demands it locks out Safari users entirely.
- **Dropping CSRF tokens once the policy is live.** Fetch Metadata is defence in depth alongside [`SameSite` cookies](/spec/security/cookie-attributes/) and tokens, not a replacement for either.
- **Applying the check after the handler has already run.** The value is rejecting before any work happens; a check in the controller has already paid for the database call.

## Verification

Send a request that mimics the attack and confirm it is refused:

```sh
curl -s -o /dev/null -w '%{http_code}\n' https://example.com/account/settings \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'Sec-Fetch-Mode: no-cors' \
  -H 'Sec-Fetch-Dest: image'
```

Expect a `403` from this policy. Repeat with `Sec-Fetch-Site: same-origin` and expect the endpoint's normal response. Test a cross-site `GET` with mode `navigate` and destination `document`: the policy should allow it. Repeat with destination `object`, then `embed`: both should be rejected. With metadata omitted, confirm that the endpoint's existing protections still run.

Repeat allowed and denied requests through the cache in both orders. Verify the `Vary` fields and confirm that one request does not prime the cache with a response reused for the other.

In DevTools, the request headers panel shows the values the browser actually sent, which is the ground truth when a rule misfires.
