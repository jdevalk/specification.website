---
title: "WebMCP — browser-native tools for agents"
slug: webmcp
category: agent-readiness
summary: "WebMCP lets a page register tools that an in-browser AI agent can call directly, using the `document.modelContext` JavaScript API. It turns a site into an agent surface without server-side MCP plumbing."
status: optional
order: 88
appliesTo: [all]
relatedSlugs: [mcp-and-tool-discovery, agent-skills-discovery, agent-readiness-overview, structured-data-for-agents]
updated: "2026-10-16T00:00:00.000Z"
sources:
  - title: "WebMCP — W3C Web Machine Learning Community Group"
    url: "https://webmachinelearning.github.io/webmcp/"
    publisher: "W3C WebML CG"
  - title: "webmachinelearning/webmcp on GitHub"
    url: "https://github.com/webmachinelearning/webmcp"
    publisher: "W3C WebML CG"
  - title: "webmcp-types — TypeScript type definitions for WebMCP"
    url: "https://github.com/webmachinelearning/webmcp-types"
    publisher: "W3C WebML CG"
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
  title: 'Search the docs',
  description: 'Search the documentation for a query.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  annotations: { readOnlyHint: true },
  async execute({ query }, { signal }) {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
    return res.text();
  },
});
```

**This site ships it.** [`/webmcp.js`](/webmcp.js) registers `search_spec`, `list_topics`, `get_topic`, `open_search`, and `open_checklist` — generated at build time from the same content collection that powers the rest of the site. An in-browser agent can search and read the spec without going through the remote [MCP server](/spec/agent-readiness/mcp-and-tool-discovery/). A visitor whose browser has no WebMCP implementation downloads none of it: a small inline guard checks for `modelContext` and only then injects the script.

## Why it matters

- **Same vocabulary as server-side MCP.** A team that already builds MCP tools on the server can expose the same shapes in the browser without re-modelling.
- **Sees the logged-in user.** A browser-side tool runs inside the user's authenticated session, including cookies, IndexedDB, and any per-tab state. A server MCP server has none of that without explicit auth plumbing.
- **No new transport.** Nothing to host, nothing to scale, no auth headers to wire up. The browser is the transport.
- **Composes with MCP.** A site can ship both: an HTTP MCP server for headless agents and a WebMCP surface for in-browser agents. Same tool names, same schemas, same intent.

The API is early — implementations are shipping behind flags and via polyfill. Treat WebMCP as `optional` until at least one major browser exposes it without a flag. The cost of being early is low; the design follows MCP closely so most code will port forward.

## How to implement

- **Feature-detect before you download, not just before you register.** The obvious shape — ship the tool bundle on every page, check `modelContext` at the top, return early when it is missing — puts the check inside the thing it is meant to guard. Every visitor pays for a script that today almost none of them can use. Put the detection in a few inline bytes and inject the bundle only when the API is present. If it is absent, do nothing — never throw.
- **Keep the payload small; fetch the corpus on demand.** Tool definitions are tiny, the data they search usually is not. Register the tools with complete input schemas up front — an agent needs those to decide what to call — then fetch the data on the first call that actually needs it. The agent is already awaiting a tool result, so the extra round trip costs nothing anyone perceives.
- **Mirror your server-side MCP tools.** If you already publish `search_docs` on an HTTP MCP server, register a tool with the same name, description, and input schema in the browser. An agent that knows the server-side tool will recognise the browser one immediately.
- **Use the `annotations` field** to declare safety properties. The WebMCP surface defines `readOnlyHint` (the tool only reads data), `consequentialHint` (executing it commits a significant, real-world, or non-reversible action — bookings, payments, deletions), and `untrustedContentHint` (the output includes user- or third-party-authored text, which the agent must treat as untrusted). Newer implementations also expose `debugging` for developer-tooling-only tools. All hints default to `false`: declare a hint only when it is `true`, never declare `: false`. The agent uses these to decide whether to confirm with the user and how to sandbox the output.
- **Keep `execute()` small and its errors structured.** A tool is a thin call into existing site functionality (search, navigation, account actions), not a bespoke pipeline. On failure, resolve a structured payload (`{ error, code, retryable }`) rather than rejecting: an unhandled rejection surfaces to the agent as a generic `UnknownError` with the reason discarded. Never report a failure as a success string.
- **Document the tools.** Add them to your [agent skills index](/spec/agent-readiness/agent-skills-discovery/) so agents that read the site's discovery surfaces — not just ones already in the browser — know they exist.

## Common mistakes

- Registering tools that bypass the site's own access controls. A WebMCP tool runs as the logged-in user; treat it like any other JavaScript-callable action and apply the same authorisation checks server-side.
- Feature-detecting inside the bundle rather than before it. The early return is correct but it runs too late — the bytes are already on the wire and parsed. Guard the load, then guard the call.
- Designing tools that only make sense in the browser. If a server-side MCP server can do the same job, ship both — agents should be able to use whichever transport they have.
- Treating annotations as cosmetic. `readOnlyHint` and `consequentialHint` change agent behaviour; declare them honestly, and never declare a hint as `: false` — omission already means `false`.

## Verification

- `typeof navigator.modelContext?.registerTool === 'function'` in a console on a supporting browser.
- On a browser *without* the API, the network panel shows no request for the tool bundle at all — not a request whose script returns early.
- The browser's agent UI lists your registered tools by name and description.
- Calling a registered tool from a test agent returns a JSON-serialisable result. The tool's `execute()` can resolve a string, object, array, or another JSON-serialisable value; `document.modelContext.executeTool()` returns that value serialised as JSON. An MCP-shaped `{ content: [...] }` envelope is not required.
- If you ship a parallel HTTP MCP server, the tool names match across both surfaces.
