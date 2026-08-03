---
title: "/.well-known/webhook-authorized-senders.json"
date: "2026-08-03"
reason: too-early
revisit: "A second, unrelated implementer. If a webhook platform with its own customer base — or the Standard Webhooks project — starts fetching this file to decide whether a sender is authorised, the convention becomes real and earns a page."
sources:
  - title: "Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "The webhook-authorized-senders.json file"
    url: "https://intempus.dk/webhook-authorization"
    publisher: "Intempus ApS"
  - title: "Standard Webhooks specification"
    url: "https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md"
    publisher: "Standard Webhooks"
---

A site that receives webhooks has a genuine problem: anyone who learns the endpoint URL can post to it. `/.well-known/webhook-authorized-senders.json` proposes to solve it from the receiving end — the receiver publishes a JSON allowlist of the hostnames it is willing to accept deliveries from, and a well-behaved sender fetches that file and refuses to deliver if it is not named. The idea is sound, the file is trivial to serve, and it is the kind of externally-checkable property this spec normally likes.

It has one implementer. The registration's change controller is Intempus ApS, the registered reference is that company's own documentation page, and we found no other party publishing or reading the file. Its **permanent** status in the IANA registry is easy to misread: permanent means a stable specification exists and the suffix will not be reassigned, not that anyone uses it. That is the whole of the adoption evidence, and it is not enough — a page here would tell readers to publish a file that exactly one sender in the world consults.

The comparison that settles it is [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md), the multi-vendor effort covering the same ground. It verifies senders with HMAC or asymmetric signatures over the payload and tells receivers to keep a trust list of public keys — deliberately not a discovery document. Where the two approaches disagree, the one with several implementations behind it is the one to describe. This entry is our reference case for the rule that IANA permanence is a statement about the registry, not about the web.
