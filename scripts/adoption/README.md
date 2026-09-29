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
default 100 GiB billing cap; the free tier is shared with other project usage.

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
  of bytes; default `107374182400`).
- The workflow can also be triggered by hand via workflow_dispatch.

The query reads `httparchive.crawl.pages`, restricted to one date, desktop
clients, root pages, and `rank <= 1000000`. It counts distinct `root_page` values,
retaining the scheme and port instead of collapsing different origins to a hostname.

`llms.txt` is excluded because its metric requires reading the large
`custom_metrics.other` JSON column. The remaining 16 topics use only
`custom_metrics.well_known` and `custom_metrics.robots_txt`.

Run regression checks with `node --test scripts/adoption/fetch-adoption.test.mjs`.

## Adding a topic

Add an entry to `metrics.json`: the spec page `slug` plus one or more
conditions against a JSON field inside the `custom_metrics` STRUCT. Each
condition supplies `field` (`well_known` or `robots_txt`) and a `jsonPath`
relative to that field. Adding another column can substantially increase bytes
processed; check the free dry-run estimate before extending the query. Verify
names against the live table schema and preview data; raw metric names differ
from the stored field names.
Find metric behaviour in the [custom-metrics repo](https://github.com/HTTPArchive/custom-metrics/tree/main/dist).
A missing STRUCT field fails validation, while missing JSON properties still
produce zero matches. The pending upstream metrics remain unmeasured until a
crawl includes them.
