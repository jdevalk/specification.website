# HTTP Archive adoption data

Monthly adoption percentages for spec topics, pulled from the HTTP Archive's
custom metrics via BigQuery, limited to desktop root pages ranked in the top
million (`rank <= 1000000`). The percentages describe this sample, not the entire
crawl. The numbers land in `src/data/adoption.json`, and the spec pages render
them automatically.

## One-time setup (Google Cloud)

The HTTP Archive dataset is public, but BigQuery bills the _querying_ project,
so you need a GCP project of your own. Every refresh first validates the query
and estimates bytes processed with a free dry run. Executed aggregations have a
default 112 GiB billing cap; the free tier is shared with other project usage.
BigQuery checks an upper-bound estimate for this clustered table before running
it. The September 2026 query was rejected at 100 GiB but succeeded at 112 GiB,
actually processing 1,634,231,969 bytes (1.522 GiB). The cap is a ceiling, not the
expected scan size; future monthly scans may differ.

1. Create a GCP project and enable the BigQuery API.
2. Create a service account (no keys needed) with the **BigQuery Job User**
   role on the project. That role is enough: it grants `bigquery.jobs.create`
   for billing; the `httparchive` dataset is public.
3. Set up Workload Identity Federation for GitHub Actions (no long-lived
   secrets): create a workload identity pool + OIDC provider trusting
   `https://token.actions.githubusercontent.com`, allow the service account to
   be impersonated by this repo (`attribute.repository = jdevalk/specification.website`).
   The [official guide](https://docs.github.com/en/actions/how-tos/secure-your-work/deployments/oidc-in-gcp)
   walks through it.
4. Set these **repository variables** (Settings → Variables → Actions):
   - `GCP_PROJECT_ID` — your project id
   - `GCP_WIF_PROVIDER` — the full provider resource name
   - `GCP_SERVICE_ACCOUNT` — the service account email

## Running it

- Automatically: `.github/workflows/adoption-monthly.yml` runs on the 18th of
  each month (crawl data lands mid-month) and opens or updates a PR with the
  refreshed `src/data/adoption.json`.
- Manually: `npm run adoption` (needs `GCP_PROJECT_ID` set and Application
  Default Credentials, e.g. via `gcloud auth application-default login`).
- Validate only: `GCP_PROJECT_ID=your-project ADOPTION_DRY_RUN=1 npm run adoption`.
  This performs a BigQuery dry run and prints the estimated bytes. It never runs
  the aggregation or writes `src/data/adoption.json`.
- Select a month explicitly with `ADOPTION_CRAWL=2026-09`; otherwise the script
  browses recent partitions with the free table preview API and selects the
  newest non-empty one. Availability does not establish crawl completeness.
- Print SQL offline: `ADOPTION_PRINT_QUERY=1 npm run adoption`. No project or
  credentials are needed; `ADOPTION_CRAWL` defaults to the current UTC month.
- Override the execution cap with `ADOPTION_MAX_BYTES_BILLED` (a positive number
  of bytes; default `120259084288`).
- The workflow can also be triggered by hand via workflow_dispatch.

The query reads `httparchive.crawl.pages`, restricted to one date, desktop
clients, root pages, and `rank <= 1000000`. It counts distinct `root_page` values,
retaining the scheme and port instead of collapsing different origins to a hostname.

`llms.txt` is excluded because its metric requires reading the large
`custom_metrics.other` JSON column. The nine measured topics use only
`custom_metrics.well_known` and `custom_metrics.robots_txt`.

Run regression checks with `npm run test:adoption` (also run by CI). To verify
SQL behaviour in BigQuery with the recorded collector fixtures, run
`ADOPTION_TEST_PROJECT=your-project npm run test:adoption`. This optional test
reads only inline parameters, asserts a zero-byte dry run before execution, and
never queries HTTP Archive or writes adoption data.

## What the counts mean

These are conservative detection signals, not full conformance checks. A 200
response alone is insufficient: generic HTML and JSON catch-all pages must not
count as adoption.

| Topic                      | Required evidence, in addition to a successful response                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GPC support resource       | The parsed `gpc` declaration is non-null. Both boolean values count as a published declaration; this does not establish that GPC is honoured.                                        |
| security.txt               | The collector's `data.valid` field is true: required fields exist and singleton fields are not repeated. Values and expiry are not fully validated.                                  |
| Asset Links                | A parsed deep-linking or credential-sharing relation is detected.                                                                                                                    |
| Apple App Site Association | Parsed app-link or web-credential configuration is detected.                                                                                                                         |
| Change password            | A followed redirect ends in 200, and the collector's deliberately nonexistent URL returns 404. Failed or missing probes are not positive evidence.                                   |
| WebAuthn related origins   | A non-empty parsed `origins` array. Individual origins are not validated by the collector.                                                                                           |
| ARD                        | At least one parsed entry at either `ai-catalog.json` or `ard.json`. An origin with both counts once. Empty manifests cannot be distinguished from parser defaults and are excluded. |
| robots.txt                 | At least one parsed user-agent or sitemap directive. Empty or comments-only files are excluded.                                                                                      |
| AI crawler rules           | A successful robots.txt response with a parsed group naming one of the configured AI crawlers. This detects a named group, not whether crawling is allowed or disallowed.            |

The [well-known collector](https://github.com/HTTPArchive/custom-metrics/blob/65e46f181eded5e9aeb26b53b88681361093eae4/dist/well-known.js)
and [robots.txt collector](https://github.com/HTTPArchive/custom-metrics/blob/1e9b5f6a8cd3576befcb770f46e210d2b0bfb243/dist/robots_txt.js)
define the stored signals. `fixtures.json` records their outputs for mocked
responses, including generic HTML, redirects, JSON catch-alls, valid documents,
and failed probes. The live SQL test also checks rank, client, date, root-page
filtering, and distinct-origin counts.

The [RFC 9727 API Catalog](https://www.rfc-editor.org/rfc/rfc9727.html) uses
`/.well-known/api-catalog`; it is not the AI Catalog. No corresponding collector
signal exists, so the API Catalog topic is omitted. NodeInfo, WebFinger, OAuth
authorisation-server metadata, OAuth protected-resource metadata, OpenID
Configuration, and Traffic Advice are also omitted while their collector
extension is pending. They must not be reported as zero adoption. Add them only
after reviewing the collected fields and validating their detection rules.

Older crawls may lack newer parser fields (including ARD entry counts); such
responses cannot establish adoption under these rules. The denominator remains
all sampled origins, so percentages describe detected signals in that sample
and may undercount actual implementations.

## Adding a topic

Add an entry to `metrics.json`: the spec page `slug` plus one or more
conditions against a JSON field inside the `custom_metrics` STRUCT. Each
condition supplies `field` (`well_known` or `robots_txt`) and a `jsonPath`
relative to that field. Conditions combine with `all` by default; nested groups
can use `any` for alternative signals. Supported operations are `eq`, `exists`,
`positive`, and `nonempty-array`. Adding another column can substantially increase bytes
processed; check the free dry-run estimate before extending the query. Verify
names against the live table schema and preview data; raw metric names differ
from the stored field names.
Find metric behaviour in the [custom-metrics repo](https://github.com/HTTPArchive/custom-metrics/tree/main/dist).
A missing STRUCT field fails validation, while missing JSON properties produce
no match. Missing collection is not evidence of zero real-world adoption; do
not add placeholder metrics for fields the collector does not yet provide.
