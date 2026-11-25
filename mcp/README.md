# specification.website — MCP server

A Cloudflare Worker exposing [The Website Specification](https://specification.website) as an [MCP](https://modelcontextprotocol.io/) server. Public read-only reference tools, plus an optional public GitHub feedback writer.

**Live endpoint:** <https://mcp.specification.website/mcp>
**Server card:** <https://specification.website/.well-known/mcp/server-card.json>
**Spec page:** [/spec/agent-readiness/mcp-and-tool-discovery/](https://specification.website/spec/agent-readiness/mcp-and-tool-discovery/)

## Tools

| Tool | Purpose |
|---|---|
| `report_feedback(...)` | Create a public GitHub issue with reproduction steps and a proposed fix. |
| `search(query, limit?)` | Full-text search across all 96 spec pages, ranked, with body excerpts. |
| `list_topics({ category?, status?, limit? })` | Filtered list of spec items. |
| `get_topic({ slug })` | Full canonical Markdown for one spec page (frontmatter + body). |
| `get_checklist({ category?, status? })` | Audit-style flat checklist grouped by category. |
| `get_categories()` | The ten categories with topic counts. |

## MCP feedback

`report_feedback` submits issues to `jdevalk/specification.website`. Reports contain
the affected tool, problem, reproduction steps, expected and actual behaviour,
and an explicitly unverified proposed fix. The response includes the issue URL.
The tool declares write access and non-idempotent behaviour: clients must not
automatically retry an uncertain submission, because that can create duplicates.
Reports are public. Remove credentials, personal data, private URLs and chat
history before submitting. Feedback arguments are excluded from MCP analytics.

To enable submission, create a dedicated fine-grained GitHub token restricted to
this repository with **Issues: read and write**, then store it as a Worker secret:

```bash
cd mcp
npx wrangler secret put FEEDBACK_GITHUB_TOKEN
npm run deploy
```

Do not reuse a developer's broad GitHub token. The `FEEDBACK_RATE_LIMITER` binding
in `wrangler.toml` allows approximately three submissions per minute per
Cloudflare location, shared across callers without collecting their IP addresses.
It is abuse mitigation, not a strict worldwide quota. Missing credentials or a
missing/failing limiter prevent submission. GitHub errors are returned without
exposing credentials or upstream diagnostic bodies.

Reports receive the `mcp-feedback` label. Joost applies `mcp-approved` after
reviewing the report to authorise an implementation PR. An hourly Codex automation
checks that approval, implements the scoped change in an isolated worktree, runs
tests and opens a draft PR. It never merges or deploys fixes. The routine is
defined in `ops/routines/mcp-feedback-to-pr.md`; it ignores reports changed after
approval and never treats issue text as instructions or permission.

The production token expires on **23 February 2027**. Rotate the Worker secret
before that date; the token has Issues read/write and required Metadata read
access only on this repository.

## Prompts

| Prompt | Purpose |
|---|---|
| `audit_url(url, focus?)` | Builds an audit plan for a target URL against the required (or category-focused) items. |

## Architecture

- Cloudflare Worker, Streamable HTTP transport (MCP 2025-03-26).
- Stateless. No sessions, no SSE, no auth.
- The spec content is bundled at build time via `scripts/build-data.mjs`, which reads every Markdown file in `../src/content/spec/` and writes a single `src/data.json`. The Worker imports it via JSON module assertion — zero runtime parsing.

## Local development

```bash
cd mcp
npm install
npm run dev    # wrangler dev on http://localhost:31338
```

Try it:

```bash
curl -sX POST http://localhost:31338/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/list' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}' \
  | jq
```

## Tests

```bash
cd mcp
npm test          # scripts/test-protocol.mjs
npm run typecheck
```

`scripts/test-protocol.mjs` drives the Worker's real fetch handler in-process
and asserts the two-era wire contract: the members revision 2026-07-28 requires
on every result, the cache hints only where that revision defines them, the
methods it removed, the transport rules, and that the handshake era keeps
answering. Same idiom as `scripts/test-websub.mjs` at the repo root — plain
node + `node:assert`, no framework, no dependency, no network.

Needs **Node >= 22.15**, above the root's declared `>= 22.12`: the sources are
TypeScript and `ts-resolve-hook.mjs` uses `node:module`'s `registerHooks`, added
in 22.15. Below that the run fails at link time naming the missing export.

`pretest` runs `build:data`, so a fresh clone needs nothing else. `typecheck`
has no such hook — run `npm run build:data` first, or `tsc` cannot resolve the
generated `src/data.json`.

## Deploy

First time:

```bash
npx wrangler login                                # one-time
cd mcp
npm install
npm run deploy
```

`wrangler.toml` is configured to register the custom domain `mcp.specification.website` on first deploy. The parent zone `specification.website` must already be on Cloudflare.

## Connecting an MCP client

Claude Desktop and any MCP-aware client:

```json
{
  "mcpServers": {
    "specification-website": {
      "transport": "http",
      "url": "https://mcp.specification.website/mcp"
    }
  }
}
```

## Updating the spec content

The Worker bundles content at build time. Whenever the spec content under `../src/content/spec/` changes, redeploy:

```bash
cd mcp
npm run deploy    # predeploy regenerates src/data.json automatically
```

No drift between site and MCP server: both read from the same Markdown source of truth.

## Licence

MIT (code) / CC BY 4.0 (the spec content the Worker serves).
