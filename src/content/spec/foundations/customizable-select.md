---
title: "Customizable select"
slug: customizable-select
category: foundations
summary: "Style a real <select> end to end — button, picker, options, rich content inside options — by opting into appearance: base-select, instead of rebuilding the control from divs and losing its behaviour."
status: optional
order: 145
appliesTo: [all]
relatedSlugs: [popover-api, anchor-positioning, native-interactive-elements, dialog-element]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "Open UI — Customizable Select Element (Explainer)"
    url: "https://open-ui.org/components/customizable-select.explainer/"
    publisher: "Open UI"
  - title: "MDN — Styling a select element with CSS"
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select"
    publisher: "MDN"
  - title: "MDN — appearance"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/appearance"
    publisher: "MDN"
---

## What it is

A customizable select is still a `<select>` — same element, same form participation, same keyboard and assistive-technology behaviour — with an opt-in that hands its rendering to CSS. `appearance: base-select` on the select (and on its `::picker(select)` pseudo-element) unlocks full styling of the button and the dropdown, a `<selectedcontent>` element that mirrors the chosen option into the closed button, and the ability to put rich content — images, formatted text — inside `<option>` elements. The picker renders in the top layer and is positioned with [anchor positioning](/spec/foundations/anchor-positioning/), by the browser.

Support is current but incomplete, which is why this page is optional: Chrome and Edge shipped it in April 2025 (version 135), Safari followed in September 2026 (version 27), and Firefox has not shipped it. Where it is unsupported, the select renders as a normal native select — the opt-in is a progressive enhancement by construction, provided you build it that way.

## Why it matters

The select is the control the web has rebuilt most often and worst. The native one was long considered unstyleable, so sites substituted div-and-listbox constructions that routinely lose keyboard operation, type-ahead, form submission, screen-reader announcements, and mobile behaviour — the exact properties [native interactive elements](/spec/accessibility/native-interactive-elements/) exist to protect. Customizable select removes the excuse: the branded picker and the platform behaviour now come from the same element.

## How to implement

- **Start from a working native select.** Correct options, labels, grouping, and form wiring first; `base-select` changes presentation only.
- **Opt in on both parts.** `appearance: base-select` must be set on the `<select>` and on `::picker(select)`; styling one without the other leaves a half-native control.
- **Use the provided parts.** `::picker(select)` for the dropdown, `::picker-icon` for the indicator, `option` and `option::checkmark` for rows, and `<selectedcontent>` inside a `<button>` child of the select when the closed control must show more than plain text.
- **Put rich content in options sparingly.** Images and secondary text inside `<option>` are for genuinely visual choices (a colour, a flag, a product variant). The option's text content remains its accessible name and submitted value's label — never ship an image-only option.
- **Animate with the platform primitives.** The picker is a top-layer element: `@starting-style` plus `transition-behavior: allow-discrete` animates its entry and exit, and `interpolate-size: allow-keywords` animates to intrinsic height, all without JavaScript.
- **Feature-detect the enhancement.** Gate `base-select`-dependent layout (grids of options, card pickers) behind `@supports (appearance: base-select)` so browsers without it get the plain, fully usable select.

## Common mistakes

- Rebuilding the select from divs anyway, for pixel control the native opt-in already provides — keeping all the accessibility debt for none of the benefit.
- Treating the rich-option capability as a licence for image-only or layout-heavy options that break type-ahead and screen-reader use.
- Depending on the custom rendering for meaning: if the picker layout (a grid, a colour swatch) carries information, that information must survive in the plain select too.
- Forgetting the fallback is a *different visual design*, not a broken one — test the no-`base-select` rendering as a first-class state, not an afterthought.

## Verification

- In a browser without `base-select` support, complete the form with the plain select, keyboard only.
- In a supporting browser, confirm the custom picker opens, arrows and type-ahead work, Esc dismisses, and the chosen value submits identically.
- With a screen reader, confirm options are announced with their text, including options that carry images.
- Resize and scroll: the picker stays anchored to the button and flips rather than clipping off-screen.
