import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { categories, site } from "~/lib/site";

export const GET: APIRoute = async () => {
  const entries = await getCollection("spec", ({ data }) => !data.draft);
  const grouped: Record<string, typeof entries> = {};
  for (const e of entries) (grouped[e.data.category] ??= []).push(e);
  for (const k of Object.keys(grouped)) {
    grouped[k].sort(
      (a, b) =>
        a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
    );
  }

  const lines: string[] = [];
  lines.push(`# ${site.name}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(
    "This is the llms.txt index for " +
      site.url +
      ". The site is a platform-agnostic specification of the technical features a good website should have. It covers HTML foundations, SEO, accessibility, security, well-known URIs, agent readiness, performance, privacy, resilience, and internationalisation.",
  );
  lines.push("");
  lines.push(
    "Every individual spec page is available as raw Markdown two ways:",
  );
  lines.push(
    "  1. Append `.md` to any spec URL — e.g. " +
      site.url +
      "/spec/security/content-security-policy.md",
  );
  lines.push(
    "  2. Send `Accept: text/markdown` to the canonical (slash-terminated) URL — the same page returns Markdown with `Content-Location` pointing at the .md path and `Vary: Accept` set for caches.",
  );
  lines.push("");
  lines.push(
    "For the full content of every spec page concatenated into one file, see " +
      site.url +
      "/llms-full.txt.",
  );
  lines.push("");
  lines.push("For richer access, two named surfaces are available:");
  lines.push(
    "  - MCP server at `https://mcp.specification.website/mcp` — stateless Streamable HTTP, no auth, with `search`, `list_topics`, `get_topic`, `get_checklist`, and `audit_url` tools. Server card: " +
      site.url +
      "/.well-known/mcp/server-card.json.",
  );
  lines.push(
    "  - Agent Skill at " +
      site.url +
      "/.well-known/agent-skills/specification-website/SKILL.md — discoverable via " +
      site.url +
      "/.well-known/agent-skills/index.json. Teaches a compatible agent when and how to query the spec.",
  );
  lines.push("");
  lines.push(
    "Pairs well with the MDN MCP server (https://mcp.mdn.mozilla.net/). This spec tells you what a good site should do and whether it is required; the MDN MCP tells you how a web feature works and whether it is Baseline / widely supported. Use this spec to decide what to check, then MDN for implementation and browser-support detail.",
  );
  lines.push("");

  for (const c of categories) {
    const items = grouped[c.slug] ?? [];
    if (!items.length) continue;
    lines.push(`## ${c.title}`);
    lines.push("");
    lines.push(c.summary);
    lines.push("");
    for (const e of items) {
      const slug = e.data.slug ?? e.id.split("/").pop()!;
      const url = `${site.url}/spec/${c.slug}/${slug}/`;
      lines.push(`- [${e.data.title}](${url}): ${e.data.summary}`);
    }
    lines.push("");
  }

  lines.push("## Structured exports");
  lines.push("");
  lines.push(
    "The whole spec is also published as an Open Knowledge Format (OKF) bundle — one Markdown concept per check, plus a mirrored standard per cited source.",
  );
  lines.push(
    `  - [OKF bundle index](${site.url}/okf/index.md): browsable root of the bundle; each category links to its checks.`,
  );
  lines.push(
    `  - [OKF bundle tarball](${site.url}/okf.tar.gz): the entire bundle as a single gzipped tar.`,
  );
  lines.push("");
  lines.push("## Project");
  lines.push("");
  lines.push(
    `- [About](${site.url}/about/): What the spec is and how it is built.`,
  );
  lines.push(
    `- [Contribute](${site.url}/contribute/): How to propose changes.`,
  );
  lines.push(
    `- [Checklist](${site.url}/checklist/): The whole spec as a flat checklist. Also as a copy-and-paste [Markdown task list](${site.url}/checklist.md).`,
  );
  lines.push(
    `- [Considered, not adopted](${site.url}/considered/): Standards deliberately left out of the spec, with the reason for each and what would change it.`,
  );
  lines.push(
    `- [MCP server](${site.url}/mcp/): How to connect an MCP client to the spec.`,
  );
  lines.push(
    `- [Agent Skill](${site.url}/.well-known/agent-skills/specification-website/SKILL.md): Packaged skill teaching an agent when and how to query the spec.`,
  );
  lines.push(
    `- [Source on GitHub](${site.repo}): MIT licensed, open for pull requests.`,
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
