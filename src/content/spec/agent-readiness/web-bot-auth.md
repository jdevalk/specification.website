---
title: "Web Bot Auth — verifiable bot identity"
slug: web-bot-auth
category: agent-readiness
summary: "Web Bot Auth lets a bot prove who it is by signing each HTTP request with a key it controls. Sites can then allow or block specific bots without IP allow-lists, user-agent strings, or guesswork. Built on RFC 9421 HTTP Message Signatures."
status: optional
order: 45
appliesTo: [all]
relatedSlugs: [robots-for-ai-crawlers, content-signals, agent-readiness-overview, link-headers, well-known-overview]
updated: "2026-09-10T00:00:00.000Z"
sources:
  - title: "RFC 9421 — HTTP Message Signatures"
    url: "https://www.rfc-editor.org/rfc/rfc9421"
    publisher: "IETF"
  - title: "draft-ietf-webbotauth-httpsig-protocol — HTTP Message Signatures for automated traffic"
    url: "https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/"
    publisher: "IETF Web Bot Auth Working Group"
  - title: "IETF Web Bot Auth (webbotauth) Working Group"
    url: "https://datatracker.ietf.org/wg/webbotauth/about/"
    publisher: "IETF"
  - title: "Cloudflare — Forget IPs: using cryptography to verify bot and agent traffic"
    url: "https://blog.cloudflare.com/web-bot-auth/"
    publisher: "Cloudflare"
---

## What it is

Web Bot Auth is an emerging convention that lets a bot prove its identity cryptographically on every request, using the standard [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421) mechanism from RFC 9421. Instead of guessing whether a request really comes from OpenAI's crawler by inspecting the user-agent string and looking up reverse DNS, the server reads a `Signature` header, fetches the bot's public key from a published key directory, and verifies the signature.

The work now has an IETF home. In September 2026 the [Web Bot Auth working group](https://datatracker.ietf.org/wg/webbotauth/about/) adopted [draft-ietf-webbotauth-httpsig-protocol](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/) as its first working-group document, folding in the separate key-directory draft that used to sit alongside it. One document now covers the trust model, the signing rules, the `Signature-Agent` header used to discover a bot's keys, and the JWK Set that header points at — served, the draft asks IANA to register, from `/.well-known/http-message-signatures-directory`. Cloudflare ships verification at the network edge, and a growing list of major crawlers sign their traffic.

Working-group adoption is not publication. The draft is still a draft, its details can and will change before it becomes an RFC, and the well-known URI it names is requested rather than registered. What adoption does tell you is that the mechanism is no longer one vendor's proposal: it has a chartered group, chairs, and a deliverable date, so building against it is a bet on a process rather than on a company.

## Why it matters

- **User-agent strings lie.** Anyone can set `User-Agent: GPTBot/1.0`. Signed requests cannot be forged without the bot operator's private key.
- **IP allow-lists rot.** Crawler IP ranges change. A signature-based check survives infrastructure migrations on the bot's side.
- **Granular policy.** Once you can verify the caller, you can apply different rules — paywall bypass for partner agents, slower rate limits for low-trust crawlers — without bespoke detection.
- **Composable with [Content Signals](/spec/agent-readiness/content-signals/) and [robots.txt for AI crawlers](/spec/agent-readiness/robots-for-ai-crawlers/).** robots.txt declares the policy; Web Bot Auth proves the identity the policy is about to be applied to.

Treat it as `optional` for now. The draft is pre-RFC, the verifier ecosystem is small, and most sites will get the benefit transparently via their CDN before they touch any code. But the direction is clear: bot identity is moving from "trust the header" to "verify the signature".

## How to implement

**If you are running a site:**

- **Use a verifier that supports your signing profile.** Follow its documented identity result. If verification happens at a proxy, accept that result only over a trusted proxy-to-origin path; strip client-supplied copies of identity headers.
- **Combine, do not replace.** Web Bot Auth tells you who is calling. [robots.txt](/spec/seo/robots-txt/) and [Content Signals](/spec/agent-readiness/content-signals/) tell you what they may do with the response. Both layers are needed.
- **Keep authorisation separate.** A valid signature establishes a key/identifier association, not permission or good behaviour. Apply your own policy to verified identifiers and retain your existing defaults for unsigned traffic.

**If you operate a bot:**

- **Generate an asymmetric signing keypair.** The draft restricts you to algorithms in the RFC 9421 registry and rules out shared-secret HMAC outright — a symmetric key would have to be handed to every site that wants to verify, which defeats the point.
- **Publish the public key** as a JWK Set. For default directory discovery, serve it at `https://bot.example/.well-known/http-message-signatures-directory` with media type `application/http-message-signatures-directory+json`. Send `Signature-Agent: sig1="https://bot.example"`: the value is an HTTPS **origin**, not the well-known file's URL. For a direct JWK Set URL instead, send `Signature-Agent: sig1="https://bot.example/keys.json";type=jwks_uri`.
- **Use the same label** (`sig1` here) in `Signature`, `Signature-Input` and `Signature-Agent`. Cover the matching dictionary member with `"signature-agent";key="sig1"` in `Signature-Input`, alongside the required target component. See [draft sections 5.2.1 and 5.5](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-5.2.1).
- **Sign every request** with `Signature` and `Signature-Input` per RFC 9421, covering `@authority` or `@target-uri` and carrying the `created`, `expires`, `keyid`, and `tag` parameters. `tag` must be `web-bot-auth`, which is what lets a verifier tell this profile apart from other uses of message signatures on the same connection.
- **Rotate keys** without breaking verifiers: allow for cached directories and outstanding signatures when overlapping keys; remove compromised keys promptly.

## Common mistakes

- Blocking unsigned traffic as a default. The standard is opt-in for bots; legitimate non-signing clients (including most browsers) will be locked out.
- Skipping `created` and `expires`, or accepting stale timestamps. Both are mandatory signature parameters in the draft; without a freshness window a captured signature replays forever.
- Verifying only the homepage. Bots fetch internal pages too; the policy has to apply site-wide.
- Assuming a signature authenticates `User-Agent`. It protects only the components it covers; the profile does not require that header to be signed.

## Verification

- Send an actually signed request using your signing client. Confirm the verifier reports the expected identifier, then change a covered component and confirm verification fails. Placeholder signature values cannot test success.
- For bot operators: feed your signed request into an RFC 9421 verifier and confirm the canonicalised signature base matches what your client constructed.
- Check your access logs for a verified-bot tag on traffic from signing crawlers (OpenAI, Anthropic, Perplexity, and others publish their key sets).
