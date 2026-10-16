---
title: "WebMCP page: corrected annotations for the current spec"
date: "2026-10-16"
type: changed
relatedSlugs: [webmcp]
---

The [WebMCP page](/spec/agent-readiness/webmcp/) named `destructiveHint`, which does not exist in the WebMCP annotation set — the annotation is `consequentialHint`. It also recommended `mode: 'summarize'`, which is not part of the spec, and its verification step described an MCP-shaped `{ content: [...] }` result, while WebMCP tools resolve plain strings. The annotations guidance now covers the full current set (`readOnlyHint`, `consequentialHint`, `untrustedContentHint`, plus `debugging` on newer implementations), the opt-in-only rule, and structured error payloads. The page's sources now cite the [`webmcp-types`](https://github.com/webmachinelearning/webmcp-types) definitions.
