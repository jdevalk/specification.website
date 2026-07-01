---
title: "Reduced motion"
slug: reduced-motion
category: accessibility
summary: "Respect the user's `prefers-reduced-motion` setting. Decorative animation, parallax, and autoplay can trigger vestibular distress, migraines, and seizures."
status: required
order: 125
appliesTo: [all]
relatedSlugs: [focus-indicators, semantic-html, color-contrast, forced-colors, entry-exit-animations]
updated: "2026-05-29T10:57:27.000Z"
sources:
  - title: "WCAG 2.3.3 — Animation from Interactions (Level AAA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html"
    publisher: "W3C"
  - title: "WCAG 2.2.2 — Pause, Stop, Hide (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html"
    publisher: "W3C"
  - title: "MDN — prefers-reduced-motion"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion"
    publisher: "MDN"
  - title: "WP Accessibility"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
  - title: "web.dev — prefers-reduced-motion: Sometimes less movement is more"
    url: "https://web.dev/articles/prefers-reduced-motion"
    publisher: "web.dev"
---

## What it is

Some users have signalled at the operating-system level that they want motion on screen reduced. The browser exposes that signal through the `prefers-reduced-motion` media query. When the value is `reduce`, the user is asking you to remove or shorten non-essential animation.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Why it matters

Uncontrolled motion is not a taste issue. It causes real harm:

- **Vestibular disorders.** Parallax, zooming transitions, and long slide-ins can trigger nausea, dizziness, and disorientation that lasts for hours.
- **Migraine and photosensitivity.** Looping background video and flashing transitions are common triggers.
- **Seizure risk.** Anything flashing more than three times per second is a WCAG Level A failure (2.3.1).

WCAG 2.2.2 Pause, Stop, Hide (Level A) requires that any moving, blinking, scrolling, or auto-updating content lasting more than five seconds can be paused or stopped. WCAG 2.3.3 (Level AAA) goes further: motion triggered by interaction must be disableable unless essential to the function.

## How to implement

Cover both CSS animations and JavaScript-driven motion.

```js
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reduce.matches) {
  startCarousel();
}
reduce.addEventListener('change', (e) => {
  e.matches ? stopCarousel() : startCarousel();
});
```

Apply the same logic to native media:

```html
<video autoplay muted loop playsinline>...</video>
```

Autoplaying background video should be gated on `prefers-reduced-motion: no-preference`, or shipped as a static poster image by default.

Distinguish decorative motion from meaningful motion. A spinner that says "loading" still needs to communicate; replace the spin with a static "Loading…" label or a very slow pulse. A tutorial transition that shows where a panel came from can be shortened to a fade rather than removed.

The worst offenders to audit first:

- Parallax scrolling.
- Large zoom or slide-in transitions on scroll.
- Autoplay carousels and sliders.
- Looping background video.
- Confetti, particle effects, and infinite marquees.

Browser support is universal across Chrome, Edge, Safari, and Firefox.

## Common mistakes

- Treating reduced motion as optional polish. It is a required accessibility behaviour.
- Removing transitions but leaving autoplay video running.
- Hiding the pause control behind a hover state on a touch device.
- Animating in JavaScript with no `matchMedia` check, so CSS overrides do nothing.

## Verification

- In macOS System Settings, enable **Accessibility → Display → Reduce motion**. Reload the page. Decorative animation should stop.
- In Chrome DevTools, open the command menu and run **Emulate CSS prefers-reduced-motion: reduce**.
- Confirm any motion longer than five seconds has a visible pause, stop, or hide control (WCAG 2.2.2).
- Confirm no content flashes more than three times in any one-second window.
