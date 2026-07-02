---
title: "Subresource Integrity (SRI)"
slug: subresource-integrity
category: security
summary: "SRI adds a cryptographic hash to every third-party script and stylesheet so the browser refuses to run modified files. Essential for any external JS or CSS you depend on."
status: recommended
order: 90
appliesTo: [all]
relatedSlugs: [content-security-policy, https-tls, x-content-type-options, trusted-types, reporting-endpoints]
updated: "2026-07-02T00:00:00.000Z"
sources:
  - title: "Subresource Integrity (W3C Recommendation)"
    url: "https://www.w3.org/TR/SRI/"
    publisher: "W3C"
  - title: "Subresource Integrity — §3.8 Integrity-Policy (W3C Editor's Draft)"
    url: "https://w3c.github.io/webappsec-subresource-integrity/#integrity-policy-section"
    publisher: "W3C"
  - title: "MDN — Integrity-Policy header"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Integrity-Policy"
    publisher: "MDN"
  - title: "OWASP — Third Party JavaScript Management Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html"
    publisher: "OWASP"
---

## What it is

Subresource Integrity is a W3C standard that lets you pin the exact content of a script or stylesheet. You include a cryptographic hash of the file in the `integrity` attribute, and the browser refuses to execute the resource if the hash does not match.

```html
<script
  src="https://cdn.example.com/widget.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>
```

SRI applies to `<script>` and `<link rel="stylesheet">`, and also `<link rel="preload">` and `<link rel="modulepreload">`.

## Why it matters

Every external script you load runs with full access to your origin. If the CDN is compromised, if an attacker buys an abandoned npm package, or if a CDN ops mistake swaps a file, that script can read cookies, exfiltrate form data, and rewrite the DOM. SRI shifts trust from "the CDN is currently honest" to "the file is byte-for-byte the one we audited".

This is the standard defence against the kind of supply-chain attack that hit Magecart, Polyfill.io, and Event-Stream. CSP can restrict which hosts you trust; SRI restricts which specific files you trust on those hosts.

## How to implement

For every external script or stylesheet, compute a SHA-384 hash of the exact file content and include it in the `integrity` attribute. Add `crossorigin="anonymous"` so the browser sends a CORS request and can verify the response without credentials.

```html
<link
  rel="stylesheet"
  href="https://cdn.example.com/styles.css"
  integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
  crossorigin="anonymous"
>
```

Generate the hash on the command line:

```
curl -s https://cdn.example.com/widget.js | openssl dgst -sha384 -binary | openssl base64 -A
```

SRI supports `sha256`, `sha384`, and `sha512`. SHA-384 is the recommended default. You may list multiple hashes separated by spaces; the browser passes the resource if any one matches — useful for a graceful version rollover.

Pair SRI with a strict CSP. CSP says "only load scripts from these hosts"; SRI says "and only this exact file from that host".

## Enforce it site-wide with Integrity-Policy

A per-element `integrity` attribute is easy to forget on the next script someone adds. The `Integrity-Policy` response header closes that gap: it tells the browser to block any script (or, behind a flag, stylesheet) that loads without integrity metadata, so a missing hash fails loudly instead of silently. It also blocks any script requested in `no-cors` mode, so every `<script>` the policy governs — including same-origin ones — needs a `crossorigin` attribute alongside `integrity`, or it is blocked even when its hash is correct.

```
Integrity-Policy: blocked-destinations=(script)
Integrity-Policy-Report-Only: blocked-destinations=(script), endpoints=(integrity-endpoint)
```

Start in report-only mode. `Integrity-Policy-Report-Only` enforces nothing but sends an `IntegrityViolationReport` to a named [Reporting API](/spec/security/reporting-endpoints/) endpoint for every resource that _would_ be blocked, so you can find un-hashed scripts before you turn enforcement on. The header is supported across Chromium, Firefox, and Safari, though Firefox currently logs violations to the console rather than delivering them to the endpoint.

This site ships `Integrity-Policy-Report-Only: blocked-destinations=(script)` (see its `_headers`) as a regression tripwire: every first-party script carries integrity — computed at build time — so a clean report stream is the signal that enforcing `Integrity-Policy` is safe. Because a script served from a mutable third-party URL cannot be pinned, the analytics loader here is self-hosted as a frozen, hashed copy (refreshed daily) rather than loaded live; anything you truly cannot pin must be dropped before you enforce.

## Common mistakes

- **Forgetting `crossorigin="anonymous"`.** Without it, the browser silently refuses to validate the integrity and the script is blocked.
- **Pinning to a "latest" CDN URL.** The hash and the URL must match a specific immutable version. Use `/widget@1.2.3/widget.js`, never `/widget/widget.js`.
- **Updating the script but not the hash.** The page breaks. Automate hash generation in your build.
- **Using SRI on first-party assets you already control.** It is harmless but not the highest-value place to spend the effort; reserve attention for third parties.

## Verification

- View source. Every `<script src="https://…">` and external `<link rel="stylesheet">` should have an `integrity` and `crossorigin` attribute.
- Tamper with a byte of the file (via a local proxy) and confirm the browser refuses to run it; the console reports "Failed to find a valid digest".
- Use a tool like [SRI Hash Generator](https://www.srihash.org/) to compute hashes for ad-hoc checks.
- Audit dependency upgrades: any time a third-party file URL changes, the hash must change with it.
