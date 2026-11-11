---
title: "The dialog element"
slug: dialog-element
category: foundations
summary: "Use the native <dialog> element for modal and non-modal dialogs: showModal() supplies the top layer, inert background, focus handling, and Esc dismissal that hand-rolled overlays chronically get wrong."
status: recommended
order: 135
appliesTo: [all]
relatedSlugs: [popover-api, invoker-commands, inert-attribute, native-interactive-elements, focus-indicators]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "HTML Standard — The dialog element"
    url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element"
    publisher: "WHATWG"
  - title: "MDN — <dialog>: The Dialog element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog"
    publisher: "MDN"
---

## What it is

The `<dialog>` element is HTML's native dialog box. Opened with `showModal()`, it renders in the top layer above all other content, makes the rest of the page inert, moves focus into itself, and closes on Esc. Opened with `show()`, it is a non-modal panel that leaves the page interactive. A `<form method="dialog">` inside it closes the dialog on submit and exposes the submitter's value as `returnValue`. The element has been Baseline widely available since March 2022.

It is not interchangeable with its two neighbours, and picking by appearance is the classic error. A [popover](/spec/foundations/popover-api/) is non-modal by design: light-dismiss, no inert background, no focus trap — right for menus, tooltips, and toasts, wrong for a decision the user must not ignore. A styled `<div role="dialog">` is the third option and the worst: the role announces "dialog" to assistive technology while providing none of the behaviour — no top layer, no inertness, no Esc handling, no focus management — until you reimplement all of it, correctly, including the edge cases. The platform element exists so that you do not have to.

## Why it matters

Modal dialogs are where hand-rolled overlays fail hardest and most accessibly: keyboard focus escaping into the page behind, screen-reader users never told a dialog opened, Esc doing nothing, the background scrolling under the overlay. Each is a known failure pattern of the div-based approach, and each is simply the defined behaviour of `showModal()`. Using the element converts a category of accessibility bugs into a default.

## How to implement

- **Choose modal deliberately.** `showModal()` for anything that must be answered before continuing (confirmation, destructive actions, required input); `show()` or a popover for dismissible, non-blocking UI.
- **Open and close declaratively where you can.** [Invoker commands](/spec/foundations/invoker-commands/) (`commandfor` + `command="show-modal"` / `"close"`) wire buttons to a dialog without script; the browser handles the wiring and the button's expanded state.
- **Set the dismissal policy with `closedby`.** `closedby="any"` adds backdrop-click light dismiss to Esc; `"closerequest"` keeps platform close requests (Esc, device back) only; `"none"` forces an explicit choice. The attribute is recent — Chrome shipped it first, in March 2025, and it is not yet cross-browser — so treat `closedby="any"` as an enhancement and never as the only way out.
- **Let focus follow the platform.** On open, focus lands on the first focusable element (or the element with `autofocus`); on close, it returns to the invoker. Do not hand-manage a focus trap around a modal dialog — the inert background ([the inert attribute](/spec/accessibility/inert-attribute/) is the same mechanism, exposed) already constrains it.
- **Contain the scroll.** A modal blocks interaction with the page, not its scroll chaining: give the dialog's scroll container `overscroll-behavior: contain` so a long dialog does not scroll the page behind it.
- **Style the backdrop, keep the semantics.** `::backdrop` is the styling hook for the overlay behind a modal dialog. Animating entry and exit is fine — `@starting-style` with `transition-behavior: allow-discrete` covers the top-layer case — provided `prefers-reduced-motion` is respected (see [reduced motion](/spec/accessibility/reduced-motion/)).

## Common mistakes

- Rebuilding a dialog as a positioned div with `role="dialog"` and a JavaScript focus trap, then missing the cases the platform handles: Esc, inertness, focus return, top-layer stacking over other overlays.
- Using `showModal()` for menus, tooltips, and notifications that should be popovers, trapping users in UI that was never a decision.
- Relying on backdrop clicks as the only dismissal path where `closedby` is unsupported, stranding keyboard users whose Esc key you overrode.
- Putting a second modal's trigger inside the first without returning focus correctly on close — the platform returns focus to the invoking element, so open layered dialogs from elements that will still exist when they close.
- Cancelling the `cancel` event (what Esc fires) to prevent closing while also offering no visible close control.

## Verification

- Open the dialog with the keyboard alone: focus enters it, Tab cycles within it while it is modal, Esc closes it, and focus returns to the button that opened it.
- With a screen reader, confirm the dialog is announced as a dialog with its accessible name on open.
- Scroll a long dialog to its end and confirm the page behind does not move.
- Confirm non-modal UI (menus, toasts, tooltips) is built on popover, not on `show()`, and genuinely modal UI on `showModal()`, not on a div.
