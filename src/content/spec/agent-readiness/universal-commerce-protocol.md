---
title: "Universal Commerce Protocol (/.well-known/ucp)"
slug: universal-commerce-protocol
category: agent-readiness
summary: "A store that wants AI agents to check out on a shopper's behalf publishes a Universal Commerce Protocol (UCP) business profile at `/.well-known/ucp`. The profile does not list products; it says which commerce capabilities the store supports, which protocol versions it speaks, and where the transactional endpoints live."
status: optional
order: 84
appliesTo: [all]
relatedSlugs: [mcp-and-tool-discovery, a2a-agent-cards, web-bot-auth, structured-data-for-agents, well-known-overview, cache-control, agent-readiness-overview]
updated: "2026-10-28T00:00:00.000Z"
sources:
  - title: "IANA — Well-Known URIs registry (ucp)"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "Universal Commerce Protocol — Specification overview"
    url: "https://ucp.dev/latest/specification/overview/"
    publisher: "UCP"
  - title: "RFC 8615 — Well-Known Uniform Resource Identifiers (URIs)"
    url: "https://www.rfc-editor.org/rfc/rfc8615"
    publisher: "IETF"
  - title: "Google Merchant Center — Universal Commerce Protocol"
    url: "https://developers.google.com/merchant/ucp"
    publisher: "Google"
---

## What it is

The Universal Commerce Protocol (UCP) is an open protocol for agentic commerce: an AI agent, acting for a shopper, builds a cart and checks out with a business without a custom integration for each store. It is co-developed by retailers, platforms and payment companies (Google, Shopify, Etsy, Wayfair, Target and Walmart among them), and in October 2026 `/.well-known/ucp` was provisionally registered in the IANA Well-Known URIs registry.

A business advertises its support by publishing a **business profile** at `/.well-known/ucp`. The profile is a JSON object with a `ucp` member that declares:

- `version`: the protocol version, a date such as `2026-08-25`, not a semver number;
- `services`: the transports the business offers (REST, [MCP](/spec/agent-readiness/mcp-and-tool-discovery/), [A2A](/spec/agent-readiness/a2a-agent-cards/), or an embedded checkout), each with its endpoint and schema;
- `capabilities`: what the store can do, such as `dev.ucp.shopping.checkout`, plus extensions like fulfilment or discounts;
- `payment_handlers`: the payment methods the agent may use.

The platform on the other side (the agent's host) publishes its own profile and names it on each request in a `UCP-Agent` header. The business fetches it, works out the intersection of capabilities both sides support, and proceeds.

The common wrong belief is that this file makes your products visible to AI shopping assistants. It does not. The profile contains no products, prices or stock. Product discovery still depends on your [structured data](/spec/agent-readiness/structured-data-for-agents/) and merchant feeds. UCP comes later: it is the contract for _transacting_ once an agent has decided what to buy. A profile on a store whose product pages an agent cannot parse is a checkout with no way in.

This site does not ship it: we sell nothing, so there is no checkout to expose.

## Why it matters

- **Agents can transact without screen-scraping.** Without a profile, an agent buying from your store has to drive your checkout UI like a person, which breaks on every redesign and fails at CAPTCHAs and payment challenges. With one, the agent calls typed endpoints and gets typed errors.
- **The business stays in control.** The protocol keeps the business as merchant of record and lets it decide which capabilities, payment handlers and platforms to accept. The `continue_url` field hands the shopper back to your own site when an agent cannot finish.
- **It is already deployed at scale.** Shopify serves a profile on its merchants' storefronts, so a large number of shops already publish one, often without the owner having looked at it.

The status is `optional` because it only applies to sites that sell something. For a shop that wants agent-driven sales, treat it as you would a payment integration: deliberate, tested, and owned.

## How to implement

- **Check whether your platform already publishes one.** Request `/.well-known/ucp` on your own domain before building anything. Hosted commerce platforms may serve it for you, and then your job is to review what it declares rather than to write it.
- **Serve it exactly as the spec requires.** Profiles MUST be served over HTTPS, MUST NOT redirect, and MUST carry `Cache-Control` with `public` and a `max-age` of at least 60 seconds. `private`, `no-store` and `no-cache` are forbidden. Add an `ETag` or `Last-Modified` so consumers can revalidate. See [Cache-Control](/spec/performance/cache-control/).
- **Keep the profile stable.** It describes the business, not a session. No per-visitor or per-transaction values belong in it.
- **Declare only what works.** Every `services` entry needs a live endpoint and every capability a working implementation. Advertise every protocol version you still serve, so older agents can negotiate down.
- **Authenticate the agents that call you.** Businesses SHOULD verify the platform before acting on its requests. UCP supports API keys, OAuth 2.0, mTLS, and HTTP Message Signatures (RFC 9421). The signature route works with [Web Bot Auth](/spec/agent-readiness/web-bot-auth/), so a business that already verifies signed crawlers can reuse that verification.
- **Bound the cost of discovery.** Fetching the profile of an unknown platform is outbound work you do on demand. The spec suggests a fixed-size cache, a global rate limit, and backoff on failing profile URLs.

## Common mistakes

- **Treating the profile as an SEO or discovery asset.** It is a capability manifest. Publishing it does nothing for whether an agent finds or recommends your products.
- **Redirecting the well-known path.** A common habit is redirecting apex to `www` or `http` to `https`. The profile URL itself must answer `200` directly.
- **Serving it uncacheable.** A blanket `no-store` rule from a CDN or framework violates a MUST in the spec. Check the header on the actual response, not the configuration.
- **Advertising a capability you have not tested.** If the profile claims discounts or a particular payment handler, an agent will try to use them. A failed checkout costs more than a missing capability.
- **Expecting `rel="ucp"` to be standard.** Some implementations add a `Link: </.well-known/ucp>; rel="ucp"` header. That relation is not in the IANA Link Relations registry, so clients should fetch the well-known path directly.

## Verification

- `curl -sI https://your-store.example/.well-known/ucp` returns `200` (no `3xx`) with `Content-Type: application/json` and a `Cache-Control` containing `public` and `max-age=60` or more.
- The body parses as JSON and contains `ucp.version`, `ucp.services` and `ucp.payment_handlers`. The two registries must be present even when empty.
- Every endpoint listed under `services` responds. A REST or MCP endpoint answering with an HTML error page is a broken profile.
- Every capability in the profile has been exercised end to end, with a real checkout on a test order, from at least one UCP-speaking platform.
