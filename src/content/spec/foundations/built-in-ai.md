---
title: "Built-in AI APIs"
slug: built-in-ai
category: foundations
summary: "Use the browser's on-device AI APIs — Prompt, Summarizer, Translator, Language Detector — as a progressive enhancement: check availability first, gate model downloads on a user gesture, and always keep a server or manual path."
status: optional
order: 175
appliesTo: [all]
relatedSlugs: [graceful-degradation, data-minimization, script-loading]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "Prompt API — W3C Web Machine Learning Community Group"
    url: "https://webmachinelearning.github.io/prompt-api/"
    publisher: "W3C WebML CG"
  - title: "Translation API — Web Machine Learning Community Group"
    url: "https://github.com/webmachinelearning/translation-api"
    publisher: "W3C WebML CG"
  - title: "MDN — Summarizer"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Summarizer"
    publisher: "MDN"
---

## What it is

Modern browsers are beginning to expose the on-device language model they already ship as a set of task-specific JavaScript APIs: the Prompt API (`LanguageModel`) for general prompting, `Summarizer` for summaries in defined shapes (key points, tl;dr, teaser, headline), `Translator` for translation between language pairs, and `LanguageDetector` for identifying a text's language. The page supplies the input; the browser runs a local model (Gemini Nano in Chrome's case); nothing is sent to a server.

Two clarifications matter more than the API shapes. First, this is not a standard feature set yet: the APIs are Web Machine Learning Community Group drafts, shipped only in Chrome and Edge on desktop (Summarizer and Translator since version 138 in 2025, the Prompt API since Chrome 148), absent from Firefox and Safari. The Gemini Nano-backed APIs (Prompt, Summarizer) are further gated behind real hardware requirements — on the order of 22 GB of free storage and 16 GB of RAM; the Translator and Language Detector run smaller dedicated models and do not share those requirements. Second, on-device does not mean free of consequence: results are nondeterministic, quality varies by language and device, and the model download is gigabytes the user did not ask for unless your interface asks properly. Hence optional, and hence the discipline below matters more than the calls themselves.

## Why it matters

Where it fits, the properties are genuinely new: translation and summarization with no per-request cost, no latency beyond the device, and no content leaving the machine — a [data minimisation](/spec/privacy/data-minimization/) win that a cloud API cannot match, and the only form of AI feature that works offline. Chrome's market share makes the reachable audience large. But a feature that exists on a third of your visitors' machines is an enhancement layer, never a foundation: the site must be complete without it.

## How to implement

- **Ask availability first, per capability and language pair.** Every API follows the same pattern: `await Summarizer.availability(options)` (and equivalents) returns `available`, `downloadable`, `downloading`, or `unavailable`. Pass the identical options object to `availability()` and `create()` — for translation, availability is per language pair, and a pair can be downloadable while the API itself is present.
- **Gate downloads on a user gesture and show progress.** When the state is `downloadable`, start `create()` from an explicit user action (never on page load), and attach the `monitor` callback to report download progress. A multi-gigabyte silent download is a consent failure, not an optimisation.
- **Never call the deprecated surface.** Early previews exposed these under `window.ai.*`; that namespace is dead. Use the standalone globals (`LanguageModel`, `Summarizer`, `Translator`, `LanguageDetector`).
- **Keep a real fallback.** Server-side processing, a plainer feature, or the user doing the task manually — chosen per feature, and indistinguishable in the interface from the enhanced path except in speed and cost. This is [graceful degradation](/spec/resilience/graceful-degradation/) applied to a capability rather than to JavaScript as a whole.
- **Treat output as untrusted content.** Model output is text a probabilistic system produced from partly user-supplied input: render it as text, never via `innerHTML` (see [sanitizing untrusted HTML](/spec/security/sanitizer-api/) when markup is genuinely needed), and validate structured output — the Prompt API accepts a JSON Schema `responseConstraint`; use it rather than parsing prose.
- **Use the task APIs before the general one.** If the job is translation, summarization, or detection, the dedicated API is smaller, more predictable, and easier to make available than a prompted general model. Reach for `LanguageModel` only when no task API fits.

## Common mistakes

- Building a feature that silently does nothing for most visitors — no availability check, no fallback, a button that is dead in Firefox, Safari, and every under-specced laptop.
- Triggering the model download during page load or onboarding, before the user has expressed any intent to use the feature.
- Passing different options to `availability()` and `create()` and concluding the API is "flaky" when the session that starts is not the one whose availability was checked.
- Rendering streamed model output as HTML as it arrives, sanitization debt included.
- Assuming on-device means private in every respect that matters: the input stays local, but prompts built from page content can still leak that content into logs, session replays, or shared sessions if you persist them carelessly.

## Verification

- On a machine without the APIs (Firefox or Safari), the feature falls back completely and the interface says so honestly.
- On a supported machine without the model, the download starts only after an explicit user action, with visible progress and a way to cancel by leaving.
- Force `unavailable` (unsupported language pair, insufficient storage) and confirm the fallback path engages.
- Feed the feature adversarial input (markup, instructions embedded in content to summarize) and confirm the output is rendered as inert text and cannot alter the page.
