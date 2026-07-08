---
title: Native single-open accordions with the details name attribute
date: "2026-07-08"
type: changed
relatedSlugs: [native-interactive-elements]
---

Expanded [native interactive elements](/spec/accessibility/native-interactive-elements/) to cover grouping `<details>` elements by a shared `name`: the browser then enforces a single-open accordion natively — no JavaScript, and each panel keeps its keyboard, focus, and disclosure semantics. The behaviour is now interoperable across every engine (Firefox shipped it in 130).
