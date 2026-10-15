---
title: "RPKI route origin validation"
slug: rpki
category: security
summary: "Make sure the IP prefixes your web, name and mail servers live in are covered by Route Origin Authorisations, so networks that validate routes can reject hijacked announcements. Usually that means choosing a host that signs them."
status: recommended
order: 115
appliesTo: [all]
relatedSlugs: [dnssec, caa-records, https-tls, ipv6]
updated: "2026-10-15T00:00:00.000Z"
sources:
  - title: "RFC 6480 — An Infrastructure to Support Secure Internet Routing"
    url: "https://www.rfc-editor.org/rfc/rfc6480"
    publisher: "IETF"
  - title: "RFC 6811 — BGP Prefix Origin Validation"
    url: "https://www.rfc-editor.org/rfc/rfc6811"
    publisher: "IETF"
  - title: "RFC 9582 — A Profile for Route Origin Authorizations (ROAs)"
    url: "https://www.rfc-editor.org/rfc/rfc9582"
    publisher: "IETF"
  - title: "RFC 9319 (BCP 185) — The Use of maxLength in the Resource Public Key Infrastructure (RPKI)"
    url: "https://www.rfc-editor.org/rfc/rfc9319"
    publisher: "IETF"
---

## What it is

Traffic finds its way across the internet through BGP, the protocol networks use to announce which IP prefixes they can deliver to. Plain BGP believes whatever it is told: if a network announces a prefix it does not hold, by mistake or on purpose, traffic for that prefix can be pulled towards it. That is a route hijack, and it has repeatedly taken popular sites offline or redirected their traffic.

The Resource Public Key Infrastructure (RPKI, RFC 6480) lets the holder of an address block publish a signed statement, a Route Origin Authorisation (ROA, RFC 9582), saying which network (identified by its Autonomous System Number, or ASN) may originate a prefix, and how specific an announcement may be. Networks that perform route origin validation (RFC 6811) check each announcement against the published ROAs and label it:

- **Valid**: a ROA covers the prefix and the origin ASN matches.
- **Invalid**: a ROA covers the prefix, but the origin ASN or the prefix length does not match. Validating networks drop these.
- **Not found**: no ROA covers the prefix. It is accepted, unprotected.

The misconception worth correcting is that RPKI is something you configure on your website or in your DNS zone. It is not. A ROA is issued by whoever holds the IP address space, through their regional internet registry (RIPE NCC, ARIN, APNIC, LACNIC, AFRINIC). Most site owners rent addresses from a host or CDN and hold no address space at all, so they cannot sign anything themselves. What they control is the choice of host.

## Why it matters

A hijacked prefix can black-hole a site, or deliver its visitors to someone else's server. TLS limits the damage when it works, since an attacker without your certificate cannot impersonate an HTTPS site, but a hijack can still take the site offline, intercept plain DNS and SMTP, and in some cases help an attacker pass the domain validation a certificate authority performs.

ROAs only help if two things are true: the prefix has a ROA, and the networks between your visitors and your server validate. Validation is now widespread among large transit providers and access networks, so the remaining gap is mostly on the publishing side. A prefix with no ROA gets no protection from any of that validation.

This applies to every server your domain depends on, not just the web server: the authoritative name servers and the mail servers named in your `MX` records each sit in some prefix, and each prefix should be covered.

## How to implement

**If you rent hosting, DNS, or mail service** (the usual case):

1. Find the prefixes your servers sit in. Look up each `A` and `AAAA` address for the site, the name servers, and the `MX` hosts in a routing lookup such as [RIPEstat](https://stat.ripe.net/).
2. Check their RPKI status in the same tool. You want **valid** for every one.
3. If a prefix is not found or invalid, ask the provider to sign ROAs for it. Treat RPKI coverage as a selection criterion when choosing a host, DNS provider, or mail provider; the large ones all sign.

**If you hold your own address space and announce it yourself:**

1. Create ROAs in your regional internet registry's portal (or run a delegated RPKI certificate authority) for every prefix you announce, naming the ASN that originates it.
2. Make each ROA match what you actually announce. RFC 9319 recommends setting `maxLength` no longer than the prefix itself, and listing each more-specific prefix explicitly, rather than authorising every possible sub-prefix with a liberal `maxLength`. A loose ROA lets a hijacker announce a more-specific prefix with your ASN as the forged origin and still be judged valid.
3. Create ROAs before you change origins. When moving a prefix to a new upstream or a DDoS-mitigation provider, publish the ROA for the new ASN first, or validating networks will drop the new announcement as invalid.
4. Validate routes you receive, too, if you run BGP: drop invalids.

This site ships it through its host: the prefixes Cloudflare announces for this site and its name servers are covered by ROAs for Cloudflare's ASN and validate as valid.

## Common mistakes

- **Assuming the site's TLS or DNSSEC covers routing.** They protect different layers; neither says anything about who may announce a prefix.
- **Checking only the web server.** The name servers and mail servers are in other prefixes, often run by other providers.
- **A ROA whose length does not cover the announcement.** A ROA for a `/44` with `maxLength` 44 makes a `/48` announced from inside it invalid under that ROA. Either publish a ROA for the `/48` or set the length to match, and prefer the explicit ROA.
- **Moving a prefix to a new network without updating the ROA**, so the new announcement is invalid and validating networks drop it.
- **Letting RPKI certificates or ROAs lapse** in a self-hosted RPKI setup. Expired objects turn valid routes into not found, or worse.

## Verification

- Look up each server address on [RIPEstat](https://stat.ripe.net/) and check the RPKI validation status of the announcing prefix and origin ASN.
- Cloudflare's public RPKI test at [isbgpsafeyet.com](https://isbgpsafeyet.com/) checks whether your own access network validates, which is the other half of the system.
- Run the [Internet.nl website test](https://internet.nl/) (and the email test for mail servers). Its RPKI section checks that a ROA exists for each server's prefix and that the announcement is valid.
