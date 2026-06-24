---
title: "Popover API"
slug: popover-api
category: foundations
summary: "Replace ARIA-puzzled JavaScript modals, menus, and tooltips with a native top-layer primitive that the browser opens, closes, and accessibility-wires for you."
status: recommended
order: 130
appliesTo: [all]
relatedSlugs: [semantic-html, aria-usage, keyboard-navigation, focus-indicators, anchor-positioning]
updated: "2026-06-08T00:00:00.000Z"
sources:
  - title: "HTML Standard — Popover"
    url: "https://html.spec.whatwg.org/multipage/popover.html"
    publisher: "WHATWG"
  - title: "MDN — Popover API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Popover_API"
    publisher: "MDN"
  - title: "Introducing the Popover API"
    url: "https://web.dev/blog/popover-api"
    publisher: "web.dev"
  - title: "Open UI — Popover explainer"
    url: "https://open-ui.org/components/popover.research.explainer/"
    publisher: "Open UI"
  - title: "Using CSS anchor positioning"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using"
    publisher: "MDN"
---

## What it is

The Popover API turns any element into a top-layer overlay using three HTML attributes. The browser handles opening, closing, stacking, focus, and keyboard behaviour — no JavaScript and no ARIA juggling.

- `popover` on the overlay element. Values: `auto` (default), `manual`, or `hint`.
- `popovertarget` on a `<button>` that controls the overlay, referencing the popover's `id`.
- `popovertargetaction` to force `"show"`, `"hide"`, or the default `"toggle"`.

```html
<button popovertarget="menu">Open menu</button>

<div id="menu" popover>
  <p>Menu contents.</p>
  <button popovertarget="menu" popovertargetaction="hide">Close</button>
</div>
```

The `auto` value gives you light-dismiss (click outside to close) and auto-close on Escape. `manual` requires an explicit dismiss control. `hint` is for tooltip-style transient overlays that close when another `hint` opens.

CSS hooks: `:popover-open` matches an open popover, `::backdrop` styles the layer behind it, and [CSS **Anchor Positioning**](/spec/foundations/anchor-positioning/) (`position-anchor`, `anchor()`) can position a popover relative to its trigger where supported.

## Why it matters

- **Native top-layer rendering.** The popover sits above every `z-index`, every `overflow: hidden` ancestor, and every transformed container — the perennial CSS bugs of hand-rolled overlays disappear.
- **Built-in accessibility.** Focus moves into the popover on open, Escape closes `auto` popovers, click-outside dismisses them, and the trigger-to-popover relationship is wired automatically. No `aria-expanded`, `aria-controls`, focus-trap library, or outside-click listener required.
- **Less JavaScript.** Menus, disclosure widgets, and lightweight overlays become pure HTML. No state hook, no portal component, no event plumbing.
- **Composes with `<dialog>`.** `<dialog>` remains the right choice for blocking modal flows (forms that need a decision); `popover` covers everything else.

## How to implement

Use `popover` (`auto`) for menus, share sheets, command palettes, and any overlay where clicking outside should dismiss. Use `popover="manual"` only when you have an explicit close affordance and a reason the user shouldn't dismiss by clicking away. Use `hint` for tooltips.

```html
<button popovertarget="share">Share</button>
<div id="share" popover>
  <ul>
    <li><a href="...">Copy link</a></li>
    <li><a href="...">Email</a></li>
  </ul>
</div>

<style>
  [popover]:popover-open { animation: fade-in 120ms ease-out; }
  [popover]::backdrop    { background: rgb(0 0 0 / 0.2); }
</style>
```

For programmatic control, the element exposes `showPopover()`, `hidePopover()`, and `togglePopover()`, and fires `beforetoggle` / `toggle` events.

## Common mistakes

- **`popover="manual"` without a dismiss control.** The user has no way out. Auto is the default for a reason.
- **Reaching for `popover` when you mean `<dialog>`.** Confirmations, sign-in flows, and anything that must block the rest of the page belong in `<dialog showModal()>`. Popovers are non-blocking.
- **Not testing focus return.** When a popover closes, focus must return to the trigger. The browser does this for you — but only if your trigger is a real `<button>`, not a `<div>` with an onClick.
- **Duplicating ARIA.** Don't add `role="dialog"` or `aria-modal` to a popover. The accessibility tree already reflects the right semantics.

## Verification

- DevTools accessibility tree shows the popover as an exposed overlay tied to its trigger.
- Pressing Escape closes an `auto` popover; clicking outside dismisses it; focus returns to the trigger.
- The popover renders above every transformed and `overflow: hidden` ancestor — proof it is in the top layer.
- `caniuse.com/mdn-html_global_attributes_popover` — supported in all major browsers since 2024.
