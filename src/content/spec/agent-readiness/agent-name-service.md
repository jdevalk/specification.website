---
title: "Agent Name Service — verifiable agent identity"
slug: agent-name-service
category: agent-readiness
summary: "The Agent Name Service (ANS) gives each AI agent a versioned name anchored in a domain its operator controls, published in DNS and sealed in a transparency log, so a peer can verify who it is talking to before applying its own policy. Drafts under active development; a Linux Foundation project since November 2026."
status: optional
order: 44
appliesTo: [all]
relatedSlugs: [web-bot-auth, a2a-agent-cards, agentic-resource-discovery, dns-aid, mcp-and-tool-discovery, link-headers]
updated: "2026-11-20T00:00:00.000Z"
sources:
  - title: "Agent Name Service — Specifications and documentation"
    url: "https://ansinfo.ai/docs/"
    publisher: "Agent Name Service (Linux Foundation)"
  - title: "ANS-6 — Agent authentication"
    url: "https://github.com/agentnameservice/ans-spec/blob/main/spec/ans-6-agent-authentication.md"
    publisher: "Agent Name Service (Linux Foundation)"
  - title: "draft-narajala-courtney-ansv2 — Agent Name Service v2 (ANS): A Domain-Anchored Identity Layer for Autonomous AI Agents"
    url: "https://datatracker.ietf.org/doc/draft-narajala-courtney-ansv2/"
    publisher: "IETF"
  - title: "Linux Foundation Welcomes Agent Name Service"
    url: "https://www.prnewswire.com/news-releases/linux-foundation-welcomes-agent-name-service-to-bring-verifiable-identity-and-discovery-to-ai-agents-302935151.html"
    publisher: "Linux Foundation"
---

## What it is

The Agent Name Service (ANS) gives an AI agent a verifiable identity anchored in a domain name its operator controls. Each registration gets a versioned name such as `ans://v1.0.0.payments.example.com`: the version and the domain identify the registration, and a new version is a new registration. The identity is published in DNS and sealed in a transparency log, so a peer can check the name, the certificates behind it, and whether the registration is still current, using DNS and certificates alongside explicitly trusted transparency logs.

ANS is defined in seven documents, ANS-0 through ANS-6: identity, registration, versioned naming, DNS publication, transparency, integrity monitoring, and agent authentication. The lifecycle runs in five steps: the operator submits the agent host, version, endpoints, and certificate material to a Registration Authority, which verifies domain control and the required proofs; the operator publishes the DNS records the authority returns; the authority signs the lifecycle event and the Transparency Log seals it before activation succeeds; peers discover the endpoint and the evidence, locating the registration's badge in the log through the shared `_ans-badge` record; and the peer authenticates, then applies its own policy.

Authentication checks three proofs. Identity: is this certificate bound to this agent in the transparency log, shown by a badge or a verified SCITT receipt. Current status: is the registration still valid, shown by an online badge or a short-lived signed status token with bounded freshness. Possession: does this peer hold the private key — badges and receipts alone cannot authenticate the caller. ANS-6 defines two caller authentication methods with equal standing: mutual TLS, where the caller presents its ANS Identity Certificate during the handshake, and application-layer DPoP, a signed single-use proof bound to the request method, URL, and content that passes through gateways that terminate TLS. Callee verification also binds the actual TLS server certificate to the registration.

The work is young. ANS began in May 2025 as an OWASP GenAI Security Project white paper; the first IETF draft, `draft-narajala-ans-00`, has expired, and the successor, `draft-narajala-courtney-ansv2-02` (October 2026), is an individual submission with no IETF endorsement. The Linux Foundation announced its intent to adopt ANS in June 2026 and launched it as a foundation project on 10 November 2026, with eleven organisations behind it including Cisco, Cloudflare, DigiCert, GoDaddy, and Salesforce. The project's own site is plain about the state of play: the published specifications are drafts under active development.

## Why it matters

- **Identity you can check, not a string you trust.** A user-agent string or an IP range says nothing reliable about who is calling. ANS binds the caller to a domain, a version, and a sealed log entry from a transparency log the verifier trusts.
- **Discovery and verification in one system.** DNS already answers "where is this agent"; ANS adds "and here is the evidence it is who it claims to be". The V2 discovery profile, `ANS_DNSAID`, publishes SVCB records at the agent host, with a `_ans-badge` record pointing at the transparency-log badge.
- **Audit logs become meaningful.** Once a peer is verified, each logged action can carry the verified ANS name and a reference to the evidence (badge or SCITT receipt) checked at the time. The log then shows which agent version did what, and revocations show up as status changes — but the log proves identity, not permission: what the agent was allowed to do is still your policy decision, recorded alongside.
- **Complements, not replaces, the neighbouring pages.** [Web Bot Auth](/spec/agent-readiness/web-bot-auth/) proves identity per request with HTTP signatures; [A2A agent cards](/spec/agent-readiness/a2a-agent-cards/) and [Agentic Resource Discovery](/spec/agent-readiness/agentic-resource-discovery/) handle discovery. ANS sits underneath them: the name and the proof that the discovered endpoint belongs to it.
- **Explicit log trust.** ANS combines DNS and certificates with an operator-configured set of trusted transparency logs and signing keys. DNS discovery alone cannot establish that trust. The resulting identity check says nothing about the agent's code or behaviour.

Treat it as `optional` for now. The specifications are drafts, the verifier ecosystem is small — a Go reference implementation with an offline verifier, Go, Rust, and Java SDKs, and an ANS CLI — and the one named deployment is the AGNTCY Agent Directory Service, which can verify ANS identities against the transparency log. But the direction is clear: agent-to-agent traffic is getting the same treatment websites got twenty years ago, a name you can verify before you trust it.

## How to implement

**If you operate a service that agents call:**

- **Configure trusted logs first.** Obtain the log-domain allowlist through trusted configuration or an independent trusted channel. Reject badge URLs outside it before fetching. Bootstrap and cache receipt and status-token verification keys from those trusted logs' `/root-keys` endpoints. Never derive trust from the DNS record being verified.
- **Verify before you authorise.** Resolve the caller's `_ans-badge` record, check the badge or SCITT receipt against the transparency log, check current status (badge or short-lived status token), and require proof of possession — mTLS or DPoP. A badge on its own authenticates nobody.
- **Bind the TLS peer.** Verify the actual TLS server certificate against the registration, and treat a DNSSEC-authenticated DANE mismatch as a failure where TLSA records are published.
- **Keep authorisation separate.** A verified identity establishes a key and version association, not permission or good behaviour. Apply your own policy to verified names and retain your existing defaults for unverified traffic. Trust scoring is a separate project, not an ANS authentication tier.
- **Log the verified name and the evidence.** Record the ANS name, the version, and the badge or receipt reference checked at the time, next to your own authorisation decision. That is what turns a request log into an audit log.
- **Plan for failure modes.** Decide in advance what happens when the transparency log is unreachable, a status token is stale, or a registration is revoked — fail closed for sensitive actions, and say so.

**If you operate an agent:**

- **Register with a Registration Authority.** Submit the agent host, version, endpoints, and certificate material; the authority verifies domain control and returns the DNS records to publish, including the required `_ans-badge` record.
- **Treat a version as a new identity.** A new release is a new registration under a new ANS name. Keep the old version registered only while it still serves traffic, and revoke it through the authority when it stops.
- **Publish what the authority returns.** The V2 default profile is `ANS_DNSAID` (SVCB at the agent host); `ANS_TXT` at `_ans.agentHost` is an explicit option. Optional DANE TLSA records add a DNSSEC-authenticated binding for the server certificate.
- **Monitor the registration.** ANS-5 covers periodic verification and reports about changes to registered artifacts — use it, or an equivalent check, so a changed certificate or endpoint does not sit unnoticed.

## Common mistakes

- Treating discovery as authentication. Finding an agent in DNS, or reading its badge, proves nothing about the caller. Only the possession proof — mTLS or DPoP — authenticates the peer.
- Treating a verified identity as authorisation. ANS answers "who is this"; what it may do, on whose behalf, and with what limits is your policy, not the protocol's.
- Checking identity but not current status. A registration can be revoked; a badge fetched yesterday says nothing about today. Status tokens are short-lived on purpose.
- Assuming the name attests behaviour. Sealed metadata digests bind published metadata to a registration. They do not attest the code executing on a remote machine or guarantee an agent's behaviour.
- Verifying the badge and ignoring the TLS peer. The server certificate presented in the handshake must match the registration; otherwise the verified name belongs to someone else's connection.

## Verification

- Run the Go reference implementation locally: register a test agent, publish its DNS records, and resolve its `_ans-badge` record to the transparency-log badge.
- Point a test `_ans-badge` record at an untrusted log and confirm rejection before any badge fetch.
- Verify a SCITT receipt offline, revoke the registration, and confirm that receipt still verifies as historical evidence. Separately fetch a fresh badge and confirm revoked status rejects authentication. For status tokens, confirm refresh is refused after revocation and cached tokens stop authenticating within the configured expiry, clock-skew and grace bounds.
- Send a request with no possession proof and confirm verification fails; then send one with mTLS or DPoP and confirm it passes — and that the logged ANS name matches the version you registered.
- Check the ANS specifications index for the current draft state before building against any one document: the seven layers move independently, and ANS-6 in particular is still marked draft.
