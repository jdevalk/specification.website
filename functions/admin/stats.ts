// Dashboard for crawler traffic and MCP / A2A usage.
//
// Two data sources, both Cloudflare Analytics Engine datasets:
//   sw_agent_log — AI/search crawler hits, written by functions/_shared/bot-detect.ts
//   sw_mcp_log   — calls to the mcp.specification.website Worker, written by mcp/src/index.ts
//
// Access to /admin/* is gated by Cloudflare Access at the edge, so this
// function assumes the caller is already authenticated. It queries the
// Analytics Engine SQL API with a token stored as a Pages secret.

type Env = {
  CF_ACCOUNT_ID?: string;
  CF_ANALYTICS_TOKEN?: string;
};

const AGENT = "sw_agent_log";
const MCP = "sw_mcp_log";
const REPORT = "sw_report_log";

// Deprecation/intervention reports fire for any in-page script, including
// browser-extension content scripts. functions/reports.ts now drops those at
// write time, but Analytics Engine is append-only — historical extension noise
// lingers until it ages out of retention. Exclude it from every report query
// the same way the collector does: keep a deprecation/intervention row only
// when its sourceFile (blob4) is served from this site. CSP / COOP / COEP /
// crash rows are unaffected.
const REPORT_FIRST_PARTY =
  "NOT (index1 IN ('deprecation','intervention') " +
  "AND blob4 NOT LIKE 'https://specification.website/%' " +
  "AND blob4 NOT LIKE 'https://specification-website.pages.dev/%')";

interface AeRow {
  [key: string]: string | number | null;
}

interface AeResult {
  data?: AeRow[];
  meta?: unknown;
  rows?: number;
}

interface QueryErrors {
  [key: string]: string;
}

interface QueryResults {
  [key: string]: AeResult;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_ANALYTICS_TOKEN;
  if (!accountId || !token) {
    return text("Missing CF_ACCOUNT_ID or CF_ANALYTICS_TOKEN env vars.", 500);
  }

  const queries: Record<string, string> = {
    // --- Crawlers ---------------------------------------------------------
    agent_hourly: `
      SELECT toStartOfHour(timestamp) AS hour, index1 AS bot, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '1' DAY
      GROUP BY hour, bot
      ORDER BY hour ASC
    `,
    agent_daily: `
      SELECT toStartOfDay(timestamp) AS day, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '14' DAY
      GROUP BY day ORDER BY day ASC
    `,
    agent_top24h: `
      SELECT index1 AS bot, blob10 AS mime, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '1' DAY
      GROUP BY bot, mime ORDER BY count DESC LIMIT 50
    `,
    agent_top7d: `
      SELECT index1 AS bot, blob10 AS mime, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY bot, mime ORDER BY count DESC LIMIT 50
    `,
    agent_top30d: `
      SELECT index1 AS bot, blob10 AS mime, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '30' DAY
      GROUP BY bot, mime ORDER BY count DESC LIMIT 50
    `,
    agent_sources: `
      SELECT blob9 AS source, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY source ORDER BY count DESC
    `,
    agent_topPaths: `
      SELECT index1 AS bot, blob4 AS path, blob10 AS mime, SUM(_sample_interval) AS count
      FROM ${AGENT}
      WHERE timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY bot, path, mime ORDER BY count DESC LIMIT 200
    `,
    // --- MCP / A2A --------------------------------------------------------
    mcp_hourly: `
      SELECT toStartOfHour(timestamp) AS hour, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE timestamp > NOW() - INTERVAL '1' DAY
      GROUP BY hour ORDER BY hour ASC
    `,
    mcp_tools24h: `
      SELECT blob2 AS tool, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE blob1 = 'tools/call' AND timestamp > NOW() - INTERVAL '1' DAY
      GROUP BY tool ORDER BY count DESC LIMIT 50
    `,
    mcp_tools7d: `
      SELECT blob2 AS tool, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE blob1 = 'tools/call' AND timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY tool ORDER BY count DESC LIMIT 50
    `,
    mcp_methods: `
      SELECT blob1 AS method, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY method ORDER BY count DESC
    `,
    mcp_clients: `
      SELECT blob4 AS client, blob5 AS version, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE blob1 = 'initialize' AND timestamp > NOW() - INTERVAL '30' DAY
      GROUP BY client, version ORDER BY count DESC LIMIT 50
    `,
    mcp_protocols: `
      SELECT blob6 AS protocol, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE timestamp > NOW() - INTERVAL '30' DAY
      GROUP BY protocol ORDER BY count DESC
    `,
    mcp_surfaces: `
      SELECT blob10 AS surface, SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY surface ORDER BY count DESC
    `,
    mcp_errors: `
      SELECT SUM(_sample_interval) AS count
      FROM ${MCP}
      WHERE blob1 = 'tools/call' AND blob9 = '1'
        AND timestamp > NOW() - INTERVAL '7' DAY
    `,
    mcp_recent: `
      SELECT timestamp AS time, blob10 AS surface, blob1 AS method, blob2 AS tool, blob3 AS args, blob9 AS error
      FROM ${MCP}
      WHERE timestamp > NOW() - INTERVAL '30' DAY
      ORDER BY time DESC LIMIT 100
    `,
    // --- Browser policy reports (Reporting API) ---------------------------
    report_hourly: `
      SELECT toStartOfHour(timestamp) AS hour, SUM(_sample_interval) AS count
      FROM ${REPORT}
      WHERE ${REPORT_FIRST_PARTY} AND timestamp > NOW() - INTERVAL '1' DAY
      GROUP BY hour ORDER BY hour ASC
    `,
    report_types24h: `
      SELECT index1 AS type, SUM(_sample_interval) AS count
      FROM ${REPORT}
      WHERE ${REPORT_FIRST_PARTY} AND timestamp > NOW() - INTERVAL '1' DAY
      GROUP BY type ORDER BY count DESC LIMIT 50
    `,
    report_types7d: `
      SELECT index1 AS type, SUM(_sample_interval) AS count
      FROM ${REPORT}
      WHERE ${REPORT_FIRST_PARTY} AND timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY type ORDER BY count DESC LIMIT 50
    `,
    report_directives7d: `
      SELECT blob3 AS directive, SUM(_sample_interval) AS count
      FROM ${REPORT}
      WHERE ${REPORT_FIRST_PARTY} AND blob3 != '' AND timestamp > NOW() - INTERVAL '7' DAY
      GROUP BY directive ORDER BY count DESC LIMIT 50
    `,
    report_recent: `
      SELECT timestamp AS time, index1 AS type, blob2 AS path, blob3 AS directive, blob4 AS blocked, blob5 AS disposition, blob6 AS detail
      FROM ${REPORT}
      WHERE ${REPORT_FIRST_PARTY} AND timestamp > NOW() - INTERVAL '30' DAY
      ORDER BY time DESC LIMIT 100
    `,
  };

  const results: QueryResults = {};
  const errors: QueryErrors = {};
  await Promise.all(
    Object.entries(queries).map(async ([key, sql]) => {
      try {
        results[key] = await queryAE(accountId, token, sql);
      } catch (e) {
        errors[key] = (e as Error).message;
      }
    }),
  );

  return new Response(renderDashboard(results, errors), {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
};

async function queryAE(
  accountId: string,
  token: string,
  sql: string,
): Promise<AeResult> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: sql,
    },
  );
  if (!res.ok) {
    throw new Error(`${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as AeResult;
}

function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}

// --- Formatting helpers ---------------------------------------------------

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtNum(n: unknown): string {
  return new Intl.NumberFormat("en-US").format(Number(n) || 0);
}

function rowsOrEmpty(result: AeResult | undefined): AeRow[] {
  return result && result.data ? result.data : [];
}

function firstCount(result: AeResult | undefined): number {
  const rows = rowsOrEmpty(result);
  return rows.length === 0 ? 0 : Number(rows[0].count) || 0;
}

function sumCounts(result: AeResult | undefined): number {
  return rowsOrEmpty(result).reduce((s, r) => s + (Number(r.count) || 0), 0);
}

type CellFormatter = (v: unknown) => string;

interface TableOptions {
  numeric?: string[];
  formatters?: Record<string, CellFormatter>;
}

// Renders a table. `numeric` lists headers whose cells are right-aligned
// numbers; `formatters` maps a header to a cell renderer.
function renderTable(
  headers: string[],
  rows: AeRow[],
  opts: TableOptions = {},
): string {
  if (rows.length === 0) return `<p class="empty">No data yet.</p>`;
  const numeric = opts.numeric ?? [];
  const formatters = opts.formatters ?? {};
  const head = headers
    .map(
      (h) => `<th${numeric.includes(h) ? ' class="num"' : ""}>${esc(h)}</th>`,
    )
    .join("");
  const body = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const key = h.toLowerCase().replace(/\s+/g, "_");
          const val = row[h] ?? row[key] ?? row[h.toLowerCase()];
          const fmt: CellFormatter = formatters[h] || ((v) => esc(v));
          return `<td${numeric.includes(h) ? ' class="num"' : ""}>${fmt(val)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const countCol: TableOptions = {
  numeric: ["count"],
  formatters: { count: (v) => fmtNum(v) },
};

// blob10 was '1' | '' before the schema change; new rows write 'markdown' | 'html'.
// Coalesce so old and new rows render the same label during the overlap window.
function fmtMime(v: unknown): string {
  const s = String(v ?? "");
  if (s === "markdown" || s === "1") return "markdown";
  if (s === "html" || s === "") return "html";
  return esc(s);
}

const botMimeCountCols: TableOptions = {
  numeric: ["count"],
  formatters: { mime: fmtMime, count: (v) => fmtNum(v) },
};

// Stable-ish palette for the stacked hourly chart. First N keys by volume get
// a colour; the rest fold into 'other' (gray).
const PALETTE = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#a855f7",
];
const OTHER_COLOUR = "#64748b";

// Stacked horizontal bars: one bar per hour, segmented by key (bot).
function renderHourlyStacked(rows: AeRow[]): string {
  if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

  const byHour = new Map<string, Array<{ key: string; count: number }>>();
  const totals = new Map<string, number>();
  for (const r of rows) {
    const hour = String(r.hour);
    const key = String(r.bot || "unknown");
    const count = Number(r.count) || 0;
    if (!byHour.has(hour)) byHour.set(hour, []);
    byHour.get(hour)!.push({ key, count });
    totals.set(key, (totals.get(key) || 0) + count);
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const topKeys = sorted.slice(0, PALETTE.length).map(([name]) => name);
  const topIndex = new Map(topKeys.map((name, i) => [name, i] as const));
  const colourFor = (k: string) =>
    topIndex.has(k) ? PALETTE[topIndex.get(k)!] : OTHER_COLOUR;

  const hours = [...byHour.entries()]
    .map(([hour, entries]) => ({
      hour,
      total: entries.reduce((s, e) => s + e.count, 0),
      entries,
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
  const max = Math.max(...hours.map((h) => h.total), 0);

  const bars = hours
    .map(({ hour, total, entries }) => {
      const widthPct = max > 0 ? (total / max) * 100 : 0;
      const segs = entries
        .slice()
        .sort((a, b) => {
          const ai = topIndex.has(a.key) ? topIndex.get(a.key)! : Infinity;
          const bi = topIndex.has(b.key) ? topIndex.get(b.key)! : Infinity;
          return ai !== bi ? ai - bi : b.count - a.count;
        })
        .map(({ key, count }) => {
          const segPct = total > 0 ? (count / total) * 100 : 0;
          return `<span class="bar-seg" style="width:${segPct.toFixed(2)}%;background:${colourFor(key)}" title="${esc(key)}: ${fmtNum(count)}"></span>`;
        })
        .join("");
      // ClickHouse returns "YYYY-MM-DD HH:MM:SS" (no T, no Z) — normalise to UTC.
      const label =
        new Date(hour.replace(" ", "T") + "Z").toISOString().slice(11, 16) +
        " UTC";
      return `<div class="bar-row"><span class="bar-label">${esc(label)}</span><span class="bar"><span class="bar-stack" style="width:${widthPct.toFixed(2)}%">${segs}</span></span><span class="bar-count">${fmtNum(total)}</span></div>`;
    })
    .join("");

  const legendEntries = topKeys.map((name) => ({
    name,
    total: totals.get(name)!,
    colour: colourFor(name),
  }));
  const otherKeys = sorted.slice(PALETTE.length);
  if (otherKeys.length > 0) {
    legendEntries.push({
      name: `other (${otherKeys.length})`,
      total: otherKeys.reduce((s, [, t]) => s + t, 0),
      colour: OTHER_COLOUR,
    });
  }
  const legend = legendEntries
    .map(
      (e) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${e.colour}"></span>${esc(e.name)} <span class="legend-count">${fmtNum(e.total)}</span></span>`,
    )
    .join("");

  return `<div class="bars">${bars}</div><div class="legend">${legend}</div>`;
}

// Single-line chart: total per hour across 24 contiguous UTC hours.
function renderHourLineChart(
  rows: AeRow[],
  colour: string,
  ariaLabel: string,
): string {
  if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

  const totals = new Map<string, number>();
  for (const r of rows) {
    const k = String(r.hour);
    totals.set(k, (totals.get(k) || 0) + (Number(r.count) || 0));
  }

  const lastHour = new Date();
  lastHour.setUTCMinutes(0, 0, 0);
  const grid: Array<{ time: Date; value: number }> = [];
  for (let i = 23; i >= 0; i--) {
    const t = new Date(lastHour);
    t.setUTCHours(t.getUTCHours() - i);
    const key = t.toISOString().slice(0, 19).replace("T", " ");
    grid.push({ time: t, value: totals.get(key) || 0 });
  }

  const max = Math.max(...grid.map((p) => p.value), 1);
  const W = 600,
    H = 200,
    padL = 40,
    padR = 8,
    padT = 12,
    padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xFor = (i: number) => padL + (plotW * i) / Math.max(1, grid.length - 1);
  const yFor = (v: number) => padT + plotH - (plotH * v) / max;

  const linePts = grid
    .map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)}`)
    .join(" ");

  const yTicks = max <= 4 ? [0, max] : [0, Math.round(max / 2), max];
  const gridLines = yTicks
    .map(
      (v) =>
        `<line x1="${padL}" x2="${W - padR}" y1="${yFor(v).toFixed(1)}" y2="${yFor(v).toFixed(1)}" stroke="#1c2025" />` +
        `<text x="${padL - 6}" y="${(yFor(v) + 3).toFixed(1)}" text-anchor="end" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${fmtNum(v)}</text>`,
    )
    .join("");

  const xLabels = grid
    .map((p, i) => ({ i, t: p.time }))
    .filter(({ i }) => i % 4 === 0 || i === grid.length - 1)
    .map(
      ({ i, t }) =>
        `<text x="${xFor(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${t.toISOString().slice(11, 13)}</text>`,
    )
    .join("");

  const dots = grid
    .map(
      (p, i) =>
        `<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="2.5" fill="${colour}"><title>${esc(p.time.toISOString().slice(0, 16))} UTC: ${fmtNum(p.value)}</title></circle>`,
    )
    .join("");

  return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(ariaLabel)}">${gridLines}<polyline points="${linePts}" fill="none" stroke="${colour}" stroke-width="1.5" stroke-linejoin="round" />${dots}${xLabels}</svg>`;
}

// Daily counterpart of renderHourLineChart: a 14-day line, one point per UTC
// day. Rows are { day, count } from a toStartOfDay() query.
function renderDayLineChart(
  rows: AeRow[],
  colour: string,
  ariaLabel: string,
): string {
  if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

  const totals = new Map<string, number>();
  for (const r of rows) {
    const k = String(r.day);
    totals.set(k, (totals.get(k) || 0) + (Number(r.count) || 0));
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const grid: Array<{ time: Date; value: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const t = new Date(today);
    t.setUTCDate(t.getUTCDate() - i);
    const key = t.toISOString().slice(0, 19).replace("T", " ");
    grid.push({ time: t, value: totals.get(key) || 0 });
  }

  const max = Math.max(...grid.map((p) => p.value), 1);
  const W = 600,
    H = 200,
    padL = 40,
    padR = 8,
    padT = 12,
    padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xFor = (i: number) => padL + (plotW * i) / Math.max(1, grid.length - 1);
  const yFor = (v: number) => padT + plotH - (plotH * v) / max;

  const linePts = grid
    .map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)}`)
    .join(" ");

  const yTicks = max <= 4 ? [0, max] : [0, Math.round(max / 2), max];
  const gridLines = yTicks
    .map(
      (v) =>
        `<line x1="${padL}" x2="${W - padR}" y1="${yFor(v).toFixed(1)}" y2="${yFor(v).toFixed(1)}" stroke="#1c2025" />` +
        `<text x="${padL - 6}" y="${(yFor(v) + 3).toFixed(1)}" text-anchor="end" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${fmtNum(v)}</text>`,
    )
    .join("");

  const xLabels = grid
    .map((p, i) => ({ i, t: p.time }))
    .filter(({ i }) => i % 2 === 0 || i === grid.length - 1)
    .map(
      ({ i, t }) =>
        `<text x="${xFor(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${t.toISOString().slice(5, 10)}</text>`,
    )
    .join("");

  const dots = grid
    .map(
      (p, i) =>
        `<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="2.5" fill="${colour}"><title>${esc(p.time.toISOString().slice(0, 10))} UTC: ${fmtNum(p.value)}</title></circle>`,
    )
    .join("");

  return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(ariaLabel)}">${gridLines}<polyline points="${linePts}" fill="none" stroke="${colour}" stroke-width="1.5" stroke-linejoin="round" />${dots}${xLabels}</svg>`;
}

function statCard(label: string, value: number): string {
  return `<div class="stat"><span class="stat-num">${fmtNum(value)}</span><span class="stat-label">${esc(label)}</span></div>`;
}

// --- Page render ----------------------------------------------------------

function renderDashboard(results: QueryResults, errors: QueryErrors): string {
  const errorBlock =
    Object.keys(errors).length === 0
      ? ""
      : `<div class="errors"><h3>Query errors</h3><p class="errors-note">A "table not found" error is expected until the matching dataset has received its first write.</p><pre>${esc(JSON.stringify(errors, null, 2))}</pre></div>`;

  const crawlerBots = new Set(
    rowsOrEmpty(results.agent_topPaths)
      .map((r) => String(r.bot || ""))
      .filter(Boolean),
  );
  const mcpTools = new Set(
    rowsOrEmpty(results.mcp_recent)
      .map((r) => String(r.tool || ""))
      .filter(Boolean),
  );
  const mcpSurfaces = new Set(
    rowsOrEmpty(results.mcp_surfaces)
      .map((r) => String(r.surface || ""))
      .filter(Boolean),
  );
  const reportTypes = new Set(
    rowsOrEmpty(results.report_recent)
      .map((r) => String(r.type || ""))
      .filter(Boolean),
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Stats — admin</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0b0d10; color:#e6e6e6; margin:0; padding:2rem; max-width:1100px; margin-inline:auto; }
    h1 { font-size:1.4rem; margin:0 0 .25rem; }
    h2 { font-size:1.05rem; margin:2rem 0 .75rem; color:#9bb; border-bottom:1px solid #233; padding-bottom:.25rem; }
    .sub { color:#777; margin-bottom:1.5rem; font-size:.85rem; }
    table { width:100%; border-collapse:collapse; font-size:.85rem; }
    th, td { text-align:left; padding:.4rem .6rem; border-bottom:1px solid #1c2025; }
    th { color:#9bb; font-weight:normal; text-transform:uppercase; font-size:.7rem; letter-spacing:.05em; }
    td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; }
    .cols { display:grid; grid-template-columns:1fr 1fr; gap:2rem; }
    @media (max-width:800px) { .cols { grid-template-columns:1fr; } }
    .empty { color:#666; font-style:italic; font-size:.85rem; }
    .bars { display:flex; flex-direction:column; gap:.15rem; }
    .bar-row { display:grid; grid-template-columns:6em 1fr 5em; gap:.5rem; align-items:center; font-size:.75rem; }
    .bar-label { color:#9bb; }
    .bar { background:#1c2025; height:1rem; border-radius:2px; overflow:hidden; }
    .bar-stack { display:flex; height:100%; }
    .bar-seg { display:block; height:100%; }
    .bar-count { text-align:right; color:#bbb; font-variant-numeric:tabular-nums; }
    .legend { display:flex; flex-wrap:wrap; gap:.5rem 1rem; margin-top:.75rem; font-size:.75rem; }
    .legend-item { display:inline-flex; align-items:center; gap:.4rem; color:#bbd; }
    .legend-swatch { display:inline-block; width:.7rem; height:.7rem; border-radius:2px; }
    .legend-count { color:#888; font-variant-numeric:tabular-nums; }
    .filter-row { display:flex; gap:.5rem; align-items:center; margin:0 0 .75rem; flex-wrap:wrap; }
    .filter-row input, .filter-row select { padding:.35rem .6rem; border:1px solid #1c2025; border-radius:3px; background:#0b0d10; color:#e6e6e6; font:inherit; font-size:.8rem; min-width:12rem; }
    .filter-row input:focus, .filter-row select:focus { outline:none; border-color:#3b82f6; }
    .filter-stats { color:#888; font-size:.75rem; }
    .errors { background:#2a1010; border:1px solid #5a2020; padding:1rem; border-radius:4px; margin:1.5rem 0; }
    .errors h3 { margin:0 0 .25rem; font-size:.9rem; }
    .errors-note { color:#caa; font-size:.75rem; margin:0 0 .5rem; }
    .errors pre { white-space:pre-wrap; word-break:break-word; font-size:.72rem; color:#fbb; margin:0; }
    .path, .args { color:#bbd; word-break:break-all; }
    .line-chart { width:100%; height:auto; max-height:220px; display:block; }
    .panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:1rem; border-bottom:1px solid #233; padding-bottom:.25rem; margin:2rem 0 .75rem; }
    .panel-head h2.panel-title { border:none; margin:0; padding:0; font-size:1.05rem; color:#9bb; text-transform:none; letter-spacing:0; }
    .tabs { display:inline-flex; gap:.25rem; }
    .tab { background:transparent; color:#9bb; border:1px solid #1c2025; padding:.2rem .55rem; border-radius:3px; font:inherit; font-size:.7rem; cursor:pointer; }
    .tab:hover { background:#1c2025; }
    .tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
    .section-nav { display:flex; gap:.4rem; margin:0 0 1rem; }
    .section-nav .tab { font-size:.85rem; padding:.4rem 1rem; }
    .stats-row { display:flex; flex-wrap:wrap; gap:1rem; margin:0 0 .5rem; }
    .stat { background:#11141a; border:1px solid #1c2025; border-radius:4px; padding:.6rem 1rem; min-width:7rem; }
    .stat-num { display:block; font-size:1.3rem; font-variant-numeric:tabular-nums; }
    .stat-label { display:block; color:#9bb; font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; margin-top:.15rem; }
    .err-flag { color:#f87171; }
  </style>
</head>
<body>
  <h1>Stats</h1>
  <p class="sub">All times UTC. Counts are Analytics Engine sample-adjusted totals.</p>

  ${errorBlock}

  <div class="section-nav tabs" data-tabs="sections">
    <button type="button" class="tab active" data-tab="section-crawlers">Crawlers</button>
    <button type="button" class="tab" data-tab="section-mcp">MCP / A2A usage</button>
    <button type="button" class="tab" data-tab="section-reports">Browser reports</button>
  </div>

  <div id="section-crawlers" class="tab-pane">
    <div class="stats-row">
      ${statCard("Crawls 24h", sumCounts(results.agent_top24h))}
      ${statCard("Crawls 7d", sumCounts(results.agent_top7d))}
      ${statCard("Distinct bots 7d", rowsOrEmpty(results.agent_top7d).length)}
    </div>

    <div class="cols">
      <div>
        <h2>Crawls per hour — last 24h</h2>
        ${renderHourLineChart(rowsOrEmpty(results.agent_hourly), "#3b82f6", "Crawls per hour, last 24h")}
        <h2>Crawls per day — last 14d</h2>
        ${renderDayLineChart(rowsOrEmpty(results.agent_daily), "#3b82f6", "Crawls per day, last 14d")}
      </div>
      <div>
        <div class="panel-head">
          <h2 class="panel-title">Top bots</h2>
          <div class="tabs" data-tabs="agent-top">
            <button type="button" class="tab active" data-tab="bots-24h">24h</button>
            <button type="button" class="tab" data-tab="bots-7d">7d</button>
            <button type="button" class="tab" data-tab="bots-30d">30d</button>
          </div>
        </div>
        <div id="bots-24h" class="tab-pane">${renderTable(["bot", "mime", "count"], rowsOrEmpty(results.agent_top24h), botMimeCountCols)}</div>
        <div id="bots-7d" class="tab-pane" hidden>${renderTable(["bot", "mime", "count"], rowsOrEmpty(results.agent_top7d), botMimeCountCols)}</div>
        <div id="bots-30d" class="tab-pane" hidden>${renderTable(["bot", "mime", "count"], rowsOrEmpty(results.agent_top30d), botMimeCountCols)}</div>
      </div>
    </div>

    <h2>Detection source — last 7d</h2>
    ${renderTable(["source", "count"], rowsOrEmpty(results.agent_sources), countCol)}

    <h2>Requests per hour — last 24h</h2>
    ${renderHourlyStacked(rowsOrEmpty(results.agent_hourly))}

    <h2>Top paths per bot — last 7d</h2>
    <div class="filter-row" data-filter-for="agent-paths-table">
      <select data-col="0">
        <option value="">All bots</option>
        ${[...crawlerBots]
          .sort((a, b) => a.localeCompare(b))
          .map((b) => `<option value="${esc(b)}">${esc(b)}</option>`)
          .join("")}
      </select>
      <input type="search" data-col="1" placeholder="Filter path…" autocomplete="off" spellcheck="false">
      <span class="filter-stats" data-filter-stats></span>
    </div>
    <div id="agent-paths-table">
      ${renderTable(
        ["bot", "path", "mime", "count"],
        rowsOrEmpty(results.agent_topPaths),
        {
          numeric: ["count"],
          formatters: {
            path: (v) => `<span class="path">${esc(v)}</span>`,
            mime: fmtMime,
            count: (v) => fmtNum(v),
          },
        },
      )}
    </div>
  </div>

  <div id="section-mcp" class="tab-pane" hidden>
    <div class="stats-row">
      ${statCard("Calls 24h", sumCounts(results.mcp_hourly))}
      ${statCard("Tool calls 7d", sumCounts(results.mcp_tools7d))}
      ${statCard("Errors 7d", firstCount(results.mcp_errors))}
    </div>

    <div class="cols">
      <div>
        <h2>Calls per hour — last 24h</h2>
        ${renderHourLineChart(rowsOrEmpty(results.mcp_hourly), "#10b981", "MCP/A2A calls per hour, last 24h")}
      </div>
      <div>
        <div class="panel-head">
          <h2 class="panel-title">Top tools</h2>
          <div class="tabs" data-tabs="mcp-top">
            <button type="button" class="tab active" data-tab="tools-24h">24h</button>
            <button type="button" class="tab" data-tab="tools-7d">7d</button>
          </div>
        </div>
        <div id="tools-24h" class="tab-pane">${renderTable(["tool", "count"], rowsOrEmpty(results.mcp_tools24h), countCol)}</div>
        <div id="tools-7d" class="tab-pane" hidden>${renderTable(["tool", "count"], rowsOrEmpty(results.mcp_tools7d), countCol)}</div>
      </div>
    </div>

    <div class="cols">
      <div>
        <h2>Methods — last 7d</h2>
        ${renderTable(["method", "count"], rowsOrEmpty(results.mcp_methods), countCol)}
      </div>
      <div>
        <h2>Surfaces — last 7d</h2>
        ${renderTable(
          ["surface", "count"],
          rowsOrEmpty(results.mcp_surfaces).map((r) => ({
            surface: r.surface || "remote",
            count: r.count,
          })),
          countCol,
        )}
      </div>
    </div>

    <div class="cols">
      <div>
        <h2>Protocol versions — last 30d</h2>
        ${renderTable(
          ["protocol", "count"],
          rowsOrEmpty(results.mcp_protocols).map((r) => ({
            protocol: r.protocol || "(none)",
            count: r.count,
          })),
          countCol,
        )}
      </div>
      <div>
        <h2>Clients — last 30d</h2>
        ${renderTable(
          ["client", "version", "count"],
          rowsOrEmpty(results.mcp_clients).map((r) => ({
            client: r.client || "(unknown)",
            version: r.version || "",
            count: r.count,
          })),
          countCol,
        )}
      </div>
    </div>

    <h2>Recent calls — last 30d</h2>
    <div class="filter-row" data-filter-for="mcp-recent-table">
      <select data-col="1">
        <option value="">All surfaces</option>
        ${[...mcpSurfaces]
          .sort((a, b) => a.localeCompare(b))
          .map((s) => `<option value="${esc(s)}">${esc(s)}</option>`)
          .join("")}
      </select>
      <select data-col="3">
        <option value="">All tools</option>
        ${[...mcpTools]
          .sort((a, b) => a.localeCompare(b))
          .map((t) => `<option value="${esc(t)}">${esc(t)}</option>`)
          .join("")}
      </select>
      <input type="search" data-col="4" placeholder="Filter arguments…" autocomplete="off" spellcheck="false">
      <span class="filter-stats" data-filter-stats></span>
    </div>
    <div id="mcp-recent-table">
      ${renderTable(
        ["time", "surface", "method", "tool", "args", "error"],
        rowsOrEmpty(results.mcp_recent),
        {
          formatters: {
            time: (v) => esc(String(v).slice(5, 16)),
            surface: (v) => esc(v || "remote"),
            args: (v) => `<span class="args">${esc(v)}</span>`,
            error: (v) =>
              v === "1"
                ? '<span class="err-flag" title="returned an error">error</span>'
                : "",
          },
        },
      )}
    </div>
  </div>

  <div id="section-reports" class="tab-pane" hidden>
    <div class="stats-row">
      ${statCard("Reports 24h", sumCounts(results.report_types24h))}
      ${statCard("Reports 7d", sumCounts(results.report_types7d))}
      ${statCard("Distinct types 7d", rowsOrEmpty(results.report_types7d).length)}
    </div>

    <div class="cols">
      <div>
        <h2>Reports per hour — last 24h</h2>
        ${renderHourLineChart(rowsOrEmpty(results.report_hourly), "#f59e0b", "Browser policy reports per hour, last 24h")}
      </div>
      <div>
        <h2>Report types — last 7d</h2>
        ${renderTable(["type", "count"], rowsOrEmpty(results.report_types7d), countCol)}
      </div>
    </div>

    <h2>Top CSP directives — last 7d</h2>
    ${renderTable(["directive", "count"], rowsOrEmpty(results.report_directives7d), countCol)}

    <h2>Recent reports — last 30d</h2>
    <div class="filter-row" data-filter-for="report-recent-table">
      <select data-col="1">
        <option value="">All types</option>
        ${[...reportTypes]
          .sort((a, b) => a.localeCompare(b))
          .map((t) => `<option value="${esc(t)}">${esc(t)}</option>`)
          .join("")}
      </select>
      <input type="search" data-col="2" placeholder="Filter path…" autocomplete="off" spellcheck="false">
      <span class="filter-stats" data-filter-stats></span>
    </div>
    <div id="report-recent-table">
      ${renderTable(
        [
          "time",
          "type",
          "path",
          "directive",
          "blocked",
          "disposition",
          "detail",
        ],
        rowsOrEmpty(results.report_recent),
        {
          formatters: {
            time: (v) => esc(String(v).slice(5, 16)),
            path: (v) => `<span class="path">${esc(v)}</span>`,
            blocked: (v) => `<span class="path">${esc(v)}</span>`,
            detail: (v) => `<span class="path">${esc(v)}</span>`,
          },
        },
      )}
    </div>
  </div>

  <script src="/admin-stats.js" defer></script>
</body>
</html>`;
}
