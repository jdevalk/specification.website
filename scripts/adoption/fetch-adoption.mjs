#!/usr/bin/env node
/**
 * Fetches HTTP Archive custom-metric adoption numbers for spec topics and
 * writes them to src/data/adoption.json, which the spec pages render.
 *
 * Reads its metric definitions from ./metrics.json. Each metric becomes one
 * COUNTIF over the latest `httparchive.pages.YYYY_MM_01_desktop` table, so a
 * full refresh is a single BigQuery aggregation query.
 *
 * Auth: Application Default Credentials. Locally that means
 * `gcloud auth application-default login`; in CI the adoption workflow
 * authenticates via Workload Identity Federation. Query billing lands on
 * GCP_PROJECT_ID (the httparchive dataset itself is public).
 *
 * Usage: GCP_PROJECT_ID=your-project node scripts/adoption/fetch-adoption.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BigQuery } from "@google-cloud/bigquery";

const here = dirname(fileURLToPath(import.meta.url));
const projectId = process.env.GCP_PROJECT_ID;
if (!projectId) {
  console.error(
    "error: GCP_PROJECT_ID is required (project billed for the query)",
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(resolve(here, "metrics.json"), "utf8"));
const bigquery = new BigQuery({ projectId });

/** Newest httparchive.pages crawl table that actually exists (data lands mid-month). */
async function latestCrawlTable() {
  const now = new Date();
  for (let back = 0; back <= 6; back++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1),
    );
    const suffix = `${d.getUTCFullYear()}_${String(d.getUTCMonth() + 1).padStart(2, "0")}_01_desktop`;
    try {
      await bigquery.query({
        query: `SELECT 1 FROM \`httparchive.pages.${suffix}\` LIMIT 0`,
        dryRun: false,
      });
      return suffix;
    } catch (error) {
      if (error?.code !== 404) throw error;
    }
  }
  throw new Error(
    "no httparchive.pages crawl table found in the last 6 months",
  );
}

function conditionSql(condition) {
  if (condition.op === "eq") {
    return `JSON_VALUE(custom_metrics, '${condition.jsonPath}') = '${condition.value}'`;
  }
  if (condition.op === "exists") {
    return `JSON_QUERY(custom_metrics, '${condition.jsonPath}') IS NOT NULL`;
  }
  throw new Error(`unknown condition op: ${condition.op}`);
}

function metricSql(metric, index) {
  const parts = metric.conditions.map(conditionSql);
  const combined =
    metric.combine === "all" ? parts.join(" AND ") : parts.join(" OR ");
  return `COUNTIF(${combined}) AS pages_m${index}`;
}

/** Warn when a configured top-level custom-metric key is absent from the crawl. */
async function checkKeys(table, keys) {
  const [rows] = await bigquery.query({
    query: `SELECT custom_metrics FROM \`httparchive.pages.${table}\` LIMIT 1`,
  });
  const parsed = JSON.parse(rows[0]?.custom_metrics ?? "{}");
  const missing = [...new Set(keys)].filter((k) => !(k in parsed));
  for (const key of missing) {
    console.warn(
      `warning: custom metric key "${key}" not present in crawl ${table}; ` +
        `those adoption numbers will read 0. Available keys: ${Object.keys(parsed).slice(0, 12).join(", ")}…`,
    );
  }
}

/** Origins-based COUNTIF needs the host per hit; do it with a second pass over hosts. */
function originsSql(metric, index) {
  const parts = metric.conditions.map(conditionSql);
  const combined =
    metric.combine === "all" ? parts.join(" AND ") : parts.join(" OR ");
  return `COUNT(DISTINCT IF(${combined}, NET.HOST(url), NULL)) AS origins_m${index}`;
}

function buildQuery(table) {
  const selects = config.metrics
    .flatMap((metric, i) => [metricSql(metric, i), originsSql(metric, i)])
    .join(",\n    ");
  return `SELECT
    COUNT(*) AS pages,
    COUNT(DISTINCT NET.HOST(url)) AS origins,
    ${selects}
  FROM \`httparchive.pages.${table}\``;
}

async function main() {
  // Offline mode: print the generated SQL without touching BigQuery.
  if (process.env.ADOPTION_PRINT_QUERY) {
    console.log(buildQuery("2026_09_01_desktop"));
    return;
  }

  const table = await latestCrawlTable();
  const crawl = table.slice(0, 7).replace("_", "-");
  console.log(`using crawl table httparchive.pages.${table}`);

  const topKeys = config.metrics.flatMap((m) =>
    m.conditions.map((c) => c.jsonPath.split(".")[1]),
  );
  await checkKeys(table, topKeys);

  const query = buildQuery(table);
  const [rows] = await bigquery.query({ query });
  const row = rows[0];

  const metrics = {};
  config.metrics.forEach((metric, i) => {
    const pages = Number(row[`pages_m${i}`]);
    const origins = Number(row[`origins_m${i}`]);
    metrics[metric.slug] = {
      label: metric.label,
      pages,
      pagesPct: roundPct(pages / Number(row.pages)),
      origins,
      originsPct: roundPct(origins / Number(row.origins)),
    };
  });

  const out = {
    crawl,
    generatedAt: new Date().toISOString(),
    source: "HTTP Archive monthly crawl (desktop), custom metrics",
    pages: Number(row.pages),
    origins: Number(row.origins),
    metrics,
  };
  const dest = resolve(here, "../../src/data/adoption.json");
  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(
    `wrote ${dest} (${config.metrics.length} metrics, crawl ${crawl})`,
  );
}

function roundPct(ratio) {
  return Math.round(ratio * 100 * 1000) / 1000;
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
