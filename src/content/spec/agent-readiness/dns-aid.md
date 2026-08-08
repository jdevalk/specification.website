---
title: "DNS for AI Discovery (DNS-AID)"
slug: dns-aid
category: agent-readiness
summary: "Publish SVCB/HTTPS records under _agents.example.com so agents can discover your services from DNS, before any HTTP round-trip. Pair with DNSSEC so the answer is authenticated."
status: optional
order: 85
appliesTo: [all]
relatedSlugs: [link-headers, mcp-and-tool-discovery, dnssec, well-known-overview, a2a-agent-cards, agentic-resource-discovery, for-sale-dns]
updated: "2026-05-29T11:27:49.000Z"
sources:
  - title: "draft-mozleywilliams-dnsop-dnsaid — DNS for AI Discovery"
    url: "https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/"
    publisher: "IETF"
  - title: "RFC 9460 — Service Binding and Parameter Specification via the DNS (SVCB and HTTPS RRs)"
    url: "https://www.rfc-editor.org/rfc/rfc9460"
    publisher: "IETF"
  - title: "RFC 4033 — DNS Security Introduction and Requirements"
    url: "https://www.rfc-editor.org/rfc/rfc4033"
    publisher: "IETF"
  - title: "Is It Agent Ready? — DNS-AID check"
    url: "https://isitagentready.com/"
    publisher: "Is It Agent Ready?"
---

## What it is

DNS for AI Discovery (DNS-AID) is a draft IETF proposal that uses the existing [SVCB and HTTPS resource records](/spec/security/dnssec/) (RFC 9460) under a reserved `_agents` label to advertise where agents can reach your services. Instead of crawling a homepage to find a `Link` header or a `.well-known/` document, a client makes a single DNS query and gets a typed answer.

The well-known names follow the `_<service>._agents.<domain>` pattern. Two that the current draft and tooling check for:

| Name | Purpose |
|---|---|
| `_index._agents.example.com` | General entry point. Points at the canonical site. |
| `_mcp._agents.example.com`   | An [MCP](/spec/agent-readiness/mcp-and-tool-discovery/) server. |
| `_a2a._agents.example.com`   | An A2A (agent-to-agent) endpoint. |

Each record is in ServiceMode (priority ≥ 1), carrying `alpn` and `port` parameters at minimum:

```
_index._agents.example.com.  3600 IN HTTPS 1 example.com.            alpn="h3,h2" port=443
_mcp._agents.example.com.    3600 IN HTTPS 1 mcp.example.com.        alpn="h3,h2" port=443 mandatory="alpn,port"
```

## Why it matters

- **Discovery before the first HTTP request.** A DNS lookup is on the critical path for almost every connection anyway; piggybacking discovery on it is free.
- **Works for non-HTTP services too.** Any service with an ALPN identifier can be advertised this way.
- **Authenticated.** Combined with [DNSSEC](/spec/security/dnssec/), a validating resolver returns proof-of-authenticity. Without DNSSEC the record is just a hint.
- **Required by some agent-readiness validators.** [isitagentready.com](https://isitagentready.com/) explicitly checks for these records and for DNSSEC validation on the answer.

## How to implement

**Pick the services to advertise.** At minimum: `_index._agents`. If you run a public MCP server, also `_mcp._agents`. Add `_a2a._agents` when you support agent-to-agent endpoints. Don't advertise endpoints you don't actually offer.

**Use HTTPS records for HTTPS-based services and SVCB for everything else.** Both serialise the same way; HTTPS is the convenience alias for the common case.

**Required parameters:** `alpn` (the protocol the client will speak — typically `h3,h2` for browser-style HTTPS) and `port` (almost always `443`). The draft recommends including `mandatory="alpn,port"` on at least one record to signal to clients that those parameters must be understood.

**Sign the zone.** Without [DNSSEC](/spec/security/dnssec/), the discovery answer is unauthenticated and validators will downgrade or fail. Enable DNSSEC at your authoritative DNS, then ensure your registrar publishes the corresponding DS record.

**Advertise on the canonical domain, not the platform's vendor subdomain.** Records on `your-site.netlify.app` or `your-project.pages.dev` don't help agents that already know your real domain.

**Implementation, on Cloudflare specifically:** create the records as `HTTPS` type with name `_index._agents` (Cloudflare auto-appends the zone), priority `1`, target the canonical hostname, parameters as above. Enable DNSSEC under DNS settings. See `scripts/publish-dns-aid.sh` in this repo for the API call.

## Common mistakes

- Publishing in AliasMode (priority `0`) when you meant ServiceMode. Validators expect ServiceMode for the discovery use case.
- Missing `port`. Most parsers tolerate the omission and assume 443; some don't.
- Inventing custom params with unallocated names. Until the IETF assigns them, use the numeric `keyNNNNN` form rather than guessing a string identifier.
- Forgetting the trailing dot on the target hostname in zone-file syntax. Without it, the target is treated as relative.
- Enabling DNSSEC on the Cloudflare side but not pasting the DS record at an external registrar. The signature exists but the chain of trust breaks at the parent.
- Pointing `_index._agents` at a `pages.dev` / `netlify.app` / `vercel.app` host. Use your real domain.

## Verification

- `dig +short HTTPS _index._agents.example.com` returns a record beginning with `1 example.com.`.
- `dig +dnssec +cd HTTPS _index._agents.example.com` returns an `RRSIG` line — confirming DNSSEC is signing the answer.
- `dig +short DS example.com` returns at least one DS record at the registrar — confirming the chain of trust.
- [Is It Agent Ready?](https://isitagentready.com/) flips `discoverability.dnsAid` to `pass`.
- [Cloudflare DNSSEC Debugger](https://dnssec-debugger.verisignlabs.com/) or `dnssec-analyzer` shows a clean validation chain.
