---
title: "robots.txt for AI crawlers"
slug: robots-for-ai-crawlers
category: agent-readiness
summary: "Major AI vendors publish named user-agents for their crawlers. Setting an explicit allow or disallow per agent is the clearest way to control how your content is used."
status: recommended
order: 40
appliesTo: [all]
relatedSlugs: [robots-txt, content-signals, tdmrep, agent-readiness-overview, llms-txt, web-bot-auth]
updated: "2026-05-29T12:14:17.000Z"
sources:
  - title: "OpenAI — GPTBot"
    url: "https://platform.openai.com/docs/bots"
    publisher: "OpenAI"
  - title: "Anthropic — Crawlers"
    url: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"
    publisher: "Anthropic"
  - title: "Google — Google-Extended"
    url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended"
    publisher: "Google Crawling Infrastructure"
  - title: "Apple — Applebot-Extended"
    url: "https://support.apple.com/en-us/119829"
    publisher: "Apple"
---

## What it is

The robots.txt file (see [robots.txt](/spec/seo/robots-txt/)) accepts rules per user-agent. Every major AI vendor now publishes a named user-agent for its training and retrieval crawlers, so you can allow or block each one independently of search.

The big ones, as of 2026:

- **GPTBot** — OpenAI training crawler.
- **OAI-SearchBot** — OpenAI retrieval crawler used by ChatGPT browsing.
- **ChatGPT-User** — on-demand fetches when a ChatGPT user asks for a URL.
- **ClaudeBot** — Anthropic training and retrieval crawler.
- **anthropic-ai** — legacy Anthropic user-agent, still seen.
- **Google-Extended** — opts out of Gemini and Vertex training without affecting Search.
- **Applebot-Extended** — opts out of Apple Intelligence training without affecting Siri/Spotlight.
- **PerplexityBot** — Perplexity retrieval crawler.
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

User-agent: PerplexityBot
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

## Common mistakes

- Blocking `*` and forgetting that this also blocks Google.
- Blocking only `GPTBot` and assuming no OpenAI surface can see your site — `OAI-SearchBot` and `ChatGPT-User` are separate.
- Leaving stale user-agents from 2023 lists. Names change; the vendor docs are the source of truth.
- Treating disallow as deletion. Content already in training sets stays there.

## Verification

- Fetch `https://example.com/robots.txt` and check each rule renders.
- Cross-reference your list against the linked vendor pages — they are updated regularly.
- Watch server logs for the user-agents you care about and confirm they back off after a rule change.
