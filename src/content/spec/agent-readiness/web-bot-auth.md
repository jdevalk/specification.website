---
title: "Web Bot Auth — verifiable bot identity"
slug: web-bot-auth
category: agent-readiness
summary: "Web Bot Auth lets a bot prove who it is by signing each HTTP request with a key it controls. Sites can then allow or block specific bots without IP allow-lists, user-agent strings, or guesswork. Built on RFC 9421 HTTP Message Signatures."
status: optional
order: 45
appliesTo: [all]
relatedSlugs: [robots-for-ai-crawlers, content-signals, agent-readiness-overview, link-headers]
updated: "2026-05-29T12:14:17.000Z"
sources:
  - title: "RFC 9421 — HTTP Message Signatures"
    url: "https://www.rfc-editor.org/rfc/rfc9421"
    publisher: "IETF"
  - title: "draft-meunier-web-bot-auth-architecture"
    url: "https://datatracker.ietf.org/doc/html/draft-meunier-web-bot-auth-architecture"
    publisher: "IETF"
  - title: "draft-meunier-http-message-signatures-directory"
    url: "https://datatracker.ietf.org/doc/html/draft-meunier-http-message-signatures-directory"
    publisher: "IETF"
  - title: "Cloudflare — Forget IPs: using cryptography to verify bot and agent traffic"
    url: "https://blog.cloudflare.com/web-bot-auth/"
    publisher: "Cloudflare"
---

## What it is

Web Bot Auth is an emerging convention that lets a bot prove its identity cryptographically on every request, using the standard [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421) mechanism from RFC 9421. Instead of guessing whether a request really comes from OpenAI's crawler by inspecting the user-agent string and looking up reverse DNS, the server reads a `Signature` header, fetches the bot's public key from a published key directory, and verifies the signature.

The proposal lives in two IETF drafts: [draft-meunier-web-bot-auth-architecture](https://datatracker.ietf.org/doc/html/draft-meunier-web-bot-auth-architecture) describes the trust model and discovery; [draft-meunier-http-message-signatures-directory](https://datatracker.ietf.org/doc/html/draft-meunier-http-message-signatures-directory) profiles RFC 9421 for bot use and defines the published key directory. Cloudflare ships verification at the network edge, and a growing list of major crawlers sign their traffic.

## Why it matters

- **User-agent strings lie.** Anyone can set `User-Agent: GPTBot/1.0`. Signed requests cannot be forged without the bot operator's private key.
- **IP allow-lists rot.** Crawler IP ranges change. A signature-based check survives infrastructure migrations on the bot's side.
- **Granular policy.** Once you can verify the caller, you can apply different rules — paywall bypass for partner agents, slower rate limits for low-trust crawlers — without bespoke detection.
- **Composable with [Content Signals](/spec/agent-readiness/content-signals/) and [robots.txt for AI crawlers](/spec/agent-readiness/robots-for-ai-crawlers/).** robots.txt declares the policy; Web Bot Auth proves the identity the policy is about to be applied to.

Treat it as `optional` for now. The drafts are pre-RFC, the verifier ecosystem is small, and most sites will get the benefit transparently via their CDN before they touch any code. But the direction is clear: bot identity is moving from "trust the header" to "verify the signature".

## How to implement

**If you are running a site:**

- **Let the edge do it.** Cloudflare, Fastly, and other CDNs are adding signature verification as a configurable feature. Turn it on, expose the result to your origin as a request header (e.g. `Cf-Verified-Bot-Category`), and branch on it.
- **Combine, do not replace.** Web Bot Auth tells you who is calling. [robots.txt](/spec/seo/robots-txt/) and [Content Signals](/spec/agent-readiness/content-signals/) tell you what they may do with the response. Both layers are needed.
- **Do not punish unsigned traffic.** Treat unsigned requests with the same defaults you use today. Signed requests earn trust; unsigned ones do not lose it.

**If you operate a bot:**

- **Generate a signing keypair** (Ed25519 is the recommended algorithm in the draft).
- **Publish the public key** in a JWK Set at a stable URL declared in your bot's documentation. Per the draft, sites discover the key set from the `Signature-Agent` header or the bot's IANA-registered identity.
- **Sign every request** with the `signature-input` and `signature` headers per RFC 9421, covering at minimum `@method`, `@authority`, `@target-uri`, and a `created` timestamp.
- **Rotate keys** without breaking verifiers: keep the previous key in the published key set for at least a few weeks after rotation.

## Common mistakes

- Blocking unsigned traffic as a default. The standard is opt-in for bots; legitimate non-signing clients (including most browsers) will be locked out.
- Skipping the `created` field or accepting old timestamps. Without a freshness window, captured signatures replay forever.
- Verifying only the homepage. Bots fetch internal pages too; the policy has to apply site-wide.
- Treating the user-agent string as redundant. It still carries the human-readable bot name and version; signatures verify it, they do not replace it.

## Verification

- `curl -sI -H 'Signature: …' -H 'Signature-Input: …' https://example.com/` — a properly configured edge logs verification success and exposes a derived header to origin.
- For bot operators: feed your signed request into an RFC 9421 verifier and confirm the canonicalised signature base matches what your client constructed.
- Check your access logs for a verified-bot tag on traffic from signing crawlers (OpenAI, Anthropic, Perplexity, and others publish their key sets).
