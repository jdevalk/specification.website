---
title: "The HTML doctype"
slug: doctype
category: foundations
summary: "Every HTML document must start with <!doctype html> as its first line. This opts the browser into standards mode; without it, you get quirks mode and broken layout."
status: required
order: 10
appliesTo: [all]
relatedSlugs: [html-lang, meta-charset, meta-viewport]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "HTML Living Standard — The DOCTYPE"
    url: "https://html.spec.whatwg.org/multipage/syntax.html#the-doctype"
    publisher: "WHATWG"
  - title: "MDN — Doctype"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Doctype"
    publisher: "MDN"
  - title: "MDN — Quirks Mode and Standards Mode"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Quirks_Mode_and_Standards_Mode"
    publisher: "MDN"
---

## What it is

The doctype is a short declaration at the very top of an HTML document that tells the browser which rendering mode to use. In modern HTML, there is exactly one correct form:

```html
<!doctype html>
```

It is case-insensitive, so `<!DOCTYPE html>` is equally valid. It must be the first thing in the document, before `<html>`, with no whitespace, comments, or byte-order mark trickery in front of it.

Despite how it looks, the doctype does not declare a version of HTML. The old `HTML 4.01 Transitional` and `XHTML 1.0 Strict` doctypes pointed at a DTD, so reading them as "this document is written in that version" was fair. `<!doctype html>` carries no version and switches on no "HTML5 mode". The modern elements and features you may use do not depend on it: `<section>`, `<video>`, and the rest parse with or without a doctype. Its only job is to choose the rendering mode: present and well-formed gives standards mode, absent or malformed gives quirks mode.

## Why it matters

Without a doctype, browsers fall back to **quirks mode** — a compatibility layer that emulates the buggy behaviour of browsers from the late 1990s. In quirks mode:

- The CSS box model changes (widths include padding and border, like the old IE5 model).
- Inline elements behave differently around whitespace.
- Many modern CSS features are unreliable or disabled.
- Table cell heights, image alignment, and font sizing all shift.

With `<!doctype html>` you get **standards mode**, where the browser follows current specifications. There is also a "limited-quirks" (almost-standards) mode triggered by some legacy doctypes, but you should never need it.

In short: one missing line at the top of the document silently changes how every CSS rule on the page is interpreted. It is the cheapest correctness fix on the web.

## How to implement

Put the doctype on line one of every HTML response. No XML prolog, no comment, no blank line:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Page title</title>
  </head>
  <body>...</body>
</html>
```

Replace any legacy HTML 4 or XHTML doctype with `<!doctype html>`. The short form is part of the HTML Living Standard and works in every browser back to IE6.

For XML-serialised HTML (XHTML served as `application/xhtml+xml`), the doctype is optional, but the document must still parse as XML. Almost no public sites need this — serve HTML.

## Common mistakes

- A blank line, comment, or BOM before `<!doctype html>`. Anything before the doctype can trigger quirks mode.
- Using a legacy HTML 4 or XHTML doctype copied from a 2005 tutorial.
- Sending the doctype only on some pages — error pages, print views, and embedded iframes need it too.
- Letting a templating engine strip it during minification.

## Verification

- View source on the page. The very first bytes must be `<!doctype html>`.
- In DevTools, run `document.compatMode` in the console. It should return `"CSS1Compat"` (standards mode), not `"BackCompat"` (quirks).
- Check error pages (404, 500), redirect destinations, and any HTML fragments returned by APIs.
