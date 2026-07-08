---
title: "Native interactive elements"
slug: native-interactive-elements
category: accessibility
summary: "Prefer native HTML interactive elements — <button>, <a>, <details>/<summary>, <dialog> — over divs with click handlers. You get keyboard support, focus management, and assistive-tech semantics for free."
status: recommended
order: 155
appliesTo: [all]
relatedSlugs: [semantic-html, aria-usage, keyboard-navigation, hidden-until-found, inert-attribute, invoker-commands]
updated: "2026-07-08T00:00:00.000Z"
sources:
  - title: "WHATWG HTML — The details element"
    url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element"
    publisher: "WHATWG"
  - title: "WHATWG HTML — The dialog element"
    url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element"
    publisher: "WHATWG"
  - title: "MDN — <dialog>"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"
    publisher: "MDN"
  - title: "WAI-ARIA Authoring Practices"
    url: "https://www.w3.org/WAI/ARIA/apg/"
    publisher: "W3C WAI"
---

## What it is

HTML ships a small set of interactive primitives — `<button>`, `<a href>`, `<details>`/`<summary>`, `<dialog>` — that come pre-wired with keyboard handling, focus management, ARIA roles, and browser behaviours. Reach for those first; reach for `<div role="button" tabindex="0">` only when the platform genuinely has no element for what you are building. The broader principle of "use the right tag" lives on [Semantic HTML](/spec/accessibility/semantic-html/); this page is about the interactive ones specifically.

## Why it matters

Replacing `<div onclick>` with `<button>` is not cosmetic. The native element gives you, with zero code:

- **Keyboard semantics.** `<button>` activates on ENTER and SPACE. `<a>` activates on ENTER. `<dialog>` closes on ESC. `<details>` toggles on ENTER or SPACE when `<summary>` has focus. Tab order is correct by default.
- **Focus management.** `<dialog>` traps focus inside the modal while open, returns focus to the opener on close, and renders in the top layer above other content.
- **Assistive-tech announcement.** Screen readers expose the right role ("button", "link", "dialog", "disclosure") and state ("expanded", "modal") without an `aria-*` attribute in sight.
- **Browser plumbing.** Open `<details>` state survives back/forward navigation. `<a>` populates history, supports middle-click and "open in new tab", honours `target` and `rel`.
- **Free maintenance.** Every browser ships fixes and refinements (animatable `<details>`, `::backdrop`, ESC-dismiss policy) without you changing a line.

Re-implement any of this in JavaScript and you have signed up to maintain it forever, with bugs.

## How to implement

**Disclosure / FAQ / accordion** — `<details>` and `<summary>`:

```html
<details>
  <summary>What is the return policy?</summary>
  <p>Returns are accepted within 30 days of delivery.</p>
</details>
```

Animate with modern CSS — no JavaScript needed:

```css
details::details-content {
  block-size: 0;
  overflow: hidden;
  transition: block-size 200ms, content-visibility 200ms allow-discrete;
  interpolate-size: allow-keywords;
}
details[open]::details-content { block-size: auto; }
```

**Single-open accordion** — give a group of sibling `<details>` the same `name` and the browser enforces that only one is open at a time, closing the others as each opens. No JavaScript, and every panel keeps its native keyboard activation, focus order, and disclosure semantics:

```html
<details name="faq">
  <summary>How do refunds work?</summary>
  <p>Refunds are issued to the original payment method within five days.</p>
</details>
<details name="faq">
  <summary>Can I change my plan later?</summary>
  <p>Yes — upgrade or downgrade at any time from your account settings.</p>
</details>
```

A shared `name` turns a stack of disclosures into an exclusive accordion — the most common accordion pattern — without the `role`, `aria-expanded`, and roving-focus bookkeeping a scripted version has to reimplement and keep correct.

**Modal dialog** — `<dialog>` with `showModal()`:

```html
<dialog id="confirm">
  <form method="dialog">
    <p>Delete this entry?</p>
    <button value="cancel">Cancel</button>
    <button value="confirm">Delete</button>
  </form>
</dialog>

<button type="button" onclick="confirm.showModal()">Delete</button>
```

`showModal()` opens it modally — focus is trapped, ESC dismisses, `::backdrop` styles the dim layer. Use `show()` for non-modal. For transient, non-blocking overlays (menus, tooltips, toasts) use the [Popover API](/spec/foundations/popover-api/) instead.

**Buttons and links.** A `<button>` does something on the current page; an `<a href>` goes somewhere. Inside a `<form>`, always set `type="button"` on buttons that are not the submit:

```html
<button type="button" onclick="reset()">Reset</button>
```

## Common mistakes

- **`<div onclick>` as a button.** No keyboard activation, no focus, no accessible name, no role.
- **`<a href="#" onclick>` as a button.** Pollutes browser history, breaks middle-click and "open in new tab", and announces as a link in screen readers.
- **Rebuilding `<details>` in JavaScript "to control the animation".** Modern CSS — `interpolate-size`, `transition-behavior: allow-discrete`, `::details-content` — animates the native element.
- **Scripting a single-open accordion.** Give sibling `<details>` the same `name` and the browser handles mutual exclusion for you, with correct disclosure semantics on every panel.
- **Using `<dialog>` for transient, non-blocking UI.** Reserve `<dialog>` for modal flows that require a decision. For menus, popovers, and toasts, use the [Popover API](/spec/foundations/popover-api/).
- **Forgetting `type="button"` inside a `<form>`.** A bare `<button>` defaults to `type="submit"` and submits the form on click.

## Verification

- Tab through the page. Every interactive thing must be reachable, in a sensible order, with a visible focus ring.
- Open Chrome DevTools → Elements → Accessibility tree. Confirm `details`, `dialog`, and `button` are exposed with the correct roles and states.
- Activate `<details>`, `<button>`, and `<dialog>` triggers using only the keyboard (ENTER, SPACE, ESC).
- In VoiceOver, open the Web Item Rotor — disclosure widgets and dialogs appear with the right labels.
- Search the codebase for `role="button"` and `onclick` on non-button elements. Each hit is a candidate for replacement.
