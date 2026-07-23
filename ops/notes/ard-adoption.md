# Adopting Agentic Resource Discovery (ARD) on specification.website

Notes for a joost.blog post. Captures exactly what we changed to become an early
reference implementation of [Agentic Resource Discovery](https://agenticresourcediscovery.org/)
(ARD) — the Linux Foundation / Google draft announced June 2026. Not part of the
deployed site; this file is scratch for the write-up.

> **Superseded in part, 23 July 2026.** The signing described in §9 was removed.
> The verifying JWK Set lived at `/.well-known/jwks.json`, on the same origin as
> the catalogue it vouched for — so anyone able to rewrite the catalogue could
> swap the key too, and the signature could not detect the compromise it existed
> for. It also covered `host.trustManifest` only, leaving every `entries` URL
> (the fields an attacker would actually target) unsigned. The catalogue is now
> served as plain JSON. The reasoning is on the
> [spec page](../../src/content/spec/agent-readiness/agentic-resource-discovery.md);
> it makes a better post than the signing walkthrough did.

## The one-sentence pitch

ARD is a discovery layer (not a runtime): a domain publishes an **AI Catalog** at
`/.well-known/ai-catalog.json` listing the agent capabilities it offers, so
registries and agents can find and trust them in a single fetch. It builds on the
**AI Catalog** standard. Both are Apache 2.0.

We were an unusually clean adopter because the two artefact types an ARD entry
references — an **MCP server card** and an **A2A agent card** — already existed on
the site. Adopting ARD was mostly _cataloguing things we already shipped_, plus a
new spec page (the site documents what it ships).

## What we shipped (every change, in order)

### 1. The catalog itself — `public/.well-known/ai-catalog.json` (new)

The manifest. `specVersion`, a `host` block with an HTTPS `trustManifest`
(identity = `specification.website`), and two `entries`:

| Entry      | `mediaType`                        | `url`                               |
| ---------- | ---------------------------------- | ----------------------------------- |
| MCP server | `application/mcp-server-card+json` | `/.well-known/mcp/server-card.json` |
| A2A agent  | `application/a2a-agent-card+json`  | `/.well-known/agent-card.json`      |

Each entry has a URN `identifier` (`urn:ai:specification.website:mcp:…`), a
`displayName`, `description`, `tags`, `version`, `updatedAt`. We reference the
existing cards by `url` rather than duplicating them — single source of truth.

The `host.trustManifest` is **signed** — a detached ES256 JWS (see §9). We still
skip `attestations`/`provenance`: we have no honest third-party claims to point
at, and faking them would be the exact dishonesty the spec's trust model exists
to prevent. So we shipped the cryptographic tier (a real signature) without the
decorative tier (claims we can't back).

### 2. Content-Type + Link header — `public/_headers`

- Added a `Content-Type: application/ai-catalog+json` block for the new file
  (with `Access-Control-Allow-Origin: *`, like our other discovery files).
- Added `</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/ai-catalog+json"`
  to the site-wide `Link` header, alongside the existing mcp / agent-card /
  agent-skills / api-catalog rels.

### 3. HTML `<link rel="ai-catalog">` — `src/components/HeadMeta.astro`

ARD lets publishers advertise the catalog with `<link rel="ai-catalog">` in
`<head>`. Added it site-wide. (We already serve the same rel as an HTTP header;
belt and braces, and it matches how we expose other discovery surfaces.)

### 4. `robots.txt` `Agentmap:` directive — `public/robots.txt`

ARD defines an `Agentmap:` directive (mirroring `Sitemap:`) pointing at the
catalog. Added:

```
Agentmap: https://specification.website/.well-known/ai-catalog.json
```

### 5. DNS service-binding records (manual — see below)

ARD reuses the `_agents` DNS namespace that DNS-AID already uses. We need
`_catalog._agents` (static manifest) and `_search._agents` (dynamic registry
search — we don't run one, so we may skip `_search`).

### 6. api-catalog Linkset — `public/.well-known/api-catalog`

Added the catalog to the homepage anchor's `service-meta` array so the RFC 9727
Linkset and ARD agree on what we publish.

### 7. The spec page — `src/content/spec/agent-readiness/agentic-resource-discovery.md` (new)

Status **`optional`** — it's a v0.9 vendor-led draft, so `optional` is the honest
bar, not `recommended`. Canonical section structure, primary sources led by the
spec/standard (Google blog cited as context only). Added the new slug to
`relatedSlugs` on dns-aid, mcp-and-tool-discovery, a2a-agent-cards, and the
agent-readiness overview.

### 8. Plumbing that travels with any new page

- Changelog: `src/content/changelog/2026-06-19-agentic-resource-discovery.md`.
- OG images: `npm run assets` regenerated the new per-page image plus the four
  count-driven ones (og-default, checklist, spec, agent-readiness category).
- Agent Skill: bumped the page count in `SKILL.md` and recomputed its sha256
  `digest` in `agent-skills/index.json`.
- MCP worker: needs a redeploy (`cd mcp && npm run deploy`) so the bundled
  `data.json` includes the new page.

## The interesting angles for the post

- **We had the pieces already.** ARD didn't ask us to build new capabilities — it
  asked us to _index_ the MCP + A2A endpoints we already ran. That's the whole
  thesis: ARD is a catalogue over existing primitives, not a new runtime.
- **ARD overlaps DNS-AID.** Both use `_<service>._agents.<domain>`. ARD's
  `_catalog._agents` slots straight into the namespace DNS-AID already defined —
  worth a paragraph on the agentic-web discovery stack converging on `_agents`.
- **Status discipline.** Shipping the implementation but rating the spec page
  `optional` is the site's house rule: be an early adopter, stay honest about
  maturity.
- **Signed, but nothing faked.** We built the cryptographic tier — a detached
  ES256 JWS over the JCS-canonicalised trust manifest — but skipped
  `attestations`/`provenance` because we have no honest third-party claims. Ship
  the crypto, not the theatre.
- **Offline signing, no key in CI.** The private key never enters Cloudflare or
  GitHub. We sign locally and commit the signature; the public key is a JWK Set
  at `/.well-known/jwks.json`. For a near-static manifest that's strictly safer
  than a build-time secret — and a cleaner story than "we put our signing key in
  CI". The JCS+detached-JWS dance is ~120 lines of Node with zero dependencies
  (built-in WebCrypto).

## §9 — How the signature works

- Algorithm: ES256 (P-256), matching the spec's example. `kid` is the RFC 7638
  JWK thumbprint.
- Per the AI Catalog spec the signature covers the **trustManifest only**: remove
  `signature`, JCS-canonicalise (RFC 8785), sign the canonical bytes as a
  **detached** JWS (RFC 7515) — payload omitted from the compact form.
- HTTPS identity resolution: `identity` is the JWKS URL; a verifier fetches it
  and picks the key by the JWS `kid`. (Note the mild circularity of the HTTPS
  tier — the key signs a manifest that points back at the key. did:web or a
  third-party attestation would break the circle; worth a sentence in the post.)
- Tooling: `scripts/sign-ard-catalog.mjs` (`npm run sign:ard` / `check:ard`).
  The signer self-verifies against the published JWKS after signing.
- Gotcha: the signature is independent of file formatting (Prettier can reflow
  ai-catalog.json freely) because verification re-canonicalises. But editing any
  trustManifest field means re-signing — enforced via a note in CLAUDE.md.

## Schema gotchas worth flagging

- The entry field is `mediaType`, not `type`. **(Update — this turned out to be
  only half true. See "Part 2" below: there are two competing specs and they
  disagree on this exact field name.)**
- MCP media type is `application/mcp-server-card+json` (note `-card`), not
  `application/mcp-server+json`.
- Exactly one of `url` or `data` per entry.
- The URN publisher segment must align with the `trustManifest` identity domain.

---

# Part 2 — OKF bundle + finishing the ARD catalog (2026-06-20)

Second session. Two threads: (a) publish the whole spec as an **Open Knowledge
Format (OKF)** bundle, and (b) use ARD to fix the thing OKF deliberately leaves
unsolved — **discovery**. Plus a real-world plot twist about the `mediaType`
field above.

## The thesis for this part

OKF and ARD are two halves of one idea. **OKF says how to package a knowledge
base** (a tree of typed Markdown "concept" files). **OKF explicitly makes
serving and discovery non-goals** — a conformant bundle sitting on a server is
undiscoverable by design. **ARD is exactly the missing half**: a catalog entry
that points an agent at the bundle. So the post writes itself as "here are two
specs that only become useful when you compose them, and here's the worked
example."

## The `mediaType` vs `type` plot twist (correct the Part 1 note)

Part 1 confidently said "the entry field is `mediaType`, not `type`." Digging in
for this session, that's because there are **two different specifications** both
called "AI Catalog," and they disagree:

- **`Agent-Card/ai-catalog`** — the base spec our page cites. Field is
  **`mediaType`**. No `representativeQueries`. Our original catalog was correct
  against _this_.
- **`ards-project/ard-spec`** + the rendered `agenticresourcediscovery.org` site
  — the **ARD layer** that builds on top. It renamed the field to **`type`** (an
  IANA media type) and added `representativeQueries` (2–5 natural-language
  prompts) and `capabilities`.

So `mediaType` was never a typo — it was faithful to the base spec. But a
registry validating against _ARD_ (the thing we claim to adopt) wants `type`.
**Resolution:** emit **both** field names with the same value, plus
`representativeQueries`, on every entry. Both specs require consumers to preserve
unknown keys, so the dual-field entry validates under either. This is a genuinely
good "the standards are still settling" anecdote for the post — early adoption
means you sometimes implement two specs at once and let them disagree politely.

(Bonus: the JWS only covers `host.trustManifest`, not `entries`. So renaming
fields and adding two entries needed **no re-signing**. The signature design from
Part 1 paid off — the contract you sign is separate from the catalog you edit.)

## What we shipped this session

### 1. The OKF bundle — generated, never hand-written

The whole site is already derived from one content collection; the bundle is just
one more derived surface.

- `src/lib/okf.ts` — reads the `spec` collection and renders concepts.
- `src/pages/okf/**` — Astro endpoints that emit the `/okf/` tree as
  `text/markdown`, the same way `/llms.txt` and the per-page `.md` mirror work.

The tree:

- **144 Check concepts** at `okf/<category>/<slug>.md` — concept path mirrors the
  canonical URL, so OKF concept IDs line up with `/spec/<category>/<slug>/`. Each
  carries OKF's blessed fields (`type: Check`, `title`, `description`, `resource`,
  `tags`, `timestamp`) plus producer-defined keys (`category`, `status`,
  `conformance` as an RFC 2119 keyword derived from `status`, `standard`,
  `last_verified`). Body reuses the same Markdown the `.md` negotiation serves,
  with `# Source` and `# Citations` appended.
- **445 Reference concepts** at `okf/references/<slug>.md` — one per _distinct
  cited source URL_ across all pages (`type: Reference`). Each check's `standard`
  field and citations link to these. (Decision: one-per-URL, not per-publisher
  and not inline-only. Heaviest option, but it's the most faithful OKF "mirror
  external material as first-class concepts" reading.)
- **Index files** (`index.md`) per directory — no front matter, per OKF §6,
  except the **root `index.md`** which carries `okf_version: "0.1"` (the one place
  §11 permits it).
- **`log.md`** — derived from the hand-curated `/changelog/` collection,
  date-grouped newest-first with the conventional `**Creation**`/`**Update**`
  lead words.

601 files total (later 604 after the new spec page). Conformance check (every
non-index `.md` has parseable YAML front matter with a non-empty `type`, OKF §9):
**0 failures**.

### 2. Packaging — `/okf.tar.gz` with zero dependencies

`astro-okf-tarball.mjs` is an Astro integration that, in `astro:build:done`,
walks `dist/okf/` and writes a gzipped tar. **Node ships no tar library**, so it
hand-rolls a POSIX **ustar** archive (~60 lines: 512-byte header blocks, octal
fields, the checksum dance) and gzips with built-in `zlib`. Fixed mtime + sorted
file order → **byte-reproducible** tarball. This is the same no-extra-dependency
stance as the JWS signer in Part 1 — a recurring theme worth naming in the post:
_the agentic-web plumbing is smaller than it looks; most of it is built-ins._

### 3. ARD catalog — finally complete (4 entries)

Part 1's catalog listed MCP + A2A. This session added the **Agent Skill** and the
**OKF bundle**, and added the dual `type`/`mediaType` + `representativeQueries`
shape to all four:

| Entry       | media type                                | url                                             |
| ----------- | ----------------------------------------- | ----------------------------------------------- |
| MCP server  | `application/mcp-server-card+json`        | `/.well-known/mcp/server-card.json`             |
| A2A agent   | `application/a2a-agent-card+json`         | `/.well-known/agent-card.json`                  |
| Agent Skill | `text/markdown`                           | `…/agent-skills/specification-website/SKILL.md` |
| OKF bundle  | `application/okf-bundle+gzip` _(interim)_ | `/okf.tar.gz`                                   |

The Skill entry honestly uses `text/markdown` — our skill is a served `SKILL.md`,
not a packaged `application/agentskill+zip`. Don't claim the zip type for a file.

### 4. Discovery pointers + the dogfood page

- `llms.txt` gained a `## Structured exports` section linking the bundle index and
  tarball.
- `public/_headers`: `/okf/*` → `text/markdown`, `/okf.tar.gz` →
  `application/gzip`, both with CORS. `_routes.json` excludes them from the
  Functions worker.
- api-catalog Linkset: the bundle added to the `/spec/` anchor's `alternate`.
- New spec page **"Open Knowledge Format (OKF) bundle"** (`agent-readiness`,
  status `optional` — same house rule as ARD: adopt early, rate honestly). The
  ARD page was updated to document the dual-field reality and the two new entries.

## The interesting interim-media-type angle (and the issues we filed)

The OKF bundle entry can only use an **unregistered** media type, because there
_is_ no blessed one. That's the durable gap: a catalog can list a bundle, but a
consumer can't _recognise_ it as OKF without sniffing — so every publisher
invents a different interim string and they never converge. We shipped
`application/okf-bundle+gzip` as a single named constant, documented as interim,
so swapping it later is a one-line change.

Then we did the ecosystem-citizen thing and filed the fix upstream, offering our
live bundle as the reference adopter:

- **OKF spec** (define/register the type): GoogleCloudPlatform/knowledge-catalog#111
  — <https://github.com/GoogleCloudPlatform/knowledge-catalog/issues/111>
- **ARD layer** (recognise it in the AI Catalog, + flagged the `type`/`mediaType`
  divergence): ards-project/ard-spec#27 — <https://github.com/ards-project/ard-spec/issues/27>

This is a nice closing beat for the post: _being an early adopter isn't just
implementing the draft — it's finding the gap the draft left and pushing it back
upstream._

## Extra angles for the post (Part 2)

- **OKF + ARD are complementary halves.** Packaging spec with a stated
  non-goal (discovery) + a discovery spec = a complete story only when composed.
- **Everything stays derived.** The bundle is generated from the same content
  collection as the HTML, the `.md` mirror, llms.txt, and the MCP data. No
  hand-maintained second copy that can drift — the whole site's design philosophy
  applied to one more output.
- **Two specs, one field, polite disagreement.** The `type`/`mediaType` split is
  a concrete, honest illustration of standards-in-flux. Emitting both is the
  pragmatic move.
- **The plumbing is built-ins.** A reproducible tar writer and an ES256 detached
  JWS, both in plain Node with no dependencies. Demystifies the agentic web.
- **Sign the contract, not the catalog.** Because the JWS covers only the trust
  manifest, the catalog's entries stay editable without re-signing — a deliberate
  separation that paid off the moment we extended the catalog.

## Deploy / status

- Committed straight to `main` (`756ea03`, then `e548930` for the proposal-doc
  link update). Cloudflare Pages auto-deploys.
- MCP worker redeployed (`cd mcp && npm run deploy`) — now serves 144 pages
  including the new OKF page; `data.json` is gitignored, regenerated by predeploy.
