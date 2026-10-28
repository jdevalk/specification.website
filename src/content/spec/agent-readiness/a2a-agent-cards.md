---
title: "A2A agent cards"
slug: a2a-agent-cards
category: agent-readiness
summary: "The Agent-to-Agent (A2A) protocol lets an autonomous agent find another autonomous agent and call it over JSON-RPC. Discovery hinges on a single well-known file: `/.well-known/agent-card.json`. Relevant whenever your service exposes agentic behaviour another agent might want to delegate to."
status: optional
order: 82
appliesTo: [all]
relatedSlugs: [agent-readiness-overview, mcp-and-tool-discovery, agent-skills-discovery, machine-readable-formats, link-headers, api-catalog, dns-aid, agentic-resource-discovery, universal-commerce-protocol]
updated: "2026-10-15T00:00:00.000Z"
sources:
  - title: "A2A Protocol — Specification"
    url: "https://a2a-protocol.org/latest/specification/"
    publisher: "A2A Project (Linux Foundation)"
  - title: "A2A Protocol — Agent Discovery"
    url: "https://a2a-protocol.org/latest/topics/agent-discovery/"
    publisher: "A2A Project (Linux Foundation)"
  - title: "A2A Protocol — What's new in v1.0"
    url: "https://a2a-protocol.org/latest/whats-new-v1/"
    publisher: "A2A Project (Linux Foundation)"
  - title: "RFC 8615 — Well-Known URIs"
    url: "https://www.rfc-editor.org/rfc/rfc8615"
    publisher: "IETF"
---

## What it is

The Agent-to-Agent (A2A) protocol is an open standard for one autonomous agent to discover and call another. It was originally proposed by Google in 2025 and donated to the Linux Foundation later that year. It complements the [Model Context Protocol](/spec/agent-readiness/mcp-and-tool-discovery/): MCP exposes tools an LLM can call; A2A exposes a whole agent another agent can delegate to.

Discovery is deliberately small. An A2A-speaking service hosts a JSON manifest at the well-known URI `/.well-known/agent-card.json`. The manifest is the **agent card** — a self-describing document that names the agent, lists its skills, declares its capabilities, and points at one or more transport endpoints that speak the A2A wire protocol (JSON-RPC, gRPC, or HTTP+JSON).

The minimum field set is small and stable. Required fields per the spec are `name`, `description`, `version`, `supportedInterfaces` (each with `url`, `protocolBinding`, `protocolVersion`), `capabilities`, `defaultInputModes`, `defaultOutputModes`, and `skills` (each with `id`, `name`, `description`, `tags`). Optional fields cover provider, documentation URL, security schemes, JWS signatures, and an icon URL.

The card's `version` is the version of _your agent_, not of the protocol. Since 1.0 the protocol version lives on each entry in `supportedInterfaces`, because one card can now offer several interfaces speaking different protocol versions. There is no top-level `protocolVersion` any more, and a card that still carries one is following a 0.3-era example.

This site ships such a card as a worked example. The static manifest is at [`/.well-known/agent-card.json`](/.well-known/agent-card.json); the JSON-RPC endpoint is at [`mcp.specification.website/a2a/v1`](https://mcp.specification.website/a2a/v1). It is intentionally minimal — one send-message method, no streaming, no task lifecycle — and it wraps the same search and topic-fetch logic the MCP server already exposes. It is not yet fully in line with 1.0: the endpoint answers the pre-1.0 method name `message/send` rather than `SendMessage`, and the card still carries a top-level `protocolVersion` next to the per-interface one.

## Why it matters

- An agent card is the standard way for a calling agent to learn what you do, before any call is made. Without it, the calling agent has to be hard-coded against your service or guess from a UI.
- A2A is transport-agnostic: a single card can advertise JSON-RPC, gRPC, and HTTP+JSON endpoints in priority order. Clients pick the binding they support.
- It composes cleanly with MCP. An MCP server gives an LLM tools; an A2A card lets that whole LLM-plus-tools agent be reached by *other* agents. The two protocols are not alternatives.
- The card is a contract. Treat changes to `skills[].id`, `supportedInterfaces[].url`, or `capabilities` as breaking, and bump `version` accordingly.

Adoption is early but accelerating. The protocol reached version 1.0 in March 2026. Treat A2A as `optional` for now — useful if your product is itself an agent or wraps one, overkill if it is a static brochure.

## How to implement

- **Build the card.** Author a JSON document with `name`, `description`, `version`, `provider`, `supportedInterfaces` (each declaring its own `url`, `protocolBinding` and `protocolVersion`), `capabilities`, `defaultInputModes`, `defaultOutputModes`, and `skills`. Use the [A2A specification](https://a2a-protocol.org/latest/specification/) as the field reference. Use camelCase keys throughout.
- **Pick a transport.** JSON-RPC over HTTPS is the lowest-friction option and is what we ship here. gRPC is appropriate when you already speak gRPC; HTTP+JSON when you have an existing REST surface to wrap.
- **Serve it at the canonical URI.** Per [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615), publish at `/.well-known/agent-card.json` with `Content-Type: application/json` and a sensible `Cache-Control` (an hour is fine; ETag is better).
- **Advertise it.** Add a `Link: </.well-known/agent-card.json>; rel="service-desc"; type="application/json"` response header so clients can discover the card without guessing the path. Add the same link to your [`/.well-known/api-catalog`](/spec/well-known/api-catalog/) Linkset entry. See [HTTP Link headers](/spec/agent-readiness/link-headers/).
- **Ship the endpoint behind it.** Do not publish a card that points at a non-existent URL. The first call most validators make is to the endpoint; a 404 there is worse than no card at all. At minimum, implement the `SendMessage` JSON-RPC method and return method-not-found for the rest.
- **Migrate the whole wire format.** Version 1.0 renamed JSON-RPC methods: `message/send` became `SendMessage`, `message/stream` became `SendStreamingMessage`, and `tasks/get` became `GetTask`. It also changed payloads: message roles use `ROLE_USER` and `ROLE_AGENT`, and parts are identified by their fields instead of a `kind` discriminator. Follow the [1.0 migration guide](https://a2a-protocol.org/latest/whats-new-v1/) for the request, response and agent-card changes. Method aliases alone do not preserve 0.3 compatibility. If you retain 0.3 clients, serve discovery cards and wire formats those clients understand, using a separate endpoint or a version-aware compatibility layer that parses and emits the appropriate format; advertise only versions each interface actually implements.
- **Be honest about capabilities.** If you do not support streaming, set `capabilities.streaming` to `false`. The same goes for `pushNotifications` and `extendedAgentCard`. Lying here breaks clients that probe before they call.
- **Sign the card if you care about provenance.** A2A allows JWS signatures (`signatures[]`); useful in curated registries, optional for direct discovery.

## Common mistakes

- Publishing a card that points at a URL that 404s. Discovery validators check the URI; runtime agents check the endpoint. Both matter.
- Mixing up `agent-card.json` with `agent.json`. The canonical filename is `agent-card.json` — pick it, do not invent a redirect.
- Claiming capabilities you do not implement. Setting `streaming: true` without a working `SendStreamingMessage` method is a contract violation, not a polite overstatement.
- Declaring `protocolVersion` `1.0` while answering 0.3 method names. Many early examples and tutorials predate 1.0, so code copied from them answers `message/send`; a strict 1.0 client sends `SendMessage` and gets method-not-found.
- Treating the card as static when the agent evolves. Every change to skills or transports needs a `version` bump.
- Forgetting the `Content-Type`. A card served as `text/plain` will be rejected by stricter clients. Serve it as `application/json`.

## Verification

- `curl https://your-site.example/.well-known/agent-card.json` returns 200 with `Content-Type: application/json` and parses as JSON.
- The JSON validates against the A2A schema for each interface's `protocolVersion`. Required fields are present; `supportedInterfaces[0].url` resolves; `skills` are non-empty.
- `curl -X POST` against `supportedInterfaces[0].url` with a minimal JSON-RPC body using the method name for that interface's version (`SendMessage` for 1.0) returns a JSON-RPC response (not an HTML error page).
- The card appears in your `/.well-known/api-catalog` Linkset and in the `Link` response header on `/`.
- A live test: connect the agent from a second A2A-speaking client and confirm at least one skill round-trips end-to-end.
