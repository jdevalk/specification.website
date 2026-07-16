---
title: "MCP and tool discovery"
slug: mcp-and-tool-discovery
category: agent-readiness
summary: "The Model Context Protocol is an emerging way for sites to expose queryable tools to agents over JSON-RPC. Relevant whenever your content has structure worth filtering — even for a static reference site like this one."
status: optional
order: 80
appliesTo: [all]
relatedSlugs: [agent-readiness-overview, machine-readable-formats, llms-txt, link-headers, api-catalog, agent-skills-discovery, a2a-agent-cards, webmcp, nlweb, agentic-resource-discovery, oauth-protected-resource]
updated: "2026-07-16T00:00:00.000Z"
sources:
  - title: "Model Context Protocol"
    url: "https://modelcontextprotocol.io/"
    publisher: "Anthropic / MCP project"
  - title: "MCP specification"
    url: "https://modelcontextprotocol.io/specification"
    publisher: "MCP project"
  - title: "MCP server tools: annotations & structured content"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/server/tools"
    publisher: "MCP project"
  - title: "Is It Agent Ready?"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
---

## What it is

The Model Context Protocol (MCP) is an open protocol, originally proposed by Anthropic in late 2024, that defines how language-model clients talk to external tools and data sources. Instead of an agent scraping your UI, you expose an MCP server that declares a set of tools, resources, and prompts; the agent calls them directly.

MCP is built on JSON-RPC over two transports — stdio for local servers, Streamable HTTP for remote ones (the older HTTP-plus-Server-Sent-Events transport is deprecated). A tool definition includes a name, a description, and a JSON Schema for inputs.

This is relevant when your site exposes actions a user might want an agent to take: search a catalogue, create a ticket, book an appointment, query an account. For static content sites and blogs, MCP often adds little — well-cached HTML and a feed are enough. The exception is structured content sites where the data is filterable: a documentation set, a spec, a knowledge base. There an MCP server lets an agent ask "list all required SEO topics" or "give me the canonical CSP page" in a single typed call, instead of crawling and parsing.

This site ships such a server as a worked example. See [mcp.specification.website](https://mcp.specification.website/) for the live endpoint, [`/.well-known/mcp/server-card.json`](/.well-known/mcp/server-card.json) for the discovery document, and the [`mcp/` directory of the source repo](https://github.com/jdevalk/specification.website/tree/main/mcp) for a ~300-line Cloudflare Worker implementation. Every tool it exposes is annotated `readOnlyHint` and declares an `outputSchema`, so clients get typed results alongside the human-readable text.

Larger reference sites are reaching the same conclusion. In 2026 MDN — the canonical web-platform documentation — [shipped its own MCP server](https://developer.mozilla.org/en-US/blog/introducing-mdn-mcp-server/), exposing its docs and Baseline browser-compatibility data over the same protocol so agents query it directly instead of scraping pages. When the material a developer would otherwise read by hand becomes a typed, queryable tool, that is the signal a corpus is worth serving over MCP.

## Why it matters

- Agents call your functionality through a defined contract instead of guessing from a UI. Behaviour is predictable and auditable.
- One MCP server can be reused across Claude, ChatGPT (via connectors), and any other MCP-aware client. No per-vendor integration.
- Authorisation is explicit. Tools declare what they do; the agent (and the user) consents before calling.
- The same server is useful for your own internal automation, not just public agents.

Adoption is real but uneven. Treat it as an emerging convention worth investing in if your product is API-shaped, and as overkill if it is not.

## How to implement

- Decide what you want agents to do. Read-only tools (`search_products`, `get_order_status`) are a safe first step; write tools (`create_ticket`, `update_address`) come with stronger auth requirements.
- Build an MCP server. The reference SDKs cover TypeScript, Python, and others; see [modelcontextprotocol.io](https://modelcontextprotocol.io/).
- Host it at a discoverable URL such as `/mcp` or a subdomain like `mcp.example.com`. Document the endpoint in your developer docs and link it from [/llms.txt](/spec/agent-readiness/llms-txt/).
- **Publish a server card.** Ship `/.well-known/mcp/server-card.json` describing the server's name, version, transport, endpoint URL, capabilities, tools, and prompts. Add a `Link: </.well-known/mcp/server-card.json>; rel="mcp"` header on your main site so the card is discoverable without guessing the path — see [HTTP Link headers](/spec/agent-readiness/link-headers/) and [`/.well-known/api-catalog`](/spec/well-known/api-catalog/).
- Use OAuth 2.1 (the MCP spec aligns with it) for any tool that touches user data. Never accept long-lived API keys in tool calls.
- Keep tool descriptions short and precise. Agents pick which tool to call from the description. State what the tool does *not* cover and which sibling tool to use instead, so the agent disambiguates without a trial call.
- **Declare behaviour with annotations.** Each tool can carry hints — `readOnlyHint`, `idempotentHint`, `destructiveHint`, `openWorldHint` — that tell a client whether the tool has side effects, is safe to retry, or reaches beyond a closed corpus. A read-only search over bundled data should advertise `readOnlyHint: true` and `openWorldHint: false`. Clients and gateways read these to decide what to call without prompting the user.
- **Return structured output, not just prose.** Since the 2025-06-18 revision a tool can declare an `outputSchema` and return a matching `structuredContent` object next to the human-readable text. A calling agent then consumes typed data instead of re-parsing Markdown. Document every field and version the output schema as carefully as the input one.
- Version the schema. Renaming a tool or changing its input shape is a breaking change.

## Common mistakes

- Exposing every internal API as an MCP tool. Curate; agents reason better about a small, well-named surface.
- Skipping rate limits and audit logs. An MCP endpoint that an agent can call repeatedly is an abuse vector.
- Mixing read and write tools without clear naming. Make destructive actions obvious in the tool name.
- Annotations that lie. Marking a write tool `readOnlyHint: true` is worse than omitting the hint — clients trust it and skip the confirmation a destructive call deserves.
- Treating MCP as a replacement for documentation. It complements it; it does not replace it.

## Verification

- Connect your server with the MCP Inspector or a reference client and confirm tools list, call, and return as expected.
- Review the OAuth flow end to end.
- Watch logs after a public launch for unexpected call patterns.
