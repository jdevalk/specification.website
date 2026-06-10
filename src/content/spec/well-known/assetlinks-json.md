---
title: "/.well-known/assetlinks.json"
slug: assetlinks-json
category: well-known
summary: "Android's Digital Asset Links file proves that an Android app and a web domain are owned by the same entity. It powers App Links and Smart Lock for Passwords."
status: optional
order: 60
appliesTo: [all]
relatedSlugs: [well-known-overview, apple-app-site-association]
updated: "2026-06-09T11:30:00.000Z"
sources:
  - title: "Digital Asset Links — Verify Android App Links"
    url: "https://developer.android.com/training/app-links/verify-android-applinks"
    publisher: "Google Developers"
  - title: "Digital Asset Links protocol"
    url: "https://developers.google.com/digital-asset-links/v1/getting-started"
    publisher: "Google Developers"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

`assetlinks.json` is Google's equivalent of Apple's [AASA file](/spec/well-known/apple-app-site-association/). It is a JSON document published at `/.well-known/assetlinks.json` that declares which Android applications are allowed to act on behalf of your web domain. Android verifies this file before honouring App Links and several credential-sharing features.

The format is defined by the **Digital Asset Links** protocol, which is also used for cross-app verification and SmartLock.

## Why it matters

- **Android App Links.** With a valid `assetlinks.json`, tapping `https://example.com/orders/123` in Gmail or Chrome opens directly in your app, with no "open with" dialog. Without it, the user lands on the web.
- **Credential sharing.** Saved passwords in Chrome can autofill in the corresponding Android app, and vice versa.
- **Trust.** Google needs cryptographic proof that the same party owns the domain and the app. Hosting this file at a URL only the domain owner controls provides that proof.

If you do not ship an Android app, you do not need this file.

## How to implement

Publish a JSON array. Each entry declares one relation between your site and one app.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.app",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
      ]
    }
  }
]
```

Rules:

- The path is **exactly** `/.well-known/assetlinks.json`. The `.json` extension is required here (unlike Apple's [AASA](/spec/well-known/apple-app-site-association/), which has no extension).
- Serve as **`Content-Type: application/json`** over **HTTPS**.
- Respond with **`200 OK`** directly. No redirects.
- The file must be **publicly readable**, with no authentication and no aggressive bot rules.
- The `sha256_cert_fingerprints` must include the SHA-256 of the signing certificate of every release variant — including the Play App Signing key, not just your upload key.
- Declare every relevant app, including any beta or staging packages.

## Common mistakes

- Listing the upload certificate fingerprint and forgetting Play App Signing's actual signing certificate.
- Leaving out a package because it shares code with another. Each package needs its own entry.
- Serving the file from a subdomain that is not the eTLD+1 the app is associated with.
- Returning a 301 to a CDN host. Google's verifier follows redirects in some cases and not others — do not depend on it.
- Letting a deploy pipeline rewrite JSON keys to camelCase.

## Verification

```
curl -s https://example.com/.well-known/assetlinks.json | jq .
```

Use Google's [Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator) and Android Studio's "App Links Assistant". On a device, `adb shell pm get-app-links com.example.app` shows whether verification succeeded and why if it did not.
