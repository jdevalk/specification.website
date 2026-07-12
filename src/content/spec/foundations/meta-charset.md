---
title: "<meta charset>"
slug: meta-charset
category: foundations
summary: "Declare UTF-8 as the document character encoding in the first 1024 bytes of the HTML, so browsers parse text correctly before they hit any non-ASCII content."
status: required
order: 30
appliesTo: [all]
relatedSlugs: [doctype, html-lang, meta-viewport]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "HTML Living Standard — Specifying the document's character encoding"
    url: "https://html.spec.whatwg.org/multipage/semantics.html#charset"
    publisher: "WHATWG"
  - title: "MDN — <meta>: charset"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta#charset"
    publisher: "MDN"
  - title: "WHATWG Encoding Standard"
    url: "https://encoding.spec.whatwg.org/"
    publisher: "WHATWG"
---

## What it is

`<meta charset>` tells the browser how to decode the bytes of the HTML document into characters. In 2026 there is only one correct value:

```html
<meta charset="utf-8" />
```

It must appear inside `<head>`, and the entire `<meta>` element must fit within the **first 1024 bytes** of the response. Browsers stop sniffing after that point; anything declared later is ignored.

## Why it matters

Before the browser can parse a single character of your page, it has to decide which encoding to apply to the byte stream. Without an explicit declaration, it guesses — based on the `Content-Type` HTTP header, a byte-order mark, or heuristics over the first chunk of bytes. Guessing goes wrong:

- A page with a curly apostrophe (`'`) shows mojibake (`â€™`) when the browser picks Windows-1252.
- Form submissions get encoded in the wrong charset, corrupting non-ASCII input.
- Right-to-left text reorders incorrectly.
- Search engines index garbled strings.

**UTF-8 is the only encoding you should use.** It is a superset of ASCII, supports every script (Latin, Cyrillic, Arabic, Chinese, emoji), is the default for JSON and XML, and is what every modern build tool produces. Legacy encodings (`iso-8859-1`, `windows-1252`, `shift_jis`) exist only as compatibility for old documents — do not create new content in them.

## How to implement

Put the charset declaration as the very first child of `<head>`, before `<title>` or any other tag that could contain non-ASCII text:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>The Website Specification</title>
    ...
  </head>
</html>
```

Save the file itself as UTF-8 (most editors do this by default). The declaration in the HTML and the actual bytes on disk must match.

Also set the HTTP `Content-Type` header on the response. The header takes precedence over the meta tag, so if they conflict, the header wins:

```http
Content-Type: text/html; charset=utf-8
```

If both agree on UTF-8, you are covered for every loader: browsers, scrapers, RSS readers, and crawlers that read the bytes directly.

The older XHTML form `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">` still works but is verbose and unnecessary. Use the short form.

## Common mistakes

- Declaring the charset after `<title>` so a non-ASCII character in the title is parsed wrongly before the meta tag is reached.
- Saving the file as Windows-1252 or Latin-1 while declaring `utf-8`.
- Adding a byte-order mark to a UTF-8 file. It is allowed but can break server-side includes and PHP headers.
- Different charsets in the HTTP header and the meta tag.
- Using `utf8` without the hyphen — browsers accept it, but `utf-8` is the canonical spelling.

## Verification

- View source. `<meta charset="utf-8" />` should be the first or second line inside `<head>`.
- Run `document.characterSet` in DevTools. It must return `"UTF-8"`.
- Check the `Content-Type` response header in the Network tab.
- Add a non-ASCII test string (`café — 日本語 — 🌍`) to a page and confirm it renders correctly.
