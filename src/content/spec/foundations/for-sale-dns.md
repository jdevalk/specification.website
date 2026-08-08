---
title: "_for-sale DNS records"
slug: for-sale-dns
category: foundations
summary: "If a domain is genuinely for sale, say so in DNS. A TXT record at _for-sale.example.com advertises it to brokers and availability services without taking the site down or parking it."
status: optional
order: 180
appliesTo: [all]
relatedSlugs: [dnssec, caa-records, dns-aid, well-known-overview]
updated: "2026-08-08T00:00:00.000Z"
sources:
  - title: 'RFC 10023 — The "_for-sale" Underscored and Globally Scoped DNS Node Name'
    url: "https://www.rfc-editor.org/rfc/rfc10023.html"
    publisher: "IETF"
  - title: "RFC 8552 — Scoped Interpretation of DNS Resource Records through Underscored Node Names"
    url: "https://www.rfc-editor.org/rfc/rfc8552"
    publisher: "IETF"
  - title: "IANA — Underscored and Globally Scoped DNS Node Names registry"
    url: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml"
    publisher: "IANA"
---

## What it is

`_for-sale` is a reserved DNS leaf node name, defined by RFC 10023 (Informational, July 2026) and registered with IANA. A `TXT` record published at `_for-sale.example.com` signals that `example.com`, although registered and resolving normally, is available for purchase.

```dns
_for-sale IN TXT "v=FORSALE1;furi=https://example.com/for-sale"
```

The record carries a mandatory version tag followed by at most one `tag=value` pair:

| Tag     | Meaning                          | Example                              |
| ------- | -------------------------------- | ------------------------------------ |
| `ftxt=` | Free human-readable text         | `ftxt=Eligibility criteria apply.`    |
| `furi=` | Contact or information URI       | `furi=mailto:hq@example.com`         |
| `fval=` | Asking price, currency + amount  | `fval=EUR2500.00`                    |
| `fcod=` | Proprietary code, by prior agreement | `fcod=XX-aHR0cHM...`             |

The wrong belief to clear first is that this is a way of *parking* a domain. It is close to the opposite. Parking replaces the site with a sales page, which costs you every visitor the domain still has. `_for-sale` sits beside a live site in DNS and says nothing to a browser: the homepage keeps serving, the mail keeps flowing, and the record can be added and removed at will. RFC 10023 makes the point explicitly — the convention is designed to work while the domain is still in active use.

It is also not the same thing as registration data. WHOIS and RDAP answer "is this name registered?"; a registered name may still be purchasable, and an unregistered one may not be worth having. That gap is the whole reason the convention exists, and it is why brokers and automated availability services are the intended audience rather than people.

## Why it matters

The signal a domain owner most wants to send is the one there has never been a channel for. If you are willing to sell, the interested buyer has no way to learn that short of a cold email to a WHOIS contact that privacy redaction has probably removed. Enquiries that would have been welcome never arrive, and the ones that do arrive are indistinguishable from spam.

Putting the signal in DNS rather than on the page is what makes it useful to the parties who can act on it. A broker or an availability service checking a name resolves it anyway; one extra lookup tells them what a rendered page could not, because nothing on a working homepage says "the domain under this is negotiable". It is externally checkable, costs one record, and carries no risk to the site itself — a browser never sees it.

## How to implement

Publish a single `TXT` record at the `_for-sale` leaf of the zone you are selling, and only while you mean it.

```dns
; Free text
_for-sale IN TXT "v=FORSALE1;ftxt=Serious offers only"

; A URI to negotiate through — https, mailto and tel are the usable schemes
_for-sale IN TXT "v=FORSALE1;furi=https://example.com/fs?d=eHl6"

; An asking price: uppercase currency code, then the amount
_for-sale IN TXT "v=FORSALE1;fval=USD12500"
```

Rules worth getting right the first time:

- **The version tag is mandatory** and case-sensitive: every record starts `v=FORSALE1;`. It exists so a processor can tell a real `_for-sale` record from an unrelated `TXT` record that a DNS wildcard happened to expand into that name.
- **One tag-value pair per record.** To publish a price *and* a contact URI, publish two records in the same RRset and let the processor pick what it understands. This is not SPF; the pairs do not concatenate.
- **One character-string per record**, 255 octets maximum, so nothing has to be reassembled during parsing.
- **Keep the TTL at 3600 seconds or less.** A stale record advertising a price you have withdrawn, or a domain you already sold, is worse than no record.
- **Place it at a leaf.** `_for-sale.example.com` is valid at any level of the tree, but `xyz._for-sale.example.com` is not, and records under `.arpa` must be ignored — an offer to sell address space is out of scope.
- **Remove it when the domain is no longer for sale.** The convention has no "not for sale" value; absence is the only way to say no.

Sign the zone with [DNSSEC](/spec/security/dnssec/) if you can. An unsigned `TXT` record asserting your domain is for sale, at a price, with a contact URI, is a comfortable thing for someone else to forge.

This site does not ship a `_for-sale` record: specification.website is not for sale.

## Common mistakes

- **Cramming several pairs into one record.** `"v=FORSALE1;fval=EUR2500;furi=https://…"` looks reasonable and is not what the format defines. Use one pair per record, multiple records per RRset.
- **Publishing it aspirationally.** The indicator is only for domains actually available. It is not a marketing banner, and a record that exists to lure enquiries is an abuse the RFC calls out by name.
- **Assuming it obliges anyone.** Publishing the record does not commit the holder to sell, and an advertised `fval=` price is indicative — the RFC tells processors to display a disclaimer and never to treat it as a purchase commitment.
- **Expecting a wildcard to cover a whole zone.** `_for-sale.*.example.com` is not a valid wildcard. There is no way to put every domain under a TLD up for sale with one record.
- **Trusting the content.** If you are on the reading side, `ftxt=` is attacker-controlled text and `furi=` is an attacker-controlled URI. Sanitise before display — the RFC's own example content is `<script>...</script>` — and never auto-navigate a user to a `furi=` target without an explicit confirmation step.

## Verification

```bash
dig +short TXT _for-sale.example.com
```

- The answer begins with `v=FORSALE1;` and contains at most one `tag=value` pair per string.
- The TTL is 3600 or lower: `dig TXT _for-sale.example.com | grep _for-sale`.
- If the zone is signed, `dig +dnssec TXT _for-sale.example.com` returns a validating `RRSIG`.
- The record resolves at all. During a redemption or `pendingDelete` period, or when DNSSEC validation is bogus, the name will not resolve and the signal silently disappears.
