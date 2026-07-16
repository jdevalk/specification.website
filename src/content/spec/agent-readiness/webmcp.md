---
title: "WebMCP — browser-native tools for agents"
slug: webmcp
category: agent-readiness
summary: "WebMCP lets a page register tools that an in-browser AI agent can call directly, using a `navigator.modelContext` JavaScript API. It turns a site into an agent surface without server-side MCP plumbing."
status: optional
order: 88
appliesTo: [all]
relatedSlugs: [mcp-and-tool-discovery, agent-skills-discovery, agent-readiness-overview, structured-data-for-agents]
updated: "2026-07-16T00:00:00.000Z"
sources:
  - title: "WebMCP — W3C Web Machine Learning Community Group"
    url: "https://webmachinelearning.github.io/webmcp/"
    publisher: "W3C WebML CG"
  - title: "webmachinelearning/webmcp on GitHub"
    url: "https://github.com/webmachinelearning/webmcp"
    publisher: "W3C WebML CG"
  - title: "Model Context Protocol — Tools"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/server/tools"
    publisher: "MCP"
---

## What it is

WebMCP is an emerging browser API that lets a page register structured tools — named functions with input schemas — that an AI agent running inside the same browser (a sidebar assistant, a built-in browser agent, an extension) can invoke directly. The shape mirrors [Model Context Protocol](/spec/agent-readiness/mcp-and-tool-discovery/) tools, hence the name: it is MCP, but the transport is the JavaScript heap instead of HTTP+JSON-RPC.

The proposal is incubated in the [W3C Web Machine Learning Community Group](https://webmachinelearning.github.io/webmcp/). The current spec surface is `document.modelContext`; earlier drafts (and some shipping implementations) exposed it as `navigator.modelContext` and a portable script feature-detects both. A page registers a tool by calling `registerTool({ name, description, inputSchema, annotations, execute })`. The browser exposes registered tools to the local agent; the agent calls `execute()` and gets a result back, all without leaving the tab.

```js
const mc =
  (typeof document !== 'undefined' && document.modelContext) ||
  (typeof navigator !== 'undefined' && navigator.modelContext);

mc?.registerTool({
  name: 'search_docs',
  description: 'Search the documentation for a query.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  annotations: { readOnlyHint: true },
  async execute({ query }) {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return { content: [{ type: 'text', text: await res.text() }] };
  },
});
```

**This site ships it.** Every page on `specification.website` loads [`/webmcp.js`](/webmcp.js), which registers `search_spec`, `list_topics`, `get_topic`, `open_search`, and `open_checklist` tools — generated at build time from the same content collection that powers the rest of the site. An in-browser agent can search and read the spec without going through the remote [MCP server](/spec/agent-readiness/mcp-and-tool-discovery/).

## Why it matters

- **Same vocabulary as server-side MCP.** A team that already builds MCP tools on the server can expose the same shapes in the browser without re-modelling.
- **Sees the logged-in user.** A browser-side tool runs inside the user's authenticated session, including cookies, IndexedDB, and any per-tab state. A server MCP server has none of that without explicit auth plumbing.
- **No new transport.** Nothing to host, nothing to scale, no auth headers to wire up. The browser is the transport.
- **Composes with MCP.** A site can ship both: an HTTP MCP server for headless agents and a WebMCP surface for in-browser agents. Same tool names, same schemas, same intent.

The API is early — implementations are shipping behind flags and via polyfill. Treat WebMCP as `optional` until at least one major browser exposes it without a flag. The cost of being early is low; the design follows MCP closely so most code will port forward.

## How to implement

- **Register tools at page load**, after `navigator.modelContext` is feature-detected. If the API is absent, do nothing — never throw.
- **Mirror your server-side MCP tools.** If you already publish `search_docs` on an HTTP MCP server, register a tool with the same name, description, and input schema in the browser. An agent that knows the server-side tool will recognise the browser one immediately.
- **Use the `annotations` field** to declare safety properties: `readOnlyHint: true` for tools that do not mutate state, `destructiveHint: true` for ones that do. The agent uses these to decide whether to confirm with the user.
- **Pick `mode: 'summarize'`** when the tool returns a single result rather than streaming. Streaming is supported but adds complexity that most page tools do not need.
- **Keep `execute()` small.** A tool is a thin call into existing site functionality (search, navigation, account actions), not a bespoke pipeline.
- **Document the tools.** Add them to your [agent skills index](/spec/agent-readiness/agent-skills-discovery/) so agents that read the site's discovery surfaces — not just ones already in the browser — know they exist.

## Common mistakes

- Registering tools that bypass the site's own access controls. A WebMCP tool runs as the logged-in user; treat it like any other JavaScript-callable action and apply the same authorisation checks server-side.
- Forgetting feature detection. `navigator.modelContext` does not exist in most browsers yet. Guard every call.
- Designing tools that only make sense in the browser. If a server-side MCP server can do the same job, ship both — agents should be able to use whichever transport they have.
- Treating annotations as cosmetic. `readOnlyHint` and `destructiveHint` change agent behaviour; declare them honestly.

## Verification

- `typeof navigator.modelContext?.registerTool === 'function'` in a console on a supporting browser.
- The browser's agent UI lists your registered tools by name and description.
- Calling a registered tool from a test agent returns a well-formed MCP-shaped result (`{ content: [...] }`).
- If you ship a parallel HTTP MCP server, the tool names match across both surfaces.
