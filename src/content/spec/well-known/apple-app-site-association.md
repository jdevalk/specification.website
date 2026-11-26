---
title: "/.well-known/apple-app-site-association"
slug: apple-app-site-association
category: well-known
summary: "A JSON file that tells iOS, iPadOS and macOS which Apple apps may handle which URLs on your domain. Required for Universal Links and several other Apple features."
status: optional
order: 50
appliesTo: [all]
relatedSlugs: [well-known-overview, assetlinks-json]
updated: "2026-11-26T00:00:00.000Z"
sources:
  - title: "Apple — Supporting associated domains"
    url: "https://developer.apple.com/documentation/xcode/supporting-associated-domains"
    publisher: "Apple Developer Documentation"
  - title: "Apple — Allowing apps and websites to link to your content"
    url: "https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content"
    publisher: "Apple Developer Documentation"
  - title: "IANA — Well-Known URIs Registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

`apple-app-site-association` (often abbreviated **AASA**) is a JSON file Apple platforms fetch from your domain to verify that you authorise specific apps to handle specific URLs. It powers Universal Links (opening web URLs directly in an app), Handoff between web and app, Shared Web Credentials, and AutoFill of strong passwords across web and app.

It must live at `https://example.com/.well-known/apple-app-site-association`. Apple no longer accepts the legacy root-path location.

## Why it matters

- **Universal Links.** Without a valid AASA, a tap on `https://example.com/orders/123` in Mail or Messages opens Safari instead of your app. The whole "deep linking that survives links being shared" model depends on this file.
- **Password sharing.** Shared Web Credentials lets a password saved in Safari autofill in the corresponding app, and vice versa. It is gated by AASA.
- **Trust.** The fact that you control the domain and can publish this file is what Apple uses to prove that an app may claim URLs on your domain. There is no other mechanism.

If you do not have an iOS, iPadOS, macOS or visionOS app, you do not need this file.

## How to implement

Serve a JSON document with the App IDs and URL patterns that may handle your domain.

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["ABCDE12345.com.example.app"],
        "components": [
          { "/": "/orders/*" },
          { "/": "/users/*/profile" }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["ABCDE12345.com.example.app"]
  }
}
```

Rules:

- The path is **exactly** `/.well-known/apple-app-site-association` with **no `.json` extension**.
- The response **Content-Type must be `application/json`**.
- The response must be served over **HTTPS** with a valid certificate. No redirects: respond with `200` directly.
- The file must be **publicly accessible** with no authentication, no rate limiting that blocks Apple's CDN, and no `Vary` header that breaks caching.
- Apple fetches the file through its own CDN (`app-site-association.cdn-apple.com`). Allow that user agent through your WAF.
- Keep the JSON **valid** and under Apple's size limit (currently 128 KB).

## Common mistakes

- Adding a `.json` extension because a server forced one.
- Serving with `Content-Type: text/plain` or `text/html`.
- Returning a redirect. Apple treats a redirect as a hard failure.
- Hiding the file behind Cloudflare's "Under Attack" mode, a login page, or a country block.
- Using only `paths` (the old key) without `components`. Modern iOS versions prefer `components`; ship both during migration.

## Verification

```
curl -I https://example.com/.well-known/apple-app-site-association
```

You should see `200 OK` and `Content-Type: application/json`. Apple retired its web-based App Search API Validation Tool, so checking how Apple itself reads the file now happens on Apple hardware. On a Mac, `sudo swcutil dl -d example.com` confirms the file can be downloaded and `swcutil verify` tests a URL against its patterns. On a device in Developer Mode, Settings > Developer > Universal Links > Diagnostics reports whether a given URL is valid for an installed app. Both are described in Apple's [TN3155: Debugging universal links](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links).
