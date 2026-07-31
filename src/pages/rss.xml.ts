import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "~/lib/site";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const entries = await getCollection("spec", ({ data }) => !data.draft);
  entries.sort((a, b) =>
    (b.data.updated ?? "").localeCompare(a.data.updated ?? ""),
  );
  const siteUrl = context.site?.toString() ?? site.url;
  const feedUrl = new URL("/rss.xml", siteUrl).toString();
  const lastBuild = entries[0]?.data.updated
    ? new Date(entries[0].data.updated)
    : new Date();
  return rss({
    title: site.name,
    description: site.description,
    site: siteUrl,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      sy: "http://purl.org/rss/1.0/modules/syndication/",
    },
    items: entries.map((e) => {
      const slug = e.data.slug ?? e.id.split("/").pop()!;
      return {
        title: e.data.title,
        description: e.data.summary,
        pubDate: e.data.updated ? new Date(e.data.updated) : new Date(),
        link: `/spec/${e.data.category}/${slug}/`,
        categories: [e.data.category, e.data.status],
      };
    }),
    customData: [
      "<language>en-GB</language>",
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      // WebSub hub for this topic. Fallback copy of the Link header in
      // public/_headers — subscribers check headers first (WebSub §4).
      `<atom:link href="${new URL("/websub", siteUrl).toString()}" rel="hub" />`,
      `<lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
      "<sy:updatePeriod>weekly</sy:updatePeriod>",
      "<sy:updateFrequency>1</sy:updateFrequency>",
    ].join(""),
  });
}
