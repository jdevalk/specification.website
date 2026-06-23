---
title: "NLWeb — conversational interface discovery"
slug: nlweb
category: agent-readiness
summary: "NLWeb is an emerging convention for exposing a site as a conversational AI endpoint. A site advertises an `/ask`-style endpoint via a `rel=\"nlweb\"` link and serves an MCP-compatible JSON-RPC interface that agents can query in natural language."
status: optional
order: 87
appliesTo: [all]
relatedSlugs: [mcp-and-tool-discovery, agent-readiness-overview, structured-data-for-agents, link-headers]
updated: "2026-05-29T12:14:17.000Z"
sources:
  - title: "microsoft/NLWeb on GitHub"
    url: "https://github.com/microsoft/NLWeb"
    publisher: "Microsoft"
  - title: "NLWeb — REST API"
    url: "https://github.com/microsoft/NLWeb/blob/main/docs/nlweb-rest-api.md"
    publisher: "Microsoft"
  - title: "schema.org"
    url: "https://schema.org/"
    publisher: "schema.org"
---

## What it is

NLWeb is an open project, originally from Microsoft, that lets any website expose a conversational query interface in a standard way. A site implements a small HTTP endpoint — by convention `/ask` — that accepts a natural-language query and returns a structured answer grounded in the site's own content, typically built from its [schema.org](https://schema.org/) data and embeddings of its pages.

Discovery is one HTML link tag:

```html
<link rel="nlweb" href="/ask" title="Ask this site">
```

An agent that recognises the relation knows the site speaks NLWeb without further negotiation. The endpoint itself follows a documented JSON shape and can additionally be wrapped as an MCP tool, so the same query path is reachable from both browser-side and server-side agent runtimes.

## Why it matters

- **One endpoint per site, not per question.** NLWeb gives agents a single answerable surface instead of asking them to crawl, embed, and reason over every page themselves.
- **Grounded in your own content.** Answers come from the site's structured data and corpus. A site retains editorial control over what gets cited.
- **Composes with [MCP](/spec/agent-readiness/mcp-and-tool-discovery/).** The NLWeb endpoint can also be exposed as an `ask_site` MCP tool. Same logic, two transports.
- **Cheap to ship.** A static site with [structured data](/spec/agent-readiness/structured-data-for-agents/) and a small vector index can answer most factual questions about its own content without a chatbot UI.

The convention is early and mostly Microsoft-driven so far, but the discovery link is a single line in `<head>` and the endpoint shape is documented. Treat NLWeb as `optional` — recommended where the site already has the corpus to ground answers, skippable for small static sites.

## How to implement

- **Build the corpus.** Index your pages — embeddings of the body text, plus the [JSON-LD](/spec/agent-readiness/structured-data-for-agents/) you already publish. Many implementations use the same schema.org data they ship in `<head>` as the source of truth.
- **Expose `/ask`.** Accept `GET` with a `query` parameter, or `POST` with a JSON body. Return JSON with the answer, the sources cited (URLs into your own site), and any structured results.
- **Advertise it.** Add `<link rel="nlweb" href="/ask">` to `<head>` and a matching `Link: </ask>; rel="nlweb"` HTTP header. See [HTTP Link headers](/spec/agent-readiness/link-headers/).
- **Mirror as an MCP tool.** If you already ship an [MCP server](/spec/agent-readiness/mcp-and-tool-discovery/), register a tool — `ask_site` is the common name — that wraps the same endpoint. Agents that speak MCP but not NLWeb get the same capability.
- **Cite, always.** Every answer should include the source URLs it was built from. Answers without citations train users (and agents) to mistrust the surface.

## Common mistakes

- Answering questions the site has no authority to answer. Scope `/ask` to your own corpus; refuse off-topic questions rather than guessing.
- Shipping a chatbot UI without the discovery link. Agents need the `rel="nlweb"` signal to find the endpoint; humans clicking a widget do not.
- Letting the index go stale. A grounded answer pulled from last quarter's corpus reads as a wrong answer, not a delayed one.
- Returning HTML. NLWeb is a machine interface; the response is JSON. If you also want to render the answer in a UI, do it client-side from the JSON.

## Verification

- `curl -sI https://example.com/ | grep -i nlweb` returns a `Link` header with `rel="nlweb"`.
- View source on the homepage — `<link rel="nlweb" href="…">` is present.
- `curl 'https://example.com/ask?query=what+do+you+do'` returns a JSON body with an `answer` field and a `sources` array of URLs into your own site.
- Spot-check that the cited URLs exist and that the answer matches what is on them.
