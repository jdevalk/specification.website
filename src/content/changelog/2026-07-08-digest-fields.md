---
title: Added a page on HTTP Digest Fields
date: "2026-07-08"
type: added
relatedSlugs: [digest-fields]
---

Added [Digest Fields (Content-Digest and Repr-Digest)](/spec/security/digest-fields/), covering RFC 9530's integrity fields, the distinction between hashing the transferred content and hashing the whole representation, and why a digest is not authentication. Marked `optional`: browsers never validate it, so it earns its keep on APIs, downloads, and machine-readable endpoints rather than on ordinary pages. The site now emits both fields on every Markdown representation, including the per-page `.md` endpoints, `/llms.txt` and `/checklist.md`.
