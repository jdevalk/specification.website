import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { site } from "~/lib/site";

export type SitemapEntry = { loc: string; lastmod?: string };

/**
 * Origin to put in <loc> entries.
 * - In dev, the request origin so links work on localhost.
 * - At build time, the configured canonical site URL.
 */
export const siteOrigin = (context: APIContext): string =>
  import.meta.env.DEV ? new URL(context.url).origin : site.url;

export const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Normalise a frontmatter `updated` value (YYYY-MM-DD or full ISO 8601) to
 * a canonical ISO timestamp for sitemap <lastmod>.
 */
const toIsoTimestamp = (d: string): string => {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d;
  return new Date(base).toISOString();
};

/**
 * Clamp a lastmod value to today (UTC). Future dates are nonsensical as
 * sitemap lastmods — they tell crawlers a URL changed before it could have —
 * so we silently cap them. Comparison is on the date portion only so a
 * later-today timestamp keeps its original precision.
 */
export function clampLastmod(d: string | undefined): string | undefined {
  if (!d) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  return d.slice(0, 10) > today ? today : d;
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8"?>';

export function renderUrlset(entries: SitemapEntry[]): string {
  const lines: string[] = [XML_DECL];
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const e of entries) {
    lines.push("  <url>");
    lines.push(`    <loc>${xmlEscape(e.loc)}</loc>`);
    if (e.lastmod)
      lines.push(`    <lastmod>${toIsoTimestamp(e.lastmod)}</lastmod>`);
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
}

export function renderSitemapIndex(entries: SitemapEntry[]): string {
  const lines: string[] = [XML_DECL];
  lines.push(
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  );
  for (const e of entries) {
    lines.push("  <sitemap>");
    lines.push(`    <loc>${xmlEscape(e.loc)}</loc>`);
    if (e.lastmod)
      lines.push(`    <lastmod>${toIsoTimestamp(e.lastmod)}</lastmod>`);
    lines.push("  </sitemap>");
  }
  lines.push("</sitemapindex>");
  return lines.join("\n");
}

export const xmlResponse = (body: string) =>
  new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });

export type SpecLastmod = {
  /** Category slug → newest `updated` date across its entries. */
  perCategory: Map<string, string>;
  /** Newest `updated` date across every published entry. */
  newest: string;
};

export async function loadSpecLastmod(): Promise<SpecLastmod> {
  const entries = await getCollection("spec", ({ data }) => !data.draft);
  const perCategory = new Map<string, string>();
  let newest = "";

  for (const e of entries) {
    const updated = clampLastmod(e.data.updated);
    if (!updated) continue;
    if (updated > (perCategory.get(e.data.category) ?? "")) {
      perCategory.set(e.data.category, updated);
    }
    if (updated > newest) newest = updated;
  }

  return { perCategory, newest };
}
