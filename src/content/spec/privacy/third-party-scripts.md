---
title: "Third-party scripts and privacy"
slug: third-party-scripts
category: privacy
summary: "Every script loaded from another domain can read cookies, see the URL, and exfiltrate data from your page. Audit them, justify them, and lock them down."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [cookie-consent, analytics-privacy, storage-access-api, security/content-security-policy, security/subresource-integrity]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "MDN — Content Security Policy (CSP)"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
    publisher: "MDN"
  - title: "EDPB Guidelines 2/2023 on Technical Scope of Art. 5(3) ePrivacy Directive"
    url: "https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en"
    publisher: "EDPB"
  - title: "MDN — Subresource Integrity"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity"
    publisher: "MDN"
---

## What it is

A third-party script is any `<script src="…">` whose source is not your own origin. Once it loads, it runs with full access to the page: the DOM, cookies that are not `HttpOnly`, localStorage, the URL, the referrer, form inputs as the user types, and any data your own JavaScript exposes.

The browser also tells the third party about the visit at the network layer: IP address, user-agent, Accept-Language, the page that loaded the script (Referer), and any cookies that domain has set.

## Why it matters

Third-party scripts are the largest source of unintended data leaks on the modern web. A single tag for a chat widget, A/B tester, fonts service, or "session replay" tool can ship every URL a logged-in user visits to a third party. Some of those tools record keystrokes by default.

From a legal standpoint, the EDPB has confirmed that the ePrivacy Directive applies to any technology that reads or writes to the user's device, not just cookies — so a tracking pixel without a cookie is still in scope. From a security standpoint, a compromised third-party script becomes a compromise of your site. *Magecart*-style supply-chain attacks have hit British Airways, Ticketmaster, and many smaller sites by injecting code into a single trusted vendor.

## How to implement

Treat every third party as a liability you are choosing to take on.

- **Audit what you have.** Use the network panel, or a tool like Request Map, to list every domain your pages contact. Most sites are surprised.
- **Justify each one.** What does it do, who owns it, what data does it receive, and what is the business case for keeping it? Anything that fails this should be removed.
- **Self-host where you can.** Fonts, JavaScript libraries, and icon sets rarely need to come from a CDN. Self-hosting eliminates a third-party contact entirely and is often faster.
- **Defer or gate the rest.** Anything that is not essential to first render should load after user interaction, or only after consent for non-essential storage.
- **Use a Content Security Policy.** A `script-src` allowlist prevents a compromised page from loading scripts you did not approve. See `security/content-security-policy`.
- **Use Subresource Integrity** for any script you must load from a third party where the URL is stable. An SRI hash ensures the file has not changed since you audited it. See `security/subresource-integrity`.
- **Set a Referrer-Policy** of `strict-origin-when-cross-origin` or stricter. It trims the URL carried in the `Referer` header the browser sends when it fetches a third-party resource, so a pixel or image endpoint sees your origin rather than the full path and query string.

## Common mistakes

- Loading dozens of marketing tags through a tag manager and treating the tag manager as the audit.
- Hot-linking fonts or libraries from a public CDN to "save bandwidth" while leaking visitor IPs to that CDN.
- Adding session-replay tools without checking what they record. Many capture passwords and credit cards by default.
- Setting a permissive CSP (`script-src *`) that defeats the protection.
- Expecting `Referrer-Policy` to hide the URL from a third-party script. It controls the `Referer` header only. A script loaded with `<script src>` runs inside your document and reads `location.href` directly, whatever the policy says. The policy limits what a fetched resource is told, not what an executing script can see, so the two protections are not interchangeable.
- Auditing once at launch and never again.
