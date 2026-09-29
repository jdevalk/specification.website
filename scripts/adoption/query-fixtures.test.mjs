import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BigQuery } from "@google-cloud/bigquery";
import { buildQuery, buildReport } from "./fetch-adoption.mjs";

const config = JSON.parse(
  readFileSync(new URL("./metrics.json", import.meta.url)),
);
const fixtures = JSON.parse(
  readFileSync(new URL("./fixtures.json", import.meta.url)),
);

// This query reads only inline parameters, never the HTTP Archive table.
// Opt in locally with ADOPTION_TEST_PROJECT; ordinary CI needs no credentials.
test(
  "BigQuery rejects collector false positives and counts valid signals once per origin",
  {
    skip: !process.env.ADOPTION_TEST_PROJECT,
  },
  async () => {
    const allPositive = fixtures.cases.find(
      (fixture) => fixture.name === "all-positive",
    );
    const cases = [...fixtures.cases, allPositive].map((fixture) => ({
      name: fixture.name,
      well_known: JSON.stringify(fixture.well_known),
      robots_txt: JSON.stringify(fixture.robots_txt),
      crawl_date: "2026-09-01",
      client: "desktop",
      is_root_page: true,
      rank: 1000000,
    }));
    const positiveRow = cases.at(-1);
    for (const [name, overrides] of Object.entries({
      "outside-rank": { rank: 1000001 },
      mobile: { client: "mobile" },
      "non-root": { is_root_page: false },
      "other-month": { crawl_date: "2026-08-01" },
    })) {
      cases.push({ ...positiveRow, name, ...overrides });
    }
    const sql = buildQuery(config, "2026-09")
      .replace("SELECT\n", "SELECT root_page AS fixture,\n")
      .replace("`httparchive.crawl.pages`", "fixtures");
    const query = `WITH fixtures AS (
    SELECT name AS root_page, DATE(crawl_date) AS date,
      client, is_root_page, rank,
      STRUCT(PARSE_JSON(well_known) AS well_known,
        PARSE_JSON(robots_txt) AS robots_txt) AS custom_metrics
    FROM UNNEST(@cases)
  ) ${sql} GROUP BY GROUPING SETS ((root_page), ())`;
    assert.doesNotMatch(query, /httparchive\.crawl\.pages/);
    const bigquery = new BigQuery({
      projectId: process.env.ADOPTION_TEST_PROJECT,
    });
    const options = {
      query,
      params: { cases },
      useLegacySql: false,
      location: "US",
      maximumBytesBilled: "10485760",
    };
    const [dryRun] = await bigquery.createQueryJob({
      ...options,
      dryRun: true,
    });
    assert.equal(dryRun.metadata.statistics.totalBytesProcessed, "0");
    const [rows] = await bigquery.query(options);
    assert.equal(rows.length, fixtures.cases.length + 1);
    for (const fixture of fixtures.cases) {
      const row = rows.find((row) => row.fixture === fixture.name);
      assert.ok(row, fixture.name);
      const duplicates = fixture.name === "all-positive" ? 2 : 1;
      assert.equal(Number(row.pages), duplicates, fixture.name);
      assert.equal(Number(row.origins), 1, fixture.name);
      config.metrics.forEach((metric, i) => {
        const expected = fixture.expected.includes(metric.slug) ? 1 : 0;
        assert.equal(
          Number(row[`origins_m${i}`]),
          expected,
          `${fixture.name}: ${metric.slug}`,
        );
        assert.equal(
          Number(row[`pages_m${i}`]),
          expected * duplicates,
          `${fixture.name}: ${metric.slug} pages`,
        );
      });
    }
    const totals = rows.find((row) => row.fixture === null);
    const report = buildReport(config, "2026-09", totals);
    assert.equal(report.origins, fixtures.cases.length);
    assert.equal(report.pages, fixtures.cases.length + 1);
    assert.equal(report.metrics["agentic-resource-discovery"].origins, 4);
    assert.equal(report.metrics["agentic-resource-discovery"].originsPct, 20);
    assert.ok(!("api-catalog" in report.metrics));
  },
);
