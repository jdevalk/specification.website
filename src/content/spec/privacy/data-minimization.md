---
title: "Data minimisation"
slug: data-minimization
category: privacy
summary: "Collect only the personal data you actually need for a specific purpose, keep it only as long as you need it, and redact it from anywhere it leaks unnecessarily."
status: recommended
order: 60
appliesTo: [all]
relatedSlugs: [privacy-policy, analytics-privacy, third-party-scripts]
updated: "2026-05-29T09:13:20.000Z"
sources:
  - title: "GDPR Article 5 — Principles relating to processing of personal data"
    url: "https://gdpr-info.eu/art-5-gdpr/"
    publisher: "EU GDPR"
  - title: "ICO — Data minimisation"
    url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/"
    publisher: "ICO"
  - title: "EDPB Guidelines 4/2019 on Article 25 Data Protection by Design and by Default"
    url: "https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en"
    publisher: "EDPB"
---

## What it is

Data minimisation is the principle that personal data must be "adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed" — GDPR Article 5(1)(c). It is one of the foundational principles of EU and UK data protection law, and it is echoed in most modern privacy regimes.

In practice it is a design constraint: do not collect a field unless you have decided in advance what you will do with it.

## Why it matters

Every personal data point you hold is a liability. It can be breached, subpoenaed, misused by an insider, or simply held longer than the law allows. The cheapest way to protect data is not to collect it. The second cheapest is to delete it as soon as you no longer need it.

Minimisation is also the principle regulators reach for when no other rule clearly applies. If a form collects a date of birth and the service has no age requirement, no insurance product, and no birthday email, that field is hard to justify — even if the user typed it in voluntarily.

## How to implement

Apply minimisation at four points: collection, storage, logging, and retention.

**Collection.** Walk through every form and every API. For each field, name the purpose. Drop anything that fails the test.

- A newsletter signup needs an email address. It does not need a name, a phone number, or a job title.
- A contact form needs a way to reply. If you reply by email, you do not need a phone number.
- A delivery address is necessary to deliver a physical product. It is not necessary to download a PDF.
- Use a country dropdown instead of asking for a full address when only country matters for tax or compliance.

**Storage.** Separate identifiers from behavioural data where you can. Hash or tokenise where the raw value is not needed for the operation. For free-text fields, expect users to paste in personal data and plan accordingly.

**Logging.** Logs are the most common place where minimisation quietly fails. A request log that records full URLs will capture query-string tokens, search terms, and form data submitted over GET. Redact known sensitive fields, truncate URLs at the path, and never log request bodies in plain text in production.

**Retention.** Set a maximum retention period for each category of data and enforce it with a scheduled job, not a wiki page. Build deletion into the system from the start; retrofitting it after a request from a regulator is painful.

## Common mistakes

- Treating "we might want this later" as a purpose.
- Asking for a phone number "in case we need to call" when you never call.
- Storing IP addresses in analytics or logs indefinitely.
- Logging request bodies, including login payloads, in production.
- A retention policy in the privacy notice that no system enforces.
- Forgetting that backups age out on their own schedule — deletion needs to flow through to them too.
