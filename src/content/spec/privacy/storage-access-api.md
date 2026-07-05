---
title: "Storage Access API"
slug: storage-access-api
category: privacy
summary: "As browsers partition and block third-party cookies, embedded cross-site content uses the Storage Access API to request its own cookies behind a user gesture — instead of asking visitors to switch off tracking protection."
status: optional
order: 45
appliesTo: [all]
relatedSlugs: [third-party-scripts, cookie-consent, security/cookie-attributes, security/permissions-policy]
updated: "2026-07-05T10:00:00.000Z"
sources:
  - title: "The Storage Access API"
    url: "https://privacycg.github.io/storage-access/"
    publisher: "W3C Privacy Community Group"
  - title: "MDN — Storage Access API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API"
    publisher: "MDN"
  - title: "MDN — Document: requestStorageAccess() method"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/requestStorageAccess"
    publisher: "MDN"
---

## What it is

The Storage Access API lets cross-site content loaded in a third-party context — embedded in an `<iframe>` — request access to its own unpartitioned cookies and storage: the state it would have as a first-party document but is denied when embedded. An embed calls `document.hasStorageAccess()` to check, and `document.requestStorageAccess()`, behind a user gesture, to ask. The browser grants or denies, sometimes after prompting the user. It is standardised by the W3C Privacy Community Group and ships in Chrome, Firefox, Safari, and Edge.

## Why it matters

Browsers are phasing out unrestricted third-party cookies to stop cross-site tracking. Firefox (Total Cookie Protection) and Safari (Intelligent Tracking Prevention) partition or block them by default, and Chrome is moving the same way. That also breaks legitimate cross-site flows: single sign-on with a federated identity provider, a shared account or comment widget, or personalisation served from a sibling domain. The old workaround — telling visitors to disable tracking protection or add an exception — trades every user's privacy for one site's convenience, and increasingly does not work at all. The Storage Access API is the standards-track replacement: it restores access for the specific, legitimate case behind an explicit user gesture, without reopening the site to tracking.

## How to implement

- Reach for it only when embedded content genuinely needs its own unpartitioned cookies — SSO, federated identity, a signed-in widget. A first-party site setting its own cookies never needs it.
- From the embed, call `hasStorageAccess()`; if it is false, call `requestStorageAccess()` inside a click or tap handler — it requires transient activation (a user gesture). Await the promise, load the credentialed view on success, and degrade gracefully on rejection.
- Cookies must be `SameSite=None; Secure` to travel cross-site (see [cookie attributes](/spec/security/cookie-attributes/)), and the whole flow works only in a secure (HTTPS) context.
- The embedding page must permit it: an `allow-storage-access-by-user-activation` sandbox token on a sandboxed iframe, and no `storage-access` [Permissions-Policy](/spec/security/permissions-policy/) blocking it.
- For already-granted permissions and passive resources, the `Sec-Fetch-Storage-Access` request header and `Activate-Storage-Access` response header let the server skip a round trip; add `Vary: Sec-Fetch-Storage-Access` when you branch on it.

## Common mistakes

- Calling `requestStorageAccess()` outside a user gesture — it rejects without transient activation.
- Forgetting `SameSite=None; Secure`, so cookies are never sent even after access is granted.
- Treating a grant as permanent; grants lapse (around 30 days without interaction) and must be re-activated per context.
- Using it as a tracking loophole. Browsers gate it on prior first-party interaction and user prompts precisely to prevent that.

## Verification

- In an embedded frame, log `await document.hasStorageAccess()` before and after the request flow.
- Check the browser's storage or privacy panel for the granted `storage-access` permission, keyed to `<top-level site, embedded site>`.
- Confirm the credentialed request carries cookies in the DevTools network panel, and that `Sec-Fetch-Storage-Access` reports `none` / `inactive` / `active` as expected.
