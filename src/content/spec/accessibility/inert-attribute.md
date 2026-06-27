---
title: "The inert attribute"
slug: inert-attribute
category: accessibility
summary: "When an overlay is open, the content behind it should be unreachable — not just dimmed. The inert attribute removes a subtree from tab order and the accessibility tree at once, replacing fragile focus-trap JavaScript."
status: recommended
order: 65
appliesTo: [all]
relatedSlugs: [keyboard-navigation, focus-indicators, skip-links, native-interactive-elements]
updated: "2026-06-26T09:00:00.000Z"
sources:
  - title: "HTML Standard — The inert attribute"
    url: "https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute"
    publisher: "WHATWG"
  - title: "ARIA Authoring Practices Guide — Dialog (Modal) Pattern"
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
    publisher: "W3C"
  - title: "MDN — inert"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert"
    publisher: "MDN"
---

## What it is

`inert` is a boolean global attribute that makes an element and all of its descendants non-interactive. An inert subtree cannot receive focus, cannot be clicked, is skipped by the tab order, and is removed from the accessibility tree; in supporting browsers its text is also skipped by find-in-page. It is defined in the WHATWG HTML Standard and has been Baseline across browsers since April 2023.

The canonical use is managing background content. When a modal dialog, slide-out menu, or off-canvas panel is open, everything behind it should be genuinely unreachable — not merely greyed out, but inert to the keyboard and to assistive technology.

## Why it matters

Before `inert`, keeping focus inside an open dialog meant fragile scripting: trapping the Tab key, tracking the first and last focusable element, and toggling `tabindex="-1"` plus `aria-hidden` on every background node — then undoing it all on close. Miss one path and a keyboard user tabs out of the dialog into hidden content they cannot see. That is a focus-order failure (WCAG 2.4.3) and a likely keyboard trap.

`inert` collapses that into one declarative attribute. It removes the subtree from the tab order and the accessibility tree together, so keyboard and screen-reader users get the same boundary the visual design implies.

## How to implement

Mark the container that should become unreachable, and clear it when the content is active again:

```html
<main inert>
  <!-- page content, unreachable while the overlay is open -->
</main>
<div role="dialog" aria-modal="true">
  <!-- focusable overlay content -->
</div>
```

- A modal `<dialog>` opened with `showModal()` makes the rest of the document inert automatically — you do not need to set the attribute yourself. Reach for `inert` on non-`<dialog>` patterns: custom menus, off-screen navigation, multi-step panels.
- Obscure inert content visually (a backdrop or dimming) so sighted users are not confused by content they cannot use. The spec asks authors to do this.
- Toggle it from script as state changes: `el.inert = true`.
- Use `disabled`, not `inert`, to switch off an individual form control.

## Common mistakes

- Using `aria-hidden` alone for background content — it hides from screen readers but leaves elements focusable, so keyboard focus still escapes.
- Marking content inert while leaving it fully visible and undimmed.
- Forgetting to remove `inert` when the overlay closes, stranding the whole page.
- Applying `inert` to the dialog itself instead of to the background.

## Verification

- Open each overlay and press Tab repeatedly: focus must cycle only within the active region and never reach a background control.
- With a screen reader running, background landmarks and headings should not be announced while the overlay is open.
- Use find-in-page — in Chrome and Firefox, text inside an inert subtree is skipped (Safari does not yet honour this, so do not rely on it as the only barrier).
