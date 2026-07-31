import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { site } from "~/lib/site";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const entries = await getCollection("changelog", ({ data }) => !data.draft);
  entries.sort((a, b) => b.data.date.localeCompare(a.data.date));

  const siteUrl = context.site?.toString() ?? site.url;
  const base = siteUrl.replace(/\/$/, "");
  const feedUrl = `${base}/changelog/rss.xml`;
  const lastBuild = entries[0]?.data.date
    ? new Date(entries[0].data.date)
    : new Date();

  // Render each entry's Markdown body to HTML for <content:encoded>, and
  // derive a plain-text <description>. Root-relative links are absolutised so
  // feed readers can resolve them.
  const container = await AstroContainer.create();
  const items = await Promise.all(
    entries.map(async (entry) => {
      const { Content } = await render(entry);
      const html = (await container.renderToString(Content)).replace(
        /(href|src)="\//g,
        `$1="${base}/`,
      );
      const description = html
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const id = entry.id.replace(/\.[^.]+$/, "");
      return {
        title: entry.data.title,
        description,
        content: html,
        pubDate: new Date(entry.data.date),
        link: `/changelog/#${id}`,
        categories: [entry.data.type],
      };
    }),
  );

  return rss({
    title: `${site.name} — Changelog`,
    description:
      "New topics, status changes, and removals in The Website Specification, newest first.",
    site: siteUrl,
    trailingSlash: false,
    items,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      sy: "http://purl.org/rss/1.0/modules/syndication/",
    },
    customData: [
      "<language>en-GB</language>",
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      // WebSub hub for this topic. Fallback copy of the Link header in
      // public/_headers — subscribers check headers first (WebSub §4).
      `<atom:link href="${base}/websub" rel="hub" />`,
      `<lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
      "<sy:updatePeriod>weekly</sy:updatePeriod>",
      "<sy:updateFrequency>1</sy:updateFrequency>",
    ].join(""),
  });
}
