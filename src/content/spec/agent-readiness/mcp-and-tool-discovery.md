---
title: "MCP and tool discovery"
slug: mcp-and-tool-discovery
category: agent-readiness
summary: "The Model Context Protocol is an emerging way for sites to expose queryable tools to agents over JSON-RPC. Relevant whenever your content has structure worth filtering — even for a static reference site like this one."
status: optional
order: 80
appliesTo: [all]
relatedSlugs: [agent-readiness-overview, machine-readable-formats, llms-txt, link-headers, api-catalog, agent-skills-discovery, a2a-agent-cards, webmcp, nlweb, agentic-resource-discovery, oauth-protected-resource]
updated: "2026-07-28T00:00:00.000Z"
sources:
  - title: "Model Context Protocol"
    url: "https://modelcontextprotocol.io/"
    publisher: "Anthropic / MCP project"
  - title: "MCP specification"
    url: "https://modelcontextprotocol.io/specification"
    publisher: "MCP project"
  - title: "MCP 2026-07-28 — versioning and backward compatibility"
    url: "https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning"
    publisher: "MCP project"
  - title: "MCP 2026-07-28 — Streamable HTTP transport"
    url: "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http"
    publisher: "MCP project"
---

## What it is

The Model Context Protocol (MCP) is an open protocol, originally proposed by Anthropic in late 2024, that defines how language-model clients talk to external tools and data sources. Instead of an agent scraping your UI, you expose an MCP server that declares a set of tools, resources, and prompts; the agent calls them directly.

MCP is built on JSON-RPC over two transports — stdio for local servers, Streamable HTTP for remote ones (the older HTTP-plus-Server-Sent-Events transport is deprecated). A tool definition includes a name, a description, and a JSON Schema for inputs.

**Since the 2026-07-28 revision there is no connection handshake.** Earlier revisions opened with an `initialize` exchange that negotiated a protocol version once and established a session for everything that followed. That is gone: each request now declares its own version in a `_meta` field, mirrored into an `MCP-Protocol-Version` header, and the server accepts or rejects it independently. A server that does not implement the requested version answers with `UnsupportedProtocolVersionError` listing what it does support, and the client retries. Sessions, the standalone `GET` stream, and resumable streams went with the handshake.

The practical consequence is that an MCP server is now a plain request/response HTTP endpoint, which is why it can sit on serverless and edge infrastructure without sticky routing. One new call is mandatory: `server/discover` returns the supported versions, capabilities, and identity in a single request, so a client can learn what a server is before calling anything.

This is relevant when your site exposes actions a user might want an agent to take: search a catalogue, create a ticket, book an appointment, query an account. For static content sites and blogs, MCP often adds little — well-cached HTML and a feed are enough. The exception is structured content sites where the data is filterable: a documentation set, a spec, a knowledge base. There an MCP server lets an agent ask "list all required SEO topics" or "give me the canonical CSP page" in a single typed call, instead of crawling and parsing.

This site ships such a server as a worked example. See [mcp.specification.website](https://mcp.specification.website/) for the live endpoint, [`/.well-known/mcp/server-card.json`](/.well-known/mcp/server-card.json) for the discovery document, and the [`mcp/` directory of the source repo](https://github.com/jdevalk/specification.website/tree/main/mcp) for the Cloudflare Worker implementation. Every tool it exposes is annotated `readOnlyHint` and declares an `outputSchema`, so clients get typed results alongside the human-readable text. It serves 2026-07-28 and still answers the handshake-based revisions back to 2025-03-26 on the same endpoint — see [supporting both eras](#supporting-both-eras) below.

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

### Supporting both eras

The handshake did not disappear from the field the day it disappeared from the specification. Clients written against `2025-11-25` and earlier will keep opening with `initialize` for a long time, and they have no way to fall forward — a legacy client meeting a modern-only server simply fails, with no mechanism to discover why. If you already run a server, answering both is the courteous option and is explicitly provided for.

A dual-era server decides which semantics to apply from how the client opens, not from configuration:

- A request carrying the per-request version metadata is served under the new revision, statelessly.
- An `initialize` request selects the older, session-based semantics.

Two details are easy to get wrong. First, an `initialize` handshake must never be answered with `2026-07-28` — that revision has no handshake, so echoing it back promises something the server cannot then honour; answer with the newest revision that does have one. Second, apply the new header validation only to requests that declare the new version. Imposing `Mcp-Method` and `Mcp-Name` on a legacy request rejects a client that is behaving correctly for the revision it speaks.

Validation matters because the transport now mirrors body fields into headers so intermediaries can route without parsing JSON. If a header and the body disagree, a load balancer and your server are acting on different instructions — so the specification requires you to reject the request with a `HeaderMismatch` error rather than pick a winner.

## Common mistakes

- Exposing every internal API as an MCP tool. Curate; agents reason better about a small, well-named surface.
- Skipping rate limits and audit logs. An MCP endpoint that an agent can call repeatedly is an abuse vector.
- Mixing read and write tools without clear naming. Make destructive actions obvious in the tool name.
- Annotations that lie. Marking a write tool `readOnlyHint: true` is worse than omitting the hint — clients trust it and skip the confirmation a destructive call deserves.
- Treating MCP as a replacement for documentation. It complements it; it does not replace it.
- Assuming a session exists. Anything the old handshake let you stash for the duration of a connection — negotiated version, client identity, per-session state — now has to arrive on each request or be derived from it.
- Dropping legacy support the day you adopt the new revision. Older clients cannot fall forward; they just break.

## Verification

- Connect your server with the MCP Inspector or a reference client and confirm tools list, call, and return as expected.
- Call `server/discover` and check it reports the versions you actually serve. A version you list here is one a client may send on its next request.
- Send a request whose `MCP-Protocol-Version` header disagrees with the body, and one for a version you do not implement. The first must be rejected as a header mismatch, the second with the list of versions you do support.
- If you serve both eras, run an old client through `initialize` after every change. It is the path that breaks silently, because nothing in your own tooling exercises it.
- Review the OAuth flow end to end.
- Watch logs after a public launch for unexpected call patterns.
