---
title: "TDM reservation (TDMRep)"
slug: tdmrep
category: agent-readiness
summary: "Declare in machine-readable form whether you reserve the right to object to text and data mining, using the `tdm-reservation` HTTP header, a `<meta>` element, or `/.well-known/tdmrep.json`. Its force is legal, not technical."
status: optional
order: 43
appliesTo: [all]
relatedSlugs: [content-signals, robots-for-ai-crawlers, robots-txt, agent-readiness-overview]
updated: "2026-07-28T00:00:00.000Z"
sources:
  - title: "TDM Reservation Protocol (TDMRep) — Final Community Group Report"
    url: "https://www.w3.org/community/reports/tdmrep/CG-FINAL-tdmrep-20240202/"
    publisher: "W3C"
  - title: "Directive (EU) 2019/790 on copyright in the Digital Single Market — Article 4"
    url: "https://eur-lex.europa.eu/eli/dir/2019/790/oj"
    publisher: "EUR-Lex"
  - title: "IANA Well-Known URIs registry"
    url: "https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml"
    publisher: "IANA"
  - title: "European Commission — Consultation on protocols for reserving rights from text and data mining"
    url: "https://digital-strategy.ec.europa.eu/en/consultations/commission-launches-consultation-protocols-reserving-rights-text-and-data-mining-under-ai-act-and"
    publisher: "European Commission"
---

## What it is

TDMRep is a small, finished convention for stating one thing: whether you reserve the right to object to **text and data mining** of your content. It carries a single value, `1` (reserved) or `0` (not reserved), plus an optional URL pointing at a human- or machine-readable licensing policy.

Three places can carry it, in ascending order of specificity:

```
tdm-reservation: 1
tdm-policy: https://example.com/policies/tdm.json
```

```html
<meta name="tdm-reservation" content="1" />
<meta name="tdm-policy" content="https://example.com/policies/tdm.json" />
```

```json
[
  { "location": "/", "tdm-reservation": 1 },
  { "location": "/press/*.jpg", "tdm-reservation": 0 }
]
```

The last of these lives at `/.well-known/tdmrep.json` and uses `robots.txt` path-matching rules, including `*` and `$`. When more than one mechanism applies to the same resource, the more specific wins: an HTML `<meta>` beats an HTTP header, which beats the well-known file. The file is the site-wide default; the header and the meta element are the per-resource overrides.

**This is not a crawler blocker, and reading it as one is the most common mistake.** `robots.txt` and AI-crawler directives answer *may you fetch this?* TDMRep answers a later and separate question: *having fetched it, may you mine it?* A crawler that respects `Disallow:` never sees your content. A crawler that respects `tdm-reservation: 1` reads the page quite happily and is then on notice that training on it was not licensed. One is a gate; the other is a notice. Shipping TDMRep blocks nobody, and a site that wants a gate still needs [robots directives for AI crawlers](/spec/agent-readiness/robots-for-ai-crawlers/).

## Why it matters

The consumer of this signal is mostly a legal system rather than a crawler, and that is the honest way to judge it.

Article 4 of the EU Copyright in the Digital Single Market Directive permits text and data mining of lawfully accessible works **unless the rightsholder has expressly reserved that right in a machine-readable way**. The reservation has to be machine-readable to count. TDMRep exists to be that machine-readable form. If you do nothing, Article 4's default is that mining is permitted.

That obligation now has a counterpart on the other side. Providers of general-purpose AI models must have a policy for identifying and respecting Article 4 reservations, and in December 2025 the European Commission opened a consultation to agree a list of protocols that qualify — with TDMRep among the named candidates. The output of that process, not crawler adoption statistics, is what will decide whether this convention matters.

Technical uptake, meanwhile, is thin and worth stating plainly. Spawning AI reads TDMRep in the API it operates for model trainers, and Common Crawl measures its prevalence when surveying opt-out signals. No major crawler operator has published a commitment to honour it in the way they publish commitments about `robots.txt`. Do not ship this expecting enforcement. Ship it because an unstated reservation is, under Article 4, no reservation at all.

## How to implement

**Decide the value first, then pick the mechanism.** The value is a licensing decision, not a technical one. `1` means anyone wanting to mine your content must seek permission or follow your `tdm-policy`. `0` means they may mine it freely. There is no "ask me nicely" middle option, and inventing one breaks parsers.

**Prefer the HTTP header for a whole-site answer.** It applies to every response, including images, PDFs, and JSON that have no `<head>` to put a `<meta>` in. That coverage is the reason to reach for it first.

**Use `/.well-known/tdmrep.json` when the answer varies by path**, and remember it is the weakest of the three — anything you set in a header or a `<meta>` on a specific resource overrides it.

**Set `tdm-policy` whenever you set `tdm-reservation: 1`.** A bare reservation tells a would-be licensee that the answer is no, without telling them who to ask. That is a wasted opportunity and, if you are hoping to license, self-defeating.

**Keep it consistent with everything else you publish.** A `tdm-reservation: 1` next to a permissive content licence, or next to `Content-Signal: ai-train=yes`, is a contradiction someone will eventually have to resolve — probably not in your favour.

> **This site ships it.** specification.website sends `tdm-reservation: 0` on every response, set in [`public/_headers`](https://github.com/jdevalk/specification.website/blob/main/public/_headers). The content is CC BY 4.0 and we want it mined, indexed, and trained on; declaring `0` states that in the same machine-readable form that a refusal would take, rather than leaving it to be inferred from a licence file.

## Common mistakes

- Treating it as a block. It stops no fetch and triggers no `403`. If you want fetching stopped, that is a different mechanism.
- Sending `tdm-reservation: 1` while your `robots.txt` invites AI crawlers in, or vice versa. Pick a position and express it consistently.
- Using `true`, `yes`, or `reserved` as the value. Only the integers `1` and `0` are valid; anything else means agents treat the field as unset, so a malformed reservation is the same as no reservation.
- Putting the well-known file in place and assuming it wins. It is the lowest-precedence mechanism of the three.
- Expecting the declaration to be retroactive. It says nothing about copies already in a training corpus.

## Verification

- `curl -sI https://example.com/ | grep -i tdm-` shows the header on a real response.
- Fetch a non-HTML asset — an image, a PDF — and confirm the header is present there too. That is the coverage the `<meta>` form cannot give you.
- If you publish `/.well-known/tdmrep.json`, confirm it parses as a JSON array and that every entry has a `location` and an integer `tdm-reservation`.
- Check the value against your actual licence. The two should say the same thing.
