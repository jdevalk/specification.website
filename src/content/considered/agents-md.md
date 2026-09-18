---
title: "AGENTS.md"
date: "2026-09-12"
reason: out-of-scope
revisit: "A served form of the convention — agents.md describing a path an origin answers, or consumers fetching AGENTS.md over HTTP from a site they never cloned. Adoption is not the open question here; direction is."
sources:
  - title: "AGENTS.md"
    url: "https://agents.md/"
    publisher: "AGENTS.md (Agentic AI Foundation)"
  - title: "agentsmd/agents.md on GitHub"
    url: "https://github.com/agentsmd/agents.md"
    publisher: "AGENTS.md"
  - title: "Linux Foundation Announces the Formation of the Agentic AI Foundation"
    url: "https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation"
    publisher: "Linux Foundation"
---

AGENTS.md is a plain Markdown file at the root of a repository that tells a coding agent how to work on that codebase: build commands, test commands, style rules, the conventions a README leaves out because human contributors absorb them by osmosis. The format was published in August 2025 out of work across OpenAI Codex, Google's Jules, Cursor, Amp and Factory, and is now stewarded by the Agentic AI Foundation under the Linux Foundation, alongside the Model Context Protocol. More than 60,000 open-source projects carry one and more than twenty coding tools read it. Against the adoption bar this register normally applies, it passes comfortably — which is precisely why it needs an entry rather than silence.

It does not land here because nobody serves it. Every agent-readiness topic in this spec — [llms.txt](/spec/agent-readiness/llms-txt/), [Agent Skills discovery](/spec/agent-readiness/agent-skills-discovery/), [A2A agent cards](/spec/agent-readiness/a2a-agent-cards/), [Markdown source endpoints](/spec/agent-readiness/markdown-source-endpoints/) — describes something an origin answers over HTTP to an agent that arrived from outside and knows nothing about you. AGENTS.md runs the other way: instructions that travel with the source, to an agent that already holds a working copy. A website is neither better nor worse for the file existing, and there is no URL to check, which is the test that decides these cases.

The boundary is worth naming rather than assuming, because the website-side equivalent exists and is easy to confuse with this one. Agent Skills discovery is the same instinct pointed outward — a `SKILL.md` that teaches an agent how to use the site, indexed at a well-known URI with a digest so a client can find and verify it without cloning anything. If you want the benefit of AGENTS.md for the agents that visit you rather than the ones that check you out, that is the page to read. Whether a given *repository* should carry an AGENTS.md is a real question, and a good one; it is simply a question about a codebase, not about a website.
