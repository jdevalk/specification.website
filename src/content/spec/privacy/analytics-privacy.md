---
title: "Privacy-respecting analytics"
slug: analytics-privacy
category: privacy
summary: "You can measure traffic without surveilling visitors. Aggregate, cookieless, EU-hosted analytics tools answer most product questions without the consent and transfer problems of ad-tech analytics."
status: recommended
order: 50
appliesTo: [all]
relatedSlugs: [cookie-consent, third-party-scripts, data-minimization, privacy-policy]
updated: "2026-07-09T00:00:00.000Z"
sources:
  - title: "EDPB — 101 complaints concerning EU-U.S. data transfers (Google Analytics)"
    url: "https://edpb.europa.eu/news/news/2022/austrian-dpa-decision-101-complaints-issued_en"
    publisher: "EDPB"
  - title: "CNIL — Use of Google Analytics and data transfers to the United States"
    url: "https://www.cnil.fr/en/use-google-analytics-and-data-transfers-united-states-cnil-orders-website-manageroperator-comply"
    publisher: "CNIL"
  - title: "ICO — Guidance on the use of cookies and similar technologies"
    url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/"
    publisher: "ICO"
---

## What it is

Privacy-respecting analytics measure what visitors do on your site without building a persistent profile of each visitor. The pattern: collect the smallest useful unit of data, aggregate it on the server, drop or hash anything that could identify a person, and keep it out of jurisdictions that introduce transfer problems.

Most product questions — what pages people read, where they came from, where they drop off — can be answered without cookies, fingerprints, or cross-site identifiers.

## Why it matters

Between 2022 and 2023, the Austrian, French, Italian, and Danish data protection authorities ruled that the standard configuration of Google Analytics violated the GDPR because of transfers to the US. The EU–US Data Privacy Framework has changed the legal picture, but regulators still treat ad-tech-grade analytics with scrutiny, and the underlying design problem — every visit shared with a third party that combines it with data from millions of other sites — has not gone away.

There is a more practical reason: a cookieless analytics tool does not require a consent banner under EU rules, because nothing is stored on the user's device. The data you get is also more representative, because nobody opts out.

Cookieless is not the same as GDPR-exempt, and the two are easily confused. Two separate laws apply. The ePrivacy Directive governs storing or reading anything on the device, and going cookieless clears that hurdle, which is why the banner disappears. The GDPR governs the processing of personal data, and it does not disappear: an IP address or a device-derived identifier is still personal data, so you still need a lawful basis, and the minimisation and retention duties below still bind you. Removing the cookie removes the consent prompt, not the obligation to handle the data lawfully.

## How to implement

The pattern is the same across tools:

- **Measure without cookies.** Use a daily-rotating hash of IP + user-agent + a site salt to estimate uniques. Drop the raw IP before it hits disk.
- **Aggregate at write time.** Store counts per page per day, not individual events with timestamps, unless you genuinely need them.
- **Anonymise the IP** at the edge if any IP is kept. The last octet of an IPv4 (or the last 80 bits of an IPv6) is enough to break linkability and still keep country-level geo.
- **Keep data in the relevant jurisdiction.** For EU traffic, that means an EU-hosted analytics endpoint and an EU sub-processor list.
- **Set a short retention.** Ninety days of daily aggregates answers most product questions. Raw events should be even shorter.
- **Document it.** The privacy policy should name the analytics tool, the data collected, the retention period, and the legal basis.

Tools that follow this pattern include **Plausible**, **Fathom**, self-hosted **Matomo** (configured for IP anonymisation and no cookies), and **Cloudflare Web Analytics**. Listed as patterns, not endorsements — the specific tool matters less than the configuration.

If you must use ad-tech-grade analytics for marketing attribution, isolate it behind explicit consent and treat it as a separate system from product analytics.

## Common mistakes

- Treating "we anonymise IPs" as enough while still loading a third-party script that fingerprints the browser.
- Using GA4 with default settings and assuming the EU–US DPF closes the case. The EDPB and national authorities still expect documented assessment.
- Running a "privacy-friendly" analytics tool *and* GA *and* Hotjar. Each one introduces its own consent and transfer questions.
- Keeping raw event logs forever because storage is cheap.
- Forgetting to disclose the analytics tool in the privacy policy.
