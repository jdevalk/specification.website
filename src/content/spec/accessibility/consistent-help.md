---
title: "Consistent help"
slug: consistent-help
category: accessibility
summary: "If you offer help — a contact link, a phone number, a chat widget, an FAQ — put it in the same relative place on every page that has it. Moving it around is the failure."
status: recommended
order: 117
appliesTo: [all]
relatedSlugs: [redundant-entry, accessible-authentication, form-errors, error-pages]
updated: "2026-07-10T00:00:00.000Z"
sources:
  - title: "WCAG 3.2.6 — Consistent Help (Level A)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html"
    publisher: "W3C"
  - title: "WCAG 2.2 Recommendation"
    url: "https://www.w3.org/TR/WCAG22/#consistent-help"
    publisher: "W3C"
  - title: "WCAG 3.2.3 — Consistent Navigation (Level AA)"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html"
    publisher: "W3C"
---

## What it is

**Consistent Help** is WCAG 2.2 Success Criterion 3.2.6, at **Level A** — the baseline conformance level. Where a set of pages repeats a help mechanism, that mechanism must appear in the **same order relative to the other content on the page**, unless the user themselves changes it.

The criterion names four kinds of help mechanism:

- **Human contact details** — a phone number, an email address, opening hours.
- **A human contact mechanism** — a contact form, a messaging system, live chat, a social media handle.
- **A self-help option** — an FAQ, a "How do I…" page, a support or documentation link.
- **A fully automated contact mechanism** — a chatbot.

"Same order relative to other page content" is about the serialised order of the content, not pixel position. A help link that is the last item in the header on every page still passes when a narrow viewport reflows the header below the logo, because its position in the content sequence has not moved. Two layout variations of the same page set are each judged on their own terms.

### It does not require you to offer help

The wrong belief readers arrive with is that 3.2.6 obliges every site to provide a support channel. It does not. The criterion is entirely conditional: *if* you already repeat a help mechanism across pages, keep it in a consistent place. A site with no contact link, no FAQ, and no chat widget satisfies 3.2.6 without doing anything.

It is also narrower than it sounds in the other direction. 3.2.6 does not govern the *content* of the help, whether the help is any good, or whether it is reachable in one click. And it is distinct from **3.2.3 Consistent Navigation**, which governs repeated navigation *blocks*. Help mechanisms often sit inside navigation, so a page can satisfy 3.2.3 and still fail 3.2.6 — for instance when the header nav is identical everywhere but a "Need help?" link floats into the footer on the checkout page.

## Why it matters

Someone who needs help is, by definition, already stuck. Making them hunt for the help itself compounds the problem, and it compounds hardest for the people least able to absorb it:

- Visitors with cognitive or learning disabilities, who rely on locating a known affordance in a known place rather than re-scanning each page.
- Visitors with low vision using magnification, who see a small slice of the page at a time and must pan to search. A help link that moves means panning the whole page again.
- Visitors with anxiety or under time pressure — a checkout timing out, a form rejecting an entry — for whom a relocated support link reads as no support link.

Users build a spatial and sequential memory of a site within a page or two. A consistent help affordance turns that memory into a reliable escape hatch. An inconsistent one throws the memory away exactly when it is needed.

## How to implement

- **Pick one slot and keep it.** Put the help affordance in the same place in the source order on every page that repeats it — last item in the primary nav, or first item in the footer's support column. Consistency of the source order is what is judged.
- **Render it from one shared template.** If the header and footer come from a single layout, this criterion is satisfied almost for free. Failures cluster on pages that opt out of the shared layout: checkout, login, and error pages.
- **Do not special-case the pages that need it most.** A stripped-down checkout that drops the site header to reduce distraction is precisely where a stuck user reaches for support.
- **If the mechanism differs by page, that's fine.** A contact link on marketing pages and a chat widget in the account area are different mechanisms, not an inconsistency. The criterion applies to each mechanism across the pages where it is repeated.
- **User-initiated change is allowed.** If someone collapses a help panel or dismisses a chat bubble, honouring that choice on the next page does not fail the criterion.

## Common mistakes

- A "Contact us" link in the header everywhere except checkout, where it moves to the footer.
- A chat widget that is the first thing in the DOM on the home page and buried after the main content elsewhere.
- Error pages and maintenance pages rendered from a bare template with no help affordance at all — see [error pages](/spec/resilience/error-pages/).
- Assuming that passing 3.2.3 Consistent Navigation covers this; help often sits outside the navigation block.
- Treating visual position as the test. The test is content order, per layout variation.

## Verification

- List the help mechanisms your site repeats. For each, open every page in the set and note its position in the source order.
- Tab through several pages in sequence. The help affordance should be reached at the same point in the tab order relative to the surrounding landmarks.
- Check the pages that skip the shared layout — checkout, login, 404, maintenance — since those are where the inconsistency lives.
- Repeat at a narrow viewport. Each layout variation is judged separately, so both must be internally consistent.
