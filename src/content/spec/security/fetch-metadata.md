---
title: "Fetch Metadata request headers"
slug: fetch-metadata
category: security
summary: "Browsers attach Sec-Fetch-Site, Sec-Fetch-Mode and Sec-Fetch-Dest to every request, describing where it came from and what it is for. A server that reads them can reject cross-site requests it never intended to serve, before any handler runs."
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
updated: "2026-09-04T00:00:00.000Z"
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
---

## What it is

Fetch Metadata is a set of request headers the browser attaches to every outgoing request, describing the context the request was made in. The server never has to ask for them and a page cannot forge them — the `Sec-` prefix makes them [forbidden request headers](https://fetch.spec.whatwg.org/#forbidden-request-header), so script cannot set or change them.

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

That request came from someone else's page, as an `<img>` tag, pointed at a state-changing endpoint. No legitimate use of your site produces it.

**These are request headers you read, not response headers you set.** That is the point most people get backwards on first contact. Every other entry in this category — [CSP](/spec/security/content-security-policy/), [`frame-ancestors`](/spec/security/frame-ancestors/), [`X-Content-Type-Options`](/spec/security/x-content-type-options/) — is something you send and the browser enforces. Fetch Metadata inverts that: the browser sends, and **nothing happens unless your server acts on it**. Adding it to a headers config file does nothing at all.

## Why it matters

Cross-site attacks work by getting the visitor's own browser to make a request the visitor did not intend — a hidden form that posts to your `/settings` endpoint, an `<img>` whose `src` is your `/logout` URL, a `<script>` pointed at a JSON endpoint to read its contents. The requests are indistinguishable from real ones at the network level, because they *are* real: same session cookie, same IP, same user.

Fetch Metadata makes them distinguishable. A password change submitted by your own form arrives as `Sec-Fetch-Site: same-origin`; the same request smuggled in from `evil.example` arrives as `cross-site`. One line of server-side logic separates them, and it separates them for every endpoint at once — including the endpoint someone adds next month and forgets to protect.

That "every endpoint at once" property is what makes it worth the effort. Per-endpoint defences fail by omission: a [CSRF token](/spec/security/cookie-attributes/) protects the forms that have one. A resource isolation policy applied in middleware protects everything behind it by default, so a new route is safe before anyone reviews it.

Support is effectively universal for the three headers that matter — Chrome and Edge since 2020, Firefox since 90, Safari since 16.4 — which is why OWASP now names Fetch Metadata as a primary CSRF defence rather than an experimental extra.

**This site does not ship a resource isolation policy.** It is static and cookieless: there is no session to ride, no state-changing endpoint, and the one endpoint that does accept `POST` — `/reports`, for [browser policy reports](/spec/security/reporting-endpoints/) — is *supposed* to receive requests the user never initiated. There is nothing here for the policy to protect.

## How to implement

Apply the check in one place — middleware, a reverse proxy, an edge function — so it covers every route rather than the routes someone remembered.

Reject the request when **all** of the following hold:

1. `Sec-Fetch-Site` is present (absent means an older client or a non-browser agent — fail open, or you break `curl`, monitoring, and server-to-server calls).
2. `Sec-Fetch-Site` is `cross-site`.
3. `Sec-Fetch-Mode` is not `navigate`, **or** the method is not `GET` — a plain cross-site link to one of your pages is normal traffic and must keep working.
4. `Sec-Fetch-Dest` is not `object` or `embed` — those two are how a cross-site navigation gets weaponised, so block them even when the mode is `navigate`.

Everything else — `same-origin`, `same-site`, and `none` — is allowed.

Then carve out the endpoints that are *meant* to be reached cross-site, and only those: CORS APIs, public embeds, OAuth callbacks, webhook receivers, report collectors, and anything you serve to other people's pages on purpose. These exemptions are the part worth reviewing, because each one is a hole you have deliberately left.

Roll it out in report-only first. Log what the policy *would* have blocked for a week and read the list before enforcing; a legitimate integration you had forgotten about is far more likely to show up than an attack.

## Common mistakes

- **Rejecting requests that have no `Sec-Fetch-Site` header.** Non-browser clients send none. Fail open on absence and let your other defences handle those.
- **Blocking `cross-site` navigations outright.** Every inbound link from another site is `Sec-Fetch-Site: cross-site` with `Sec-Fetch-Mode: navigate`. Block those and your site becomes unreachable from search results.
- **Treating `same-site` as safe when it is not.** `same-site` includes every subdomain of your registrable domain. If you host untrusted content on one — user pages, a legacy app, a sandbox — it clears the check. Compare against `same-origin` for anything that matters.
- **Requiring `Sec-Fetch-User`.** Safari does not send it. A rule that demands it locks out Safari users entirely.
- **Dropping CSRF tokens once the policy is live.** Fetch Metadata is defence in depth alongside [`SameSite` cookies](/spec/security/cookie-attributes/) and tokens, not a replacement for either.
- **Applying the check after the handler has already run.** The value is rejecting before any work happens; a check in the controller has already paid for the database call.

## Verification

Send a request that mimics the attack and confirm it is refused:

```
curl -sI https://example.com/account/settings \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'Sec-Fetch-Mode: no-cors' \
  -H 'Sec-Fetch-Dest: image'
```

Expect a `4xx`. Repeat with `Sec-Fetch-Site: same-origin` and expect the normal response. Then check the two cases that must keep working: a plain cross-site navigation (`Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: navigate`, `GET`) and a request with no `Sec-Fetch-*` headers at all — both should be served.

In DevTools, the request headers panel shows the values the browser actually sent, which is the ground truth when a rule misfires.
