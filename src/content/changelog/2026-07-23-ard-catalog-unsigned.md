---
title: "ARD catalogues: sign only when the key is anchored elsewhere"
date: "2026-07-23"
type: changed
relatedSlugs: [agentic-resource-discovery]
---

[Agentic Resource Discovery](/spec/agent-readiness/agentic-resource-discovery/) now explains when a `trustManifest` signature is worth anything and when it is theatre: a detached JWS whose verifying key sits on the same origin as the catalogue folds to the very compromise it is meant to detect, and it leaves `entries` — the endpoint URLs an attacker would actually rewrite — unsigned. This site removed its own ES256 signature accordingly and serves the catalogue as plain JSON.
