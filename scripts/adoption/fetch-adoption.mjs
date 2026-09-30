#!/usr/bin/env node
/**
 * Aggregate top-million desktop root-page metrics from httparchive.crawl.pages.
 * GCP_PROJECT_ID selects the querying project; ADC supplies credentials.
 * ADOPTION_DRY_RUN=1 validates and estimates without executing or writing data.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BigQuery } from "@google-cloud/bigquery";

const here = dirname(fileURLToPath(import.meta.url));
const defaultMaximumBytesBilled = String(112 * 1024 ** 3);

function validateCrawl(crawl) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(crawl)) {
    throw new Error("ADOPTION_CRAWL must be YYYY-MM");
  }
  return crawl;
}

/** Browse one row per partition via the free tabledata.list API, not a query. */
export async function latestCrawl(bigquery, now = new Date()) {
  for (let back = 0; back <= 6; back++) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1),
    );
    const crawl = date.toISOString().slice(0, 7);
    try {
      const [rows] = await bigquery
        .dataset("crawl", { projectId: "httparchive" })
        .table(`pages$${crawl.replace("-", "")}01`)
        .getRows({ maxResults: 1, selectedFields: "date" });
      if (rows.length) return crawl;
    } catch (error) {
      if (error?.code !== 404) throw error;
    }
  }
  throw new Error("no HTTP Archive crawl found in the last 6 months");
}

function sqlString(value) {
  return `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function conditionSql(condition) {
  if (condition.conditions) {
    if (!condition.conditions.length) throw new Error("empty condition group");
    if (condition.combine && !["all", "any"].includes(condition.combine)) {
      throw new Error(`invalid condition combination: ${condition.combine}`);
    }
    return `(${condition.conditions.map(conditionSql).join(condition.combine === "any" ? " OR " : " AND ")})`;
  }
  if (!/^[a-z_]+$/.test(condition.field)) {
    throw new Error(`invalid custom_metrics field: ${condition.field}`);
  }
  const input = `custom_metrics.${condition.field}, ${sqlString(condition.jsonPath)}`;
  if (condition.op === "eq") {
    return `JSON_VALUE(${input}) = ${sqlString(condition.value)}`;
  }
  if (condition.op === "exists") {
    // JSON null is a value for native JSON columns; it is not evidence of a rule.
    return `COALESCE(JSON_TYPE(JSON_QUERY(${input})) != 'null', FALSE)`;
  }
  if (condition.op === "positive") {
    return `SAFE_CAST(JSON_VALUE(${input}) AS FLOAT64) > 0`;
  }
  if (condition.op === "nonempty-array") {
    return `ARRAY_LENGTH(JSON_QUERY_ARRAY(${input})) > 0`;
  }
  throw new Error(`unknown condition op: ${condition.op}`);
}

export function buildQuery(config, crawl) {
  validateCrawl(crawl);
  const selects = config.metrics
    .flatMap((metric, i) => {
      if (!metric.conditions.length)
        throw new Error(`no conditions: ${metric.slug}`);
      const combined = conditionSql(metric);
      return [
        `COUNTIF(${combined}) AS pages_m${i}`,
        `COUNT(DISTINCT IF(${combined}, root_page, NULL)) AS origins_m${i}`,
      ];
    })
    .join(",\n    ");
  return `SELECT
    COUNT(*) AS pages,
    COUNT(DISTINCT root_page) AS origins,
    ${selects}
  FROM \`httparchive.crawl.pages\`
  WHERE date = DATE '${crawl}-01'
    AND client = 'desktop'
    AND is_root_page
    AND rank <= 1000000`;
}

export function buildReport(config, crawl, row) {
  const pagesTotal = Number(row?.pages);
  const originsTotal = Number(row?.origins);
  if (!(pagesTotal > 0) || !(originsTotal > 0)) {
    throw new Error(
      `crawl ${crawl} has no desktop root pages; keeping existing data`,
    );
  }
  const metrics = {};
  config.metrics.forEach((metric, i) => {
    const pages = Number(row[`pages_m${i}`]);
    const origins = Number(row[`origins_m${i}`]);
    metrics[metric.slug] = {
      label: metric.label,
      pages,
      pagesPct: roundPct(pages / pagesTotal),
      origins,
      originsPct: roundPct(origins / originsTotal),
    };
  });
  return {
    crawl,
    generatedAt: new Date().toISOString(),
    source:
      "HTTP Archive monthly crawl (desktop root pages, rank <= 1000000), custom metrics",
    pages: pagesTotal,
    origins: originsTotal,
    metrics,
  };
}

export async function fetchAdoption(bigquery, config, options = {}) {
  const crawl = validateCrawl(options.crawl || (await latestCrawl(bigquery)));
  const maximumBytesBilled =
    options.maximumBytesBilled || defaultMaximumBytesBilled;
  if (!/^[1-9]\d*$/.test(maximumBytesBilled)) {
    throw new Error("ADOPTION_MAX_BYTES_BILLED must be a positive integer");
  }
  const queryOptions = {
    query: buildQuery(config, crawl),
    location: "US",
    useLegacySql: false,
    maximumBytesBilled,
  };
  const [job] = await bigquery.createQueryJob({
    ...queryOptions,
    dryRun: true,
  });
  console.log(
    `crawl ${crawl}: dry run passed; estimated bytes processed: ${job.metadata.statistics?.totalBytesProcessed ?? "unknown"}`,
  );
  if (options.dryRun) return null;

  const [rows] = await bigquery.query(queryOptions);
  return buildReport(config, crawl, rows[0]);
}

async function main() {
  const config = JSON.parse(
    readFileSync(resolve(here, "metrics.json"), "utf8"),
  );
  if (process.env.ADOPTION_PRINT_QUERY === "1") {
    console.log(
      buildQuery(
        config,
        process.env.ADOPTION_CRAWL || new Date().toISOString().slice(0, 7),
      ),
    );
    return;
  }
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId)
    throw new Error(
      "GCP_PROJECT_ID is required (project billed for the query)",
    );
  const report = await fetchAdoption(new BigQuery({ projectId }), config, {
    crawl: process.env.ADOPTION_CRAWL,
    dryRun: process.env.ADOPTION_DRY_RUN === "1",
    maximumBytesBilled: process.env.ADOPTION_MAX_BYTES_BILLED,
  });
  if (!report) return;
  const dest = resolve(here, "../../src/data/adoption.json");
  writeFileSync(dest, JSON.stringify(report, null, 2) + "\n");
  console.log(
    `wrote ${dest} (${config.metrics.length} metrics, crawl ${report.crawl})`,
  );
}

function roundPct(ratio) {
  return Math.round(ratio * 100 * 1000) / 1000;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  });
}
