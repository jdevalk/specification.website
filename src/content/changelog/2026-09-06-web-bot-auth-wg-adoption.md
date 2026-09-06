---
title: Web Bot Auth is now an IETF working-group document
date: "2026-09-06"
type: changed
relatedSlugs: [web-bot-auth]
---

The IETF chartered a Web Bot Auth working group, which adopted `draft-ietf-webbotauth-httpsig-protocol` on 1 September 2026 and folded the separate key-directory draft into it. [Web Bot Auth](/spec/agent-readiness/web-bot-auth/) now cites the single working-group draft instead of the two individual submissions, and spells out what it asks of a bot operator: an asymmetric key published as a JWK Set at `/.well-known/http-message-signatures-directory`, discovered through a signed `Signature-Agent` header, with `created`, `expires`, `keyid`, and a `tag` of `web-bot-auth`. The page stays `optional` — adoption is not publication, and the well-known URI is requested rather than registered.
