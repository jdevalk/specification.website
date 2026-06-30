---
title: "Invoker commands"
slug: invoker-commands
category: foundations
summary: "Wire a button to open a popover, close a dialog, or run a custom action declaratively with command and commandfor — no click handler, no ARIA plumbing."
status: recommended
order: 170
appliesTo: [all]
relatedSlugs: [popover-api, native-interactive-elements, semantic-html, inert-attribute, keyboard-navigation]
updated: "2026-06-30T00:00:00.000Z"
sources:
  - title: "HTML Standard — The button element (command, commandfor)"
    url: "https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-command"
    publisher: "WHATWG"
  - title: "HTML Standard — CommandEvent"
    url: "https://html.spec.whatwg.org/multipage/interaction.html#commandevent"
    publisher: "WHATWG"
  - title: "MDN — Invoker Commands API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API"
    publisher: "MDN"
  - title: "Open UI — Invokers explainer"
    url: "https://open-ui.org/components/invokers.explainer/"
    publisher: "Open UI"
---

## What it is

Invoker commands let a `<button>` control another element declaratively, through two HTML attributes:

- `commandfor` references the `id` of the element to act on.
- `command` names the action to perform.

The browser wires the click and keyboard activation, dispatches a `command` event on the target, and runs the built-in behaviour — no `addEventListener`, no `aria-controls`, no `aria-expanded` to keep in sync.

```html
<button commandfor="menu" command="toggle-popover">Open menu</button>

<div id="menu" popover>
  <button commandfor="menu" command="hide-popover">Close</button>
</div>
```

The built-in commands cover the common overlay patterns: `show-popover`, `hide-popover`, `toggle-popover` for [popovers](/spec/foundations/popover-api/), and `show-modal`, `close`, `request-close` for `<dialog>`. Any value prefixed with two dashes (for example `command="--rotate"`) is a **custom command**: the browser fires a `CommandEvent` on the target carrying that name, and your script decides what to do — invoker wiring without a built-in action.

## Why it matters

- **Less JavaScript for common patterns.** Opening a popover or closing a dialog no longer needs a click handler. The relationship lives in markup the browser understands.
- **Accessibility comes for free.** The control is a real `<button>`, so keyboard activation, focus, and the exposed relationship are handled natively. There is no ARIA to add or to drift out of sync.
- **Custom commands are properly delegated.** A `--name` command dispatches a single typed event from a real button, replacing ad-hoc `onclick` wiring with one consistent mechanism — and you can read `event.source` to know which button invoked it.
- **It composes with the platform.** Invoker commands pair directly with the Popover API, `<dialog>`, and [native interactive elements](/spec/accessibility/native-interactive-elements/) rather than re-implementing their behaviour in script.

## How to implement

Reach for invoker commands whenever a button's job is to drive another element. Use the built-in popover and dialog commands for overlays; use a `--`-prefixed custom command when you want the declarative button-to-target wiring but a behaviour the platform does not ship.

```html
<button commandfor="confirm" command="show-modal">Delete…</button>

<dialog id="confirm">
  <form method="dialog">
    <p>Delete this item?</p>
    <button command="close" commandfor="confirm">Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>
```

Treat it as progressive enhancement where you still support older browsers: a button with a JavaScript fallback degrades to a normal control.

## Common mistakes

- **Putting `command`/`commandfor` on a non-button.** They only work on `<button>`. A `<div>` with these attributes does nothing and is not keyboard-operable.
- **Custom command without a listener.** A `--name` command does nothing on its own; you must handle the `command` event on the target.
- **Forgetting `request-close`.** For dialogs that should run cancel behaviour and fire the `cancel` event, prefer `request-close` over `close`.

## Verification

- Activate the button with the keyboard (Enter/Space): the target popover or dialog responds without any script.
- In DevTools, confirm the `<button>` exposes the command relationship and that a `command` event fires on the target.
- Baseline: invoker commands became newly available across major browsers at the end of 2025 — keep a scripted fallback if you still support older versions.
