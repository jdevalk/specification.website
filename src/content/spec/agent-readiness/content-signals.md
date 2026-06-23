---
title: "Content Signals in robots.txt"
slug: content-signals
category: agent-readiness
summary: "Add Content-Signal directives to robots.txt to declare whether AI crawlers may search, ingest, or train on your content. An emerging IETF AI Preferences / IAB Tech Lab proposal that some validators already check."
status: optional
order: 42
appliesTo: [all]
relatedSlugs: [robots-for-ai-crawlers, robots-txt, agent-readiness-overview, web-bot-auth]
updated: "2026-05-29T12:14:17.000Z"
sources:
  - title: "IETF AI Preferences WG (aipref) — drafts"
    url: "https://datatracker.ietf.org/wg/aipref/documents/"
    publisher: "IETF"
  - title: "IAB Tech Lab — Content Monetization Protocols (CoMP) for AI"
    url: "https://iabtechlab.com/working-groups/content-monetization-protocols-comp-for-ai-working-group/"
    publisher: "IAB Tech Lab"
  - title: "Is It Agent Ready? — Content Signals check"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
  - title: "RFC 9309 — Robots Exclusion Protocol"
    url: "https://www.rfc-editor.org/rfc/rfc9309"
    publisher: "IETF"
---

## What it is

Content Signals is a proposed extension to `robots.txt` that adds new directives expressing how a site wants its content treated downstream — specifically by AI systems. The directives live in normal `robots.txt` groups and declare boolean preferences such as "you may use this for search" or "you may not train on this".

```
User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

The three values that are emerging as canonical:

- **`search`** — whether the content may be indexed by search engines.
- **`ai-input`** — whether the content may be fetched as live input to an AI system (retrieval-augmented generation, summarisation at query time).
- **`ai-train`** — whether the content may be included in a training corpus.

Each takes `yes` or `no`. Multiple values are comma-separated on a single `Content-Signal:` line.

## Status of the proposal

This is **not yet a settled standard**. The work is split across two ongoing efforts:

- The **IETF AI Preferences working group ([aipref](https://datatracker.ietf.org/wg/aipref/documents/))** is working on a vocabulary and protocol-level definition.
- The **IAB Tech Lab Content Signals project** has published a parallel specification aimed at industry adoption.

Drafts have been circulating since 2024 and the vocabulary is converging. Treat Content Signals as recommended-to-experiment-with, not as a finalised standard. The directive will be ignored by every crawler that does not yet parse it — which today is most of them.

## Why it matters

- **A declarative opt-in / opt-out at the right layer.** Existing `User-agent: GPTBot / Disallow:` directives are coarse — they block a specific bot from fetching anything. Content Signals separates *what* the bot may do from *who* the bot is.
- **Validators already check for it.** [isitagentready.com](https://isitagentready.com/) explicitly looks for `Content-Signal:` lines in `robots.txt`. Sites that want a clean agent-readiness scorecard should add them.
- **Some major model providers have signalled future support.** Cloudflare, Google, and others have published positions on the IETF drafts.

## How to implement

**Per-group, in `robots.txt`.** Place the `Content-Signal:` line inside the same group as `User-agent:` and `Allow:` / `Disallow:`.

```
User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=yes
```

The example above says: "any crawler may use this content for search, for AI input, and for AI training." That is the right declaration for a public spec that wants to be readable.

**Different signals per crawler if your policy varies.** Use a targeted group:

```
User-agent: GPTBot
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=no

User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=yes
```

**Pair with crawler-specific blocks where the answer is "no".** Content Signals is a hint; many crawlers still only obey `Disallow:`. A `Content-Signal: ai-train=no` paired with `User-agent: GPTBot \n Disallow: /` is stronger than either alone.

**Don't treat it as legal force.** It is a declaration. Compliance is voluntary, and the legal status of "you used my content for training despite my Content-Signal" is still developing.

## Common mistakes

- Spelling: `Content-Signal:` (singular). Not `Content-Signals:`.
- Putting the directive outside a group (no preceding `User-agent:` line). Some parsers will silently ignore it.
- Conflicting with `Disallow:`. If you `Disallow: /` for a bot, that bot was never going to fetch the page to read your `Content-Signal:`. They contradict; pick one.
- Inventing values beyond `yes` / `no`. The vocabulary is small on purpose.
- Treating it as a substitute for `Disallow:`. It is complementary.

## Verification

- `curl -s https://example.com/robots.txt | grep -i content-signal` lists every directive.
- [Is It Agent Ready?](https://isitagentready.com/) flips `botAccessControl.contentSignals` to `pass`.
- Track the [IETF aipref WG](https://datatracker.ietf.org/wg/aipref/documents/) for the final published vocabulary — names may yet shift before the RFC is published.
