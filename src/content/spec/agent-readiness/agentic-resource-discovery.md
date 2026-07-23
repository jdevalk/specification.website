---
title: "Agentic Resource Discovery (ARD)"
slug: agentic-resource-discovery
category: agent-readiness
summary: "Publish an AI Catalog at /.well-known/ai-catalog.json listing the agent capabilities your domain offers — MCP servers, A2A agents — so registries and agents can find and trust them from one fetch."
status: optional
order: 86
appliesTo: [all]
relatedSlugs: [dns-aid, mcp-and-tool-discovery, a2a-agent-cards, agent-skills-discovery, okf-bundle, link-headers, well-known-overview]
updated: "2026-07-23T00:00:00.000Z"
sources:
  - title: "Agentic Resource Discovery (ARD) specification"
    url: "https://agenticresourcediscovery.org/"
    publisher: "ARD Project (Linux Foundation)"
  - title: "AI Catalog standard"
    url: "https://github.com/Agent-Card/ai-catalog"
    publisher: "AI Catalog Working Group, Linux Foundation"
  - title: "RFC 8141 — Uniform Resource Names (URNs)"
    url: "https://www.rfc-editor.org/rfc/rfc8141"
    publisher: "IETF"
  - title: "Announcing the Agentic Resource Discovery specification"
    url: "https://developers.googleblog.com/announcing-the-agentic-resource-discovery-specification/"
    publisher: "Google"
---

## What it is

Agentic Resource Discovery (ARD) is a draft discovery layer — not a runtime — that lets a domain advertise which agent capabilities it offers and how to verify them. It answers three questions for an agent: where the right capability lives, which one to use, and whether it is safe to connect. It builds on the **AI Catalog** standard, both developed under a Linux Foundation working group and published Apache 2.0.

The core is a manifest at `/.well-known/ai-catalog.json`. Each `entries[]` item has a URN `identifier`, a `displayName`, a media type, and either an inline `data` object or a `url` pointing at the real artefact. The media types tie ARD to the rest of the agent-readiness graph:

| Media type | Points at |
|---|---|
| `application/mcp-server-card+json` | An [MCP server card](/spec/agent-readiness/mcp-and-tool-discovery/) |
| `application/a2a-agent-card+json` | An [A2A agent card](/spec/agent-readiness/a2a-agent-cards/) |
| `application/agentskill+zip` | An [Agent Skill](/spec/agent-readiness/agent-skills-discovery/) |
| `application/ai-catalog+json` | A nested catalog |

**Two specs, two field names.** The base [ai-catalog](https://github.com/Agent-Card/ai-catalog) spec names the media-type field `mediaType`; the ARD layer that builds on it names it `type` and adds an optional `representativeQueries` array (2–5 natural-language prompts) so a registry can match an entry to a user's intent. The two diverged, so the safe move is to emit **both** field names with the same value plus `representativeQueries` — that validates under either spec, since both require consumers to preserve unknown keys.

Beyond the well-known file itself, three mechanisms point agents at it: a `<link rel="ai-catalog">` (also emittable as an HTTP `Link` header); an `Agentmap:` directive in `robots.txt`; and DNS service-binding records `_catalog._agents.<domain>` and `_search._agents.<domain>` — the same `_agents` namespace as [DNS-AID](/spec/agent-readiness/dns-aid/).

## Why it matters

- **One fetch, typed answer.** Instead of guessing at well-known paths one by one, an agent reads a single manifest that names every capability and its media type.
- **Domain-anchored trust, if you can anchor it.** An optional `trustManifest` (SPIFFE ID, DID, or HTTPS identity, plus attestations and an optional JWS signature) lets a client verify the publisher cryptographically. The signature is a detached JWS over the JCS-canonicalised ([RFC 8785](https://www.rfc-editor.org/rfc/rfc8785)) trust manifest with the `signature` field removed; for an HTTPS identity, the verifier fetches the JWK Set at the identity URL and selects the key by the JWS `kid`. Read the next section before reaching for it — an HTTPS identity on your own origin is weaker than it looks.
- **Registry-friendly.** Registries crawl published catalogs and make them searchable, so a capability listed once becomes discoverable across the agentic web.

## How to implement

Publish `/.well-known/ai-catalog.json` with a `specVersion`, a `host` block, and one entry per capability you actually run. Reference your existing MCP and A2A cards by `url` rather than duplicating them. Advertise the manifest with a `link rel`, the `robots.txt` `Agentmap:` directive, and, if you publish DNS, the `_catalog._agents` record. Don't list endpoints you don't offer.

### Sign it only if the key lives somewhere the catalogue doesn't

The obvious way to use `trustManifest` is an HTTPS identity pointing at a JWK Set on your own origin. Think about what that buys. An attacker who can rewrite `/.well-known/ai-catalog.json` can rewrite `/.well-known/jwks.json` in the same breath, substitute their own key, and produce a manifest that verifies perfectly. The signature is defeated by exactly the compromise it exists to detect, because the document and the key that vouches for it share a fate.

A signature is only worth its weight when the verifying key is resolvable **independently of the signed document** — a DNSSEC-signed record, a key pinned by the verifier out of band, or a JWK Set on infrastructure an origin compromise would not reach. Absent one of those, an unsigned catalogue served over HTTPS makes the same guarantee with none of the machinery: TLS already proves the bytes came from the domain.

Note also that the signature covers the trust manifest **only, not `entries`**. That is convenient — entries change without re-signing — but it means the fields worth attacking are the unsigned ones. Rewriting an entry's `url` to point an agent at a hostile MCP endpoint leaves a valid signature intact.

**This site publishes the catalogue unsigned, deliberately.** [`/.well-known/ai-catalog.json`](/.well-known/ai-catalog.json) catalogues our MCP server, A2A agent, [Agent Skill](/spec/agent-readiness/agent-skills-discovery/), and [OKF bundle](/spec/agent-readiness/okf-bundle/), advertised through the `Link` header, a `link rel`, `robots.txt`, and a `_catalog._agents` DNS record; each entry carries both `mediaType` and `type` plus `representativeQueries`. We previously shipped a detached ES256 JWS with the JWK Set on this origin, and removed it: it protected three static fields, left every entry unsigned, and folded to any compromise that could reach the catalogue. Publishing it and explaining why is more use to you than a signature that verifies and proves nothing.

## Common mistakes

- Inventing fields. The entry schema is small — `identifier`, `displayName`, the media-type field (`mediaType` and/or `type`), and exactly one of `url` or `data`.
- A URN publisher segment that doesn't match the `trustManifest` identity domain — verification then fails.
- Signing the manifest with a key served from the same origin as the manifest, and treating the result as tamper-evidence. It is not: whoever can change one can change the other.
- Listing aspirational capabilities. The catalogue is a contract; only list what resolves.

## Verification

- `curl -s https://example.com/.well-known/ai-catalog.json | jq .` returns valid JSON with `specVersion` and `entries`.
- Each entry `url` resolves to a document of the declared `mediaType`.
- The `Agentmap:` line is present in `robots.txt` and the `ai-catalog` `Link` rel is on the homepage response.
- If a `trustManifest.signature` is present, it verifies: fetch the JWK Set at the `identity` URL, JCS-canonicalise the manifest minus `signature`, and check the detached JWS against the key named by its `kid`. Then check the harder question — whether the `identity` URL is reachable by anyone who could alter the catalogue itself. If it is, the verification is circular.
