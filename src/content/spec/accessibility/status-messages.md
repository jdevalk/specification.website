---
title: "Status messages"
slug: status-messages
category: accessibility
summary: "When something succeeds, fails or changes without moving focus — a result count, a saved confirmation, a progress update — assistive technology has to be told. Expose it through a live region, or announce it with ariaNotify()."
status: recommended
order: 112
appliesTo: [all]
relatedSlugs: [form-errors, aria-usage, semantic-html, css-state-selectors]
updated: "2026-09-25T00:00:00.000Z"
sources:
  - title: "WCAG 4.1.3 — Status Messages (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html"
    publisher: "W3C"
  - title: "Accessible Rich Internet Applications (WAI-ARIA) 1.2 — Live region roles"
    url: "https://www.w3.org/TR/wai-aria-1.2/#live_region_roles"
    publisher: "W3C"
  - title: "WAI-ARIA 1.3 — Interface Mixin ARIANotifyMixin"
    url: "https://www.w3.org/TR/wai-aria-1.3/#ARIANotifyMixin"
    publisher: "W3C"
  - title: "MDN — Element: ariaNotify() method"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify"
    publisher: "MDN"
  - title: "MDN — ARIA live regions"
    url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions"
    publisher: "MDN"
---

## What it is

A status message tells the user the outcome of something they did, or the state of something the page is doing, without taking focus. "3 results." "Saved." "Added to basket." "Uploading, 40%." WCAG 4.1.3 (Level AA) requires these to be programmatically determinable through role or properties, so assistive technology can present them without the user having to go looking.

The word "status" is doing precise work here. A message that takes focus is not a status message — it is a dialog or an error summary, and it announces itself by being focused. A status message is the opposite case: the page changes somewhere the user is not, and the change still has to reach them.

Two mechanisms exist, and they are not alternatives so much as different shapes. A **live region** is an element whose content changes are watched: mark it with `role="status"`, `role="alert"`, `role="log"` or an `aria-live` value, and the accessibility tree reports what appears inside it. **`ariaNotify()`** is a method call — `element.ariaNotify("Saved")` — that queues a string for the screen reader with no DOM counterpart at all.

The belief worth correcting: **adding `aria-live` and the text in the same operation announces nothing.** A live region is only live once it is in the accessibility tree; the browser announces changes it observes *after* that point. Insert `<div role="status">3 results</div>` into the page and most screen readers say nothing, because there was no region to change. The container has to be there first, empty, and the text goes in later. This single mechanical detail accounts for most live regions that "don't work".

## Why it matters

Filter a product list and a sighted user catches "24 items" in their peripheral vision without breaking stride. A screen-reader user whose focus is still in the filter control hears silence — and silence is ambiguous. Did the filter apply? Is it still loading? Did it find nothing? The usual response is to go hunting through the page to find out, which costs far more than the sentence would have.

The same gap opens everywhere a page reports back without moving focus: search result counts, autosave confirmations, items added to a basket, character counters, "copied to clipboard", background upload progress, a form that submitted successfully. None of these are errors, so none of them get the attention that error handling gets — and all of them leave a user guessing.

## How to implement

Pick the role by what the message is, not by how much you want it heard:

- **`role="status"`** — polite. The outcome of an action or a state change that is not urgent. This is the right default.
- **`role="alert"`** — assertive. It interrupts whatever the screen reader is saying. Reserve it for errors and genuinely time-critical information.
- **`role="log"`** — a sequence where order matters and new entries are appended, such as a chat transcript.

Render the container in the initial HTML, empty, and write into it afterwards:

```html
<!-- Present from first paint. -->
<p id="search-status" role="status"></p>
```

```js
document.getElementById("search-status").textContent = `${count} results`;
```

For an announcement with no visible counterpart, or one that has to fire without any DOM change, call `ariaNotify()`:

```js
button.ariaNotify("Link copied to clipboard", { priority: "normal" });
```

`ariaNotify()` reached Baseline Newly available in September 2026 (Chrome 141, Firefox 150, Safari 27). A few properties of it are worth knowing before you reach for it:

- `priority: "normal"` maps roughly to `aria-live="polite"`, `priority: "high"` to `assertive` — but live-region announcements take priority over both.
- Only the most recent announcement is reliably spoken. Combine several into one string rather than making several calls.
- The voice is chosen from the element's `lang` attribute, or the nearest ancestor's — another reason the [document language](/spec/accessibility/document-language/) has to be right.
- Usage can be switched off by the `aria-notify` directive in a [Permissions-Policy](/spec/security/permissions-policy/) header, in which case calls silently do nothing.
- Nothing about it is visible. If the information matters, it still has to appear on screen for everyone else.

Whichever mechanism you use, keep the message to one idea, phrase it as the user's outcome rather than the system's ("Saved", not "PUT 200"), and do not move focus to deliver it.

## Common mistakes

- Inserting the live region and its text together, so there is no change to observe.
- Hiding a live region with `display: none` or `visibility: hidden`, which removes it from the accessibility tree entirely. Use a visually-hidden class that keeps the element rendered.
- `role="alert"` on everything, so every routine confirmation interrupts the user mid-sentence.
- Announcing on each keystroke instead of debouncing to the settled result.
- Re-rendering a whole region when one line changed, so the screen reader reads the lot.
- Using `ariaNotify()` as the only channel, leaving sighted users with no confirmation at all.

## Verification

- Turn on a screen reader, perform the action, and keep focus where it was. You should hear the message without moving.
- Inspect the initial HTML: the live-region container must be present before the first update.
- Check the accessibility tree in DevTools — a region that is `display: none` will not be in it.
- Trigger several updates in quick succession and confirm the result is one useful sentence, not a pile-up.
