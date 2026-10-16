---
title: "WebMCP page: corrected annotations for the current spec"
date: "2026-10-16"
type: changed
relatedSlugs: [webmcp]
---

The [WebMCP page](/spec/agent-readiness/webmcp/) now names `consequentialHint` instead of the unsupported `destructiveHint` and removes the unsupported `mode: 'summarize'` option. Its verification guidance explains that tools can resolve any JSON-serialisable value and do not require an MCP-shaped `{ content: [...] }` envelope. The annotations guidance covers the full current set (`readOnlyHint`, `consequentialHint`, `untrustedContentHint`, plus `debugging` on newer implementations), the opt-in-only rule, and structured error payloads, with sources now citing the [`webmcp-types`](https://github.com/webmachinelearning/webmcp-types) definitions.
