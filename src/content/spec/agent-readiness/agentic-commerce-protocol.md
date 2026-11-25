---
title: "Agentic Commerce Protocol discovery (/.well-known/acp.json)"
slug: agentic-commerce-protocol
category: agent-readiness
summary: "An ACP seller publishes its API base URL, protocol versions and commerce capabilities at `/.well-known/acp.json`. Discovery has a released schema and live implementations, although its RFC still says Proposal and the URI is not IANA-registered."
status: optional
order: 83
appliesTo: [all]
relatedSlugs: [universal-commerce-protocol, mcp-and-tool-discovery, structured-data-for-agents, well-known-overview, cache-control, agent-readiness-overview]
updated: "2026-11-25T00:00:00.000Z"
sources:
  - title: "ACP — Discovery RFC"
    url: "https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.discovery.md"
    publisher: "Agentic Commerce Protocol"
  - title: "ACP — 2026-04-17 release"
    url: "https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/changelog/2026-04-17.md"
    publisher: "Agentic Commerce Protocol"
  - title: "ACP — 2026-04-17 checkout and discovery JSON Schema"
    url: "https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/spec/2026-04-17/json-schema/schema.agentic_checkout.json"
    publisher: "Agentic Commerce Protocol"
  - title: "IANA — Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
---

## What it is

Agentic Commerce Protocol (ACP) discovery is a public JSON document at `/.well-known/acp.json`. An agent that knows a seller's domain can read it to find the ACP API base URL, supported versions, transports and services before creating a checkout session.

The document describes the commerce API, not the products for sale. It does not submit a catalogue to an assistant, authorise purchases or replace the capability negotiation inside a checkout session. Product discovery still needs [structured data](/spec/agent-readiness/structured-data-for-agents/) or merchant feeds; payment methods and transaction-specific capabilities are negotiated with the checkout API.

**Released, implemented, but not fully settled.** As checked on 25 November 2026, the discovery RFC still labels itself "Proposal" and "unreleased", while the `2026-04-17` release includes discovery and its `DiscoveryResponse` schema. [SumUp's Go SDK](https://github.com/sumup/acp) provides an `acpdiscovery` package. [Market History](https://getmarkethistory.com/docs/agent-checkout/) documents an implementation, and its [live discovery URL](https://getmarkethistory.com/.well-known/acp.json) returned `200 application/json` with version `2026-04-17` when checked. These establish implementation, not widespread adoption or proof that a purchase succeeds.

The `acp.json` name is absent from the IANA registry as of that date. It is a deployed protocol convention with a namespace allocation risk, not a registered [well-known URI](/spec/well-known/well-known-overview/). Use it deliberately when integrating ACP; its existence is not a reason to invent other unregistered names.

[UCP](/spec/agent-readiness/universal-commerce-protocol/) has a separate document at `/.well-known/ucp` and a different schema. Serving either document does not implement the other protocol. A seller can support both when its integrations require them.

This site does not publish an ACP discovery document: we sell nothing and have no checkout API.

## Why it matters

Discovery lets agents check compatibility without opening an authenticated checkout session simply to learn where the API is or which services it supports. Because the document describes stable capabilities, it can be cached across sessions.

The status is `optional`: this applies to sellers implementing ACP for compatible agents, not to every website or every shop. Existing ACP integrations can also obtain the API URL out of band; a missing discovery document alone does not prove that a seller has no ACP checkout integration.

## How to implement

First check whether your commerce platform already serves discovery. ACP allows direct seller hosting and platform hosting. A platform document describes capabilities shared across its sellers; it must not accept or expose merchant identifiers to enumerate them.

Serve the document over HTTPS at the origin's exact `/.well-known/acp.json` path, with HTTP `200` and `Content-Type: application/json`. It must be accessible without a bearer token. The discovery RFC recommends `Cache-Control: public, max-age=3600` or longer; see [Cache-Control](/spec/performance/cache-control/).

For an implementation supporting the `2026-04-17` release, a minimal document is:

```json
{
  "protocol": {
    "name": "acp",
    "version": "2026-04-17",
    "supported_versions": ["2026-04-17"]
  },
  "api_base_url": "https://shop.example/acp",
  "transports": ["rest"],
  "capabilities": {
    "services": ["checkout"]
  }
}
```

Use your actual API URL and implemented versions. List `supported_versions` oldest first and set `version` to the latest version you support. Clients append paths such as `/checkout_sessions` to `api_base_url`.

Include `rest` in `transports`; advertise `mcp` only when you implement ACP's [MCP transport binding](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/mcp-binding.md). The transport name alone does not supply an MCP endpoint URL. Advertise only working services and extensions, using the values allowed by your selected release's schema.

Keep payment handler details, credentials, buyer information and session-specific values out of discovery. The public document does not remove authentication from the transaction endpoints: agents must still use the checkout API's authentication and inline capability exchange.

## Common mistakes

- **Copying a UCP profile into `acp.json`.** The two protocols have different fields and negotiation rules. Validate each document against its own schema.
- **Treating a sample hostname as deployment evidence.** URLs in the RFC are illustrative; verify a real implementation before claiming adoption.
- **Assuming the RFC label tells the whole release story.** Check the versioned schema and changelog together, and pin the version your API implements.
- **Claiming registration because the path starts with `/.well-known/`.** Deployment and IANA registration are separate facts.
- **Publishing a manifest without a working API.** A JSON response proves discovery is reachable, not that checkout or payment works.

## Verification

- Fetch `https://your-store.example/.well-known/acp.json` without credentials. Check the GET response body, status, media type and caching headers; an HTML fallback with status `200` is not discovery.
- Validate against `#/$defs/DiscoveryResponse` in the checkout JSON Schema for your advertised release. Validating only against the bundle root does not select the discovery definition.
- Confirm every advertised version, transport and service matches the deployed API. Inspect the public document for credentials, personal data and merchant-specific platform information.
- In a test environment, use a compatible agent to discover the API and exercise checkout, including authentication and session-level capability negotiation. Keep this separate from the read-only discovery check.
