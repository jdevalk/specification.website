---
title: "Focus not obscured"
slug: focus-not-obscured
category: accessibility
summary: "A focused control must not be hidden behind a sticky header, cookie banner, or chat widget. WCAG 2.2 added this as a separate criterion because a perfect focus ring is worthless if something is sitting on top of it."
status: recommended
order: 55
appliesTo: [all]
relatedSlugs: [focus-indicators, keyboard-navigation, skip-links, cookie-consent, inert-attribute]
updated: "2026-07-17T00:00:00.000Z"
sources:
  - title: "WCAG 2.4.11 — Focus Not Obscured (Minimum) (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"
    publisher: "W3C"
  - title: "WCAG 2.4.12 — Focus Not Obscured (Enhanced) (Level AAA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html"
    publisher: "W3C"
  - title: "WCAG 2.2 Recommendation"
    url: "https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum"
    publisher: "W3C"
  - title: "MDN — scroll-padding"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding"
    publisher: "MDN"
---

## What it is

**Focus Not Obscured** is a pair of WCAG 2.2 success criteria about what sits *on top of* the focused control.

- **2.4.11 Focus Not Obscured (Minimum)**, Level **AA**: "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."
- **2.4.12 Focus Not Obscured (Enhanced)**, Level **AAA**: no part of the focused component may be hidden.

The gap between them is the word **entirely**. At AA, a sliver of the control peeking out from under your sticky header is a pass. At AAA, any occlusion at all is a failure. AA is a floor, not a description of a good experience.

"Author-created content" is the operative phrase. If the browser's own UI covers something, that is not your criterion to fail. If *your* sticky header, cookie banner, or chat bubble covers it, it is.

### This is not the same as having a focus indicator

The wrong belief to correct is that a well-styled focus ring discharges this. It does not, and the two criteria fail independently.

[Visible focus indicators](/spec/accessibility/focus-indicators/) (2.4.7) asks whether you *drew* a focus indicator. Focus Not Obscured asks whether the user can *see* the one you drew. A site can have an immaculate three-pixel high-contrast ring and still fail 2.4.11 the moment Tab scrolls a link to the top of the viewport and a 64-pixel sticky header lands on it. The ring is rendering perfectly. It is simply underneath something.

That is why WCAG 2.2 made it a separate criterion rather than a note on 2.4.7: the fix lives in your scroll and layout behaviour, not in your focus styles.

## Why it matters

A keyboard user cannot see where focus went. That is the whole problem, and it is indistinguishable from having no focus indicator at all — they press Tab, the page scrolls, and the thing they are now about to activate is behind a banner. They are one Enter keystroke away from a link they cannot read.

Sighted keyboard users are the population this hurts most directly: people with motor disabilities who do not use a mouse, and people using switch access or voice control that drives the focus ring. Screen reader users are largely unaffected, because the content is announced regardless of what covers it — which is precisely why this bug survives so long. It is invisible to the automated checks and to the screen-reader pass, and it only shows up when a sighted person tabs through the page and watches.

The failure is also intermittent, which makes it easy to dismiss. Focus is obscured only when the focused element happens to land in the strip the sticky element occupies. Tab through the top of the page and everything is fine. Tab into the middle and a control vanishes.

## How to implement

Most failures come from one of three sources: sticky headers and footers, non-modal cookie banners, and floating chat or feedback widgets.

**Reserve the sticky area in the scroll container.** When focus moves off-screen, the browser scrolls the element into view — and by default it stops as soon as the element touches the viewport edge, which is exactly where your sticky header lives. `scroll-padding-top` on the scrolling element tells the browser to treat that strip as unusable:

```css
:root {
  /* Match the sticky header's height. */
  scroll-padding-top: 5rem;
}
```

Add `scroll-padding-bottom` if you also have a sticky footer. If the header's height changes responsively, drive both from the same custom property so they cannot drift apart.

**Prefer `scroll-padding` over `scroll-margin` for this.** `scroll-margin` is set per-target and you will forget one; `scroll-padding` is set once on the scroll container and applies to everything scrolled into it — including focus.

**Make banners modal or make them get out of the way.** A cookie banner that is non-modal and sticky is the canonical failure: focus can travel to the content behind it and end up underneath it. Either make it a true modal — trap focus inside it, and mark the rest [`inert`](/spec/accessibility/inert-attribute/) so focus cannot reach the obscured content in the first place — or ensure it does not overlap focusable content. See [cookie consent](/spec/privacy/cookie-consent/).

**Two exceptions are written into the criteria**, and both are narrower than people assume:

- **User-movable content.** Only the *initial* position is evaluated. If the user drags your panel over a control themselves, that is not your failure. If it starts there, it is.
- **User-opened content.** Content the user opened may obscure the focused component, but only if they can reveal it again *without moving focus* — pressing Escape, or scrolling. A disclosure the user cannot dismiss without tabbing onward does not qualify.

Neither exception covers "the user could have dismissed our banner". It was your content, placed there by you, in its initial position.

## Common mistakes

- A sticky header with no `scroll-padding-top` on the scroll container — by far the most common cause.
- `scroll-margin-top` applied to headings for anchor links, which fixes in-page jumps but does nothing for Tab.
- A non-modal cookie banner pinned to the bottom of the viewport, with the page behind it still focusable.
- A chat widget in the bottom-right corner that covers the last control in a form.
- Treating the AA "entirely hidden" threshold as the goal. Two visible pixels is a pass and still unusable.
- Assuming a screen-reader pass covers it. It does not — the content is announced from under the banner just fine.
- Testing only at desktop width. Sticky elements grow proportionally larger as the viewport shrinks.

## Verification

- Tab through every template from the top of the page to the bottom and *watch the focus ring the whole way*. Any control that disappears under a sticky element is a failure. This is a purely visual check; no tooling will do it for you.
- Repeat it at a narrow viewport and at 200% zoom, where sticky elements eat proportionally more of the screen.
- Repeat it with the cookie banner showing — that is a fresh visitor's first experience, and the state you are least likely to test.
- Scroll to the middle of a long page, then Tab. Failures cluster where the page is already scrolled.
- For AAA (2.4.12), check that no part of the control is covered, not merely that some of it shows.
