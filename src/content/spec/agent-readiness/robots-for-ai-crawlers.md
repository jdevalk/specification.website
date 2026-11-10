---
title: "robots.txt for AI crawlers"
slug: robots-for-ai-crawlers
category: agent-readiness
summary: "Major AI vendors publish named user-agents for their crawlers. Setting an explicit allow or disallow per agent is the clearest way to control how your content is used."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [robots-txt, meta-robots, content-signals, tdmrep, agent-readiness-overview, llms-txt, web-bot-auth]
updated: "2026-11-04T00:00:00.000Z"
sources:
  - title: "OpenAI — Overview of OpenAI Crawlers"
    url: "https://developers.openai.com/api/docs/bots"
    publisher: "OpenAI"
  - title: "Perplexity — Perplexity Crawlers"
    url: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers"
    publisher: "Perplexity"
  - title: "Anthropic — Crawlers"
    url: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"
    publisher: "Anthropic"
  - title: "Google — Google-Extended"
    url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended"
    publisher: "Google Crawling Infrastructure"
  - title: "Apple — Applebot-Extended"
    url: "https://support.apple.com/en-us/119829"
    publisher: "Apple"
  - title: "Machine-Readable Training Preference Signal (Internet-Draft)"
    url: "https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/"
    publisher: "IETF"
---

## What it is

The robots.txt file (see [robots.txt](/spec/seo/robots-txt/)) accepts rules per user-agent. Every major AI vendor now publishes a named user-agent for its training and retrieval crawlers, so you can allow or block each one independently of search.

The big ones, as of 2026:

- **GPTBot** — OpenAI training crawler.
- **OAI-SearchBot** — OpenAI search crawler; surfaces sites in ChatGPT search results.
- **ChatGPT-User** — on-demand fetches when a ChatGPT user asks for a URL.
- **ClaudeBot** — Anthropic training crawler.
- **Claude-SearchBot** — Anthropic search-indexing crawler.
- **Claude-User** — on-demand fetches when a Claude user's question needs a page.
- **anthropic-ai** — legacy Anthropic user-agent, still seen.
- **Google-Extended** — opts out of training and grounding in Gemini Apps and Vertex AI, without affecting Search.
- **Applebot-Extended** — opts out of Apple Intelligence training without affecting Siri/Spotlight.
- **PerplexityBot** — Perplexity search crawler; surfaces and links sites in Perplexity results.
- **Perplexity-User** — on-demand fetches when a Perplexity user's question needs a page.
- **Bytespider** — ByteDance crawler, widely used for training.
- **CCBot** — Common Crawl, the dataset behind many open models.

## Why it matters

A blanket `Disallow: /` blocks everyone, including search. Naming agents lets you make precise decisions: allow retrieval bots so your content can be cited live, block training bots if you do not want to feed model weights, or the reverse.

Compliance is honour-based. Reputable vendors document and respect their user-agents. Unidentified scrapers will ignore robots.txt; defend against those with rate limits or WAF rules, not robots.

## How to implement

A reasonable default that allows search and retrieval but opts out of training:

```txt
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: *
Allow: /

Sitemap: https://example.com/sitemap_index.xml
```

Rules of thumb:

- Read each vendor's documentation; user-agents change.
- Decisions are per-host. A subdomain needs its own robots.txt.
- Combine with [/llms.txt](/spec/agent-readiness/llms-txt/) when you want to allow access but steer agents to specific pages.
- For paywalled or member content, keep auth in place — robots.txt is not a security boundary.

### A shared training preference

An [Internet-Draft published on 30 October 2026](https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/) defines one name for stating a training preference to every provider that honours it, instead of listing each vendor:

```txt
User-agent: __usage_ai-training
Disallow: /
Allow: /press-kit/
```

**This looks like a crawler rule, but it is not one.** No bot needs to send that name, and the group does not itself stop anything being fetched. `Disallow` states a preference against generative AI training on those paths, and `Allow` states a preference in favour. To limit crawling, keep rules for each crawler's own user-agent. A `User-agent: *` group does not count, so a blanket `Disallow: /` under `*` expresses no preference through this mechanism, and a file without the group expresses none at all.

Nothing has been announced as live yet. [Microsoft](https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/) will honour it from 1 February 2027 and [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) intends to in early 2027. [OpenAI](https://openai.com/index/helping-websites-express-ai-training-preferences/) aims to in the coming months, and [Anthropic](https://mailarchive.ietf.org/arch/msg/ai-control/mddjatOxSR0h6GmLRBWlc839c7w/) has started implementing it. The draft is an individual submission, not yet a working-group document, so the details may change.

Keep your per-vendor rules, because the shared group sits alongside them and does not replace them. A vendor's own token can take precedence: [Google](https://developers.google.com/search/blog/2026/10/ai-training-control) applies the shared opt-out only where `Google-Extended` is not explicitly specified.

This site does not publish the group: it has no training opt-out to express, and it already allows these crawlers by name.

## Common mistakes

- Blocking `*` and forgetting that this also blocks Google.
- Blocking only `GPTBot` and assuming no OpenAI surface can see your site — `OAI-SearchBot` and `ChatGPT-User` are separate. The same split applies to Anthropic: `ClaudeBot`, `Claude-SearchBot` and `Claude-User` are governed independently.
- Blocking `Google-Extended` to stay out of AI Overviews. It does not govern Search, so it has no effect there. AI Overviews, AI Mode and generative AI in Discover have their own [Search generative AI control](https://support.google.com/webmasters/answer/16908024), set per property in Search Console rather than in robots.txt. That control leaves classic results and ranking alone and does not cover training, so the two settings answer different questions. To limit individual pages instead, use the preview rules in [meta robots](/spec/seo/meta-robots/).
- Leaving stale user-agents from 2023 lists. Names change; the vendor docs are the source of truth.
- Treating disallow as deletion. Content already in training sets stays there.
- Using `User-agent: __usage_ai-training` to keep a crawler out. It states a preference about training, not a crawling rule.

## Verification

- Fetch `https://example.com/robots.txt` and check each rule renders.
- Cross-reference your list against the linked vendor pages — they are updated regularly.
- Watch server logs for the user-agents you care about and confirm they back off after a rule change.
