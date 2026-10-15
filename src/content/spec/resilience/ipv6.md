---
title: "IPv6 reachability"
slug: ipv6
category: resilience
summary: "Publish AAAA records for the web server and the authoritative name servers, make sure every IPv6 address actually answers, and serve the same site over IPv6 as over IPv4."
status: recommended
order: 70
appliesTo: [all]
relatedSlugs: [monitoring-uptime, https-tls, dnssec, rpki]
updated: "2026-10-15T00:00:00.000Z"
sources:
  - title: "RFC 3596 — DNS Extensions to Support IP Version 6"
    url: "https://www.rfc-editor.org/rfc/rfc3596"
    publisher: "IETF"
  - title: "RFC 4213 — Basic Transition Mechanisms for IPv6 Hosts and Routers"
    url: "https://www.rfc-editor.org/rfc/rfc4213"
    publisher: "IETF"
  - title: "RFC 8305 — Happy Eyeballs Version 2: Better Connectivity Using Concurrency"
    url: "https://www.rfc-editor.org/rfc/rfc8305"
    publisher: "IETF"
  - title: "Internet.nl — Website test"
    url: "https://internet.nl/"
    publisher: "Internet.nl"
---

## What it is

IPv6 is the successor to IPv4, with 128-bit addresses instead of 32-bit ones. A host name is reachable over IPv6 when DNS publishes an `AAAA` record for it (RFC 3596) and something at that address answers. Running both protocols side by side, with an `A` and an `AAAA` record for the same name, is called dual stack (RFC 4213), and it is how almost every IPv6-capable site is run today.

Two separate things need IPv6, and the second is often forgotten:

1. **The web server.** `example.com` and `www.example.com` each need an `AAAA` record that points at a host serving the site.
2. **The authoritative name servers.** The servers listed in your `NS` records need `AAAA` records of their own, so an IPv6-only resolver can look your domain up at all.

The wrong belief most operators hold is that a missing or broken `AAAA` record would show up as a visible outage. It usually does not. Browsers use Happy Eyeballs (RFC 8305): they try IPv6 and IPv4 almost at once and keep whichever connects first. If the IPv6 address is dead, the browser quietly falls back to IPv4 after a short delay, and the operator testing from a desktop never notices. The failure lands on clients that do not race the two protocols, on IPv6-only networks, and on tests such as Internet.nl that check each protocol on its own.

## Why it matters

- **IPv6-only and IPv6-preferred networks are common.** Many mobile carriers hand out only IPv6 addresses and reach IPv4 through a translation layer (NAT64). Native IPv6 skips that layer, and its latency and failure modes.
- **IPv4 addresses are scarce.** Hosts increasingly share IPv4 addresses behind carrier-grade NAT, which makes IPv4 paths slower and harder to debug than direct IPv6 ones.
- **A broken `AAAA` costs time even when it "works".** Every Happy Eyeballs fallback adds a connection delay, typically a few hundred milliseconds, before the first byte.
- **Name servers are a single point of failure.** If every authoritative server is IPv4-only, an IPv6-only resolver cannot resolve any name in your zone, however well your web server is configured.

## How to implement

1. **Check whether your host supports IPv6.** Most CDNs and managed platforms do, often by default. If yours does not, that is a reason to move, not a reason to skip the record.
2. **Publish `AAAA` records** for every name that has an `A` record: the apex, `www`, and any other host name that serves the site.

   ```
   example.com.        300  IN  A     192.0.2.10
   example.com.        300  IN  AAAA  2001:db8::10
   www.example.com.    300  IN  CNAME example.com.
   ```

3. **Make sure the server listens on IPv6.** The web server, the firewall, and any load balancer all need to accept connections on ports 80 and 443 over IPv6, with the same certificate.
4. **Serve the same site on both.** The same content, the same redirects (HTTP to HTTPS, apex to `www` or the reverse), the same security headers. Internet.nl compares the two responses and flags differences.
5. **Use name servers with IPv6.** Managed DNS providers almost all publish `AAAA` records for their name servers; check that yours do, and that at least two of them are reachable over IPv6.
6. **Monitor both protocols separately.** An uptime check that resolves the name normally will happily use IPv4 and miss a dead IPv6 path. Add a check pinned to IPv6. See [monitoring and uptime](/spec/resilience/monitoring-uptime/).

This site ships it: the apex and both of its Cloudflare name servers have `AAAA` records, and the site answers identically over IPv6.

## Common mistakes

- **An `AAAA` record pointing at a host that does not listen on IPv6.** Often left over from a migration, or added by a control panel for a server whose IPv6 firewall drops port 443. Browsers hide it; other clients time out.
- **Different behaviour over IPv6.** An old virtual-host config that serves a default page, skips the HTTPS redirect, or omits HSTS on the IPv6 listener.
- **A certificate that only covers the IPv4 path.** Separate front ends per protocol drift apart, and one ends up with an expired or mismatched certificate.
- **IPv4-only name servers.** The web server is dual stack, but nothing in the delegation can be reached over IPv6.
- **Adding `AAAA` for the apex but not for `www`**, or the reverse, so half the site is reachable.

## Verification

- `dig +short AAAA example.com` and `dig +short AAAA www.example.com` return addresses.
- For each name server in `dig +short NS example.com`, `dig +short AAAA <ns>` returns an address.
- `curl -6 -sI https://example.com/` and `curl -4 -sI https://example.com/` return the same status, redirects, and headers.
- Run the [Internet.nl website test](https://internet.nl/). Its IPv6 section covers name servers, web server addresses and reachability, and whether the IPv6 and IPv4 sites are the same.
