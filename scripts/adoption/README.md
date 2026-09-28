# HTTP Archive adoption data

Monthly adoption percentages for spec topics, pulled from the HTTP Archive's
custom metrics via BigQuery. The numbers land in `src/data/adoption.json` and
the spec pages render them automatically.

## One-time setup (Google Cloud)

The HTTP Archive dataset is public, but BigQuery bills the _querying_ project,
so you need a small GCP project of your own. One aggregation query per month
fits comfortably inside the 1 TiB/month free tier.

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
- The workflow can also be triggered by hand via workflow_dispatch.

## Adding a topic

Add an entry to `metrics.json`: the spec page `slug` plus one or more
conditions against the `custom_metrics` JSON column. Find the exact key and
field shapes in the [custom-metrics repo](https://github.com/HTTPArchive/custom-metrics/tree/main/dist).
The script warns when a configured top-level key is missing from the crawl, so
a typo surfaces on the first run instead of silently reading 0.
