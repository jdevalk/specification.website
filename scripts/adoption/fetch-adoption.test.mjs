import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  buildQuery,
  buildReport,
  fetchAdoption,
  latestCrawl,
} from "./fetch-adoption.mjs";

const config = JSON.parse(
  readFileSync(new URL("./metrics.json", import.meta.url), "utf8"),
);

test("query uses current JSON fields and keeps HTTP and HTTPS origins distinct", () => {
  const query = buildQuery(config, "2026-09");
  assert.match(query, /FROM `httparchive\.crawl\.pages`/);
  assert.match(query, /date = DATE '2026-09-01'/);
  assert.match(
    query,
    /client = 'desktop'\s+AND is_root_page\s+AND rank <= 1000000/,
  );
  assert.match(
    query,
    /JSON_VALUE\(custom_metrics\.well_known, '\$\."\/\.well-known\/gpc.json"\.found'\)/,
  );
  assert.doesNotMatch(query, /custom_metrics\.other|llms_txt_validation/);
  assert.ok(!config.metrics.some((metric) => metric.slug === "llms-txt"));
  assert.match(query, /COUNT\(DISTINCT root_page\)/);
  assert.doesNotMatch(query, /NET\.HOST|\$\._|JSON_VALUE\(custom_metrics,/);
});

test("native JSON null is not counted as an existing crawler rule", () => {
  assert.match(
    buildQuery(config, "2026-09"),
    /COALESCE\(JSON_TYPE\(JSON_QUERY\(custom_metrics\.robots_txt, .*?\)\) != 'null', FALSE\)/,
  );
});

test("dry run validates but never executes the aggregation or returns publishable data", async () => {
  let calls = 0;
  const bigquery = {
    async createQueryJob(options) {
      calls++;
      assert.equal(options.dryRun, true);
      assert.equal(options.useLegacySql, false);
      assert.equal(options.maximumBytesBilled, "107374182400");
      return [{ metadata: { statistics: { totalBytesProcessed: "123" } } }];
    },
    async query() {
      assert.fail("A dry run must not execute the query");
    },
  };
  assert.equal(
    await fetchAdoption(bigquery, config, { crawl: "2026-09", dryRun: true }),
    null,
  );
  assert.equal(calls, 1);
});

test("crawl discovery skips absent and empty partitions using table previews", async () => {
  const partitions = [];
  const bigquery = {
    dataset() {
      return {
        table(id) {
          partitions.push(id);
          return {
            async getRows(options) {
              assert.deepEqual(options, {
                maxResults: 1,
                selectedFields: "date",
              });
              if (partitions.length === 1)
                throw Object.assign(new Error("missing"), { code: 404 });
              return [partitions.length === 2 ? [] : [{ date: "2026-07-01" }]];
            },
          };
        },
      };
    },
  };
  assert.equal(
    await latestCrawl(bigquery, new Date("2026-09-28T00:00:00Z")),
    "2026-07",
  );
  assert.deepEqual(partitions, [
    "pages$20260901",
    "pages$20260801",
    "pages$20260701",
  ]);
});

test("crawl discovery does not hide permission failures", async () => {
  const denied = Object.assign(new Error("denied"), { code: 403 });
  const bigquery = {
    dataset() {
      return {
        table() {
          return {
            async getRows() {
              throw denied;
            },
          };
        },
      };
    },
  };
  await assert.rejects(latestCrawl(bigquery), (error) => error === denied);
});

test("empty results cannot replace published adoption data", () => {
  assert.throws(
    () => buildReport(config, "2026-09", { pages: 0, origins: 0 }),
    /keeping existing data/,
  );
});

test("offline SQL printing needs neither project configuration nor credentials", () => {
  const env = {
    ...process.env,
    ADOPTION_PRINT_QUERY: "1",
    ADOPTION_CRAWL: "2026-09",
  };
  delete env.GCP_PROJECT_ID;
  const sql = execFileSync(
    process.execPath,
    [new URL("./fetch-adoption.mjs", import.meta.url).pathname],
    { env, encoding: "utf8" },
  );
  assert.match(sql, /httparchive\.crawl\.pages/);
  assert.throws(() => buildQuery(config, "2026-13"), /YYYY-MM/);
});

test("API Catalog is not measured using the unrelated AI Catalog", () => {
  assert.ok(!config.metrics.some((metric) => metric.slug === "api-catalog"));
  const ard = config.metrics.find(
    (metric) => metric.slug === "agentic-resource-discovery",
  );
  const sql = buildQuery({ metrics: [ard] }, "2026-09");
  assert.match(sql, /ai-catalog\.json/);
  assert.match(sql, /ard\.json/);
  assert.match(sql, /entries_count/);
  assert.match(sql, /\) OR \(/);
});

test("uncollected topics cannot be published as zero adoption", () => {
  const report = buildReport(config, "2026-09", {
    pages: 100,
    origins: 100,
    ...Object.fromEntries(
      config.metrics.flatMap((_, i) => [
        [`pages_m${i}`, 0],
        [`origins_m${i}`, 0],
      ]),
    ),
  });
  for (const slug of [
    "api-catalog",
    "nodeinfo",
    "webfinger",
    "oauth-authorization-server",
    "oauth-protected-resource",
    "openid-configuration",
    "traffic-advice",
    "llms-txt",
  ]) {
    assert.ok(!(slug in report.metrics), slug);
  }
});

test("empty or invalid condition groups fail before querying", () => {
  for (const condition of [
    { conditions: [] },
    {
      combine: "none",
      conditions: [{ field: "well_known", jsonPath: "$.x", op: "exists" }],
    },
  ]) {
    assert.throws(
      () =>
        buildQuery(
          { metrics: [{ slug: "bad", conditions: [condition] }] },
          "2026-09",
        ),
      /condition/,
    );
  }
});
