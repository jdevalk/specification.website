// Open Knowledge Format (OKF) bundle generator.
//
// Everything here is derived from the `spec` content collection — the same
// source of truth as the HTML pages, the .md mirror, and llms.txt. The OKF
// bundle is emitted as a tree of Markdown "concept" files by the endpoints
// under src/pages/okf/, and packaged into /okf.tar.gz by the build integration
// in astro-okf-tarball.mjs. Do not hand-author any of it.
//
// OKF spec: https://github.com/GoogleCloudPlatform/knowledge-catalog (okf/SPEC.md).
//   §5.1 sources · §5.2 provenance · §5.3 trust · §7 actors · §13 breaking changes.
//
// Targets OKF 0.2. That revision makes two breaking changes to 0.1, both of
// which land here (§13): the `timestamp` field is superseded by `generated.at`,
// and the body-level `# Citations` list is superseded by a frontmatter
// `sources` list. We emit the 0.2 shape only — consumers are told to fall back
// to the 0.1 fields when they are absent, not to expect both.
//
// Concept files carry the blessed fields (type, title, description, resource,
// tags, sources) plus producer-defined keys (category, requirement, source_updated_at,
// conformance, standard, and a per-source `mirror` pointing at this bundle's
// own copy of the standard). Index and log files are reserved filenames and
// carry no frontmatter, except the bundle-root index.md which may carry
// okf_version.

import { getCollection } from "astro:content";
import { categories, site } from "~/lib/site";

export const OKF_VERSION = "0.2";

// The collection has no per-page authorship or verification records. Omit
// optional generated/verified provenance rather than attribute the corpus to
// its maintainer. Preserve the source edit date separately from provenance.

type Source = { title: string; url: string; publisher?: string };

export type OkfReference = {
  slug: string;
  title: string;
  url: string;
  publisher?: string;
};

export type OkfConcept = {
  category: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  conformance: string;
  resource: string;
  /** Source edit date; does not attest authorship or verification. */
  updatedAt?: string;
  tags: string[];
  sources: Source[];
  body: string;
  /** Reference slugs for this concept's sources, in source order. */
  refSlugs: string[];
};

// status → RFC 2119 conformance keyword for the producer-defined `conformance` key.
const CONFORMANCE: Record<string, string> = {
  required: "MUST",
  recommended: "SHOULD",
  optional: "MAY",
  avoid: "MUST NOT",
};

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "ref"
  );
}

type OkfData = {
  concepts: OkfConcept[];
  references: OkfReference[];
  byCategory: Map<string, OkfConcept[]>;
};

let cached: OkfData | null = null;

export async function getOkfData(): Promise<OkfData> {
  if (cached) return cached;

  const entries = await getCollection("spec", ({ data }) => !data.draft);

  // One Reference concept per distinct source URL, deterministically slugged.
  // Sort by URL first so collision-resolution (-2, -3 …) is stable across builds.
  const distinct = new Map<string, Source>();
  for (const e of entries) {
    for (const s of e.data.sources ?? []) {
      if (!distinct.has(s.url)) distinct.set(s.url, s);
    }
  }
  const sortedUrls = [...distinct.keys()].sort();
  const usedSlugs = new Set<string>();
  const refByUrl = new Map<string, OkfReference>();
  for (const url of sortedUrls) {
    const src = distinct.get(url)!;
    const base = slugify(src.title);
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
    usedSlugs.add(slug);
    refByUrl.set(url, {
      slug,
      title: src.title,
      url,
      publisher: src.publisher,
    });
  }

  const concepts: OkfConcept[] = entries.map((e) => {
    const slug = e.data.slug ?? e.id.split("/").pop()!;
    const sources = e.data.sources ?? [];
    const tags: string[] = [e.data.category, e.data.status];
    for (const a of e.data.appliesTo ?? []) if (a !== "all") tags.push(a);
    return {
      category: e.data.category,
      slug,
      title: e.data.title,
      description: e.data.summary,
      status: e.data.status,
      conformance: CONFORMANCE[e.data.status] ?? "SHOULD",
      resource: `${site.url}/spec/${e.data.category}/${slug}/`,
      updatedAt: e.data.updated,
      tags,
      sources,
      body: (e.body ?? "").trim(),
      refSlugs: sources.map((s) => refByUrl.get(s.url)!.slug),
    };
  });

  concepts.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug),
  );

  const byCategory = new Map<string, OkfConcept[]>();
  for (const c of concepts)
    (byCategory.get(c.category) ?? setGet(byCategory, c.category)).push(c);

  const references = [...refByUrl.values()].sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );

  cached = { concepts, references, byCategory };
  return cached;
}

function setGet(map: Map<string, OkfConcept[]>, key: string): OkfConcept[] {
  const v: OkfConcept[] = [];
  map.set(key, v);
  return v;
}

// ── Renderers ──────────────────────────────────────────────────────────────

function yamlString(v: string): string {
  return JSON.stringify(v);
}

/** A single Check concept: okf/<category>/<slug>.md */
export function renderConcept(c: OkfConcept): string {
  const fm: string[] = ["---"];
  fm.push("type: Check");
  fm.push(`title: ${yamlString(c.title)}`);
  fm.push(`description: ${yamlString(c.description)}`);
  fm.push(`resource: ${c.resource}`);
  fm.push("tags:");
  for (const t of c.tags) fm.push(`  - ${t}`);
  if (c.updatedAt) fm.push(`source_updated_at: ${yamlString(c.updatedAt)}`);
  // §5.1. Frontmatter provenance, replacing the 0.1 body-level `# Citations`
  // list. `mirror` is producer-defined and points at this bundle's own copy of
  // the standard, so the in-bundle graph survives the move out of the body.
  if (c.sources.length) {
    fm.push("sources:");
    c.sources.forEach((s, i) => {
      fm.push(`  - id: ${c.refSlugs[i]}`);
      fm.push(`    title: ${yamlString(s.title)}`);
      fm.push(`    resource: ${s.url}`);
      if (s.publisher) fm.push(`    author: ${yamlString(s.publisher)}`);
      fm.push(`    mirror: ../references/${c.refSlugs[i]}.md`);
    });
  }
  fm.push(`category: ${c.category}`);
  // OKF reserves status for draft/stable/deprecated, not requirement strength.
  fm.push(`requirement: ${c.status}`);
  fm.push(`conformance: ${yamlString(c.conformance)}`);
  if (c.refSlugs.length) fm.push(`standard: ../references/${c.refSlugs[0]}.md`);
  fm.push("---");

  const parts: string[] = [
    fm.join("\n"),
    "",
    `# ${c.title}`,
    "",
    `> ${c.description}`,
    "",
    c.body,
    "",
  ];

  if (c.refSlugs.length) {
    parts.push("# Source", "");
    parts.push(
      `Primary standard: [${c.sources[0].title}](../references/${c.refSlugs[0]}.md).`,
      "",
    );
  }

  return parts.join("\n");
}

/** A mirrored external standard: okf/references/<slug>.md */
export function renderReference(r: OkfReference): string {
  const fm = [
    "---",
    "type: Reference",
    `title: ${yamlString(r.title)}`,
    `resource: ${r.url}`,
  ];
  if (r.publisher) {
    fm.push("tags:");
    fm.push(`  - ${slugify(r.publisher)}`);
  }
  fm.push("---");
  return [
    fm.join("\n"),
    "",
    `# ${r.title}`,
    "",
    `> External standard${r.publisher ? ` published by ${r.publisher}` : ""}.`,
    "",
    `Canonical source: <${r.url}>`,
    "",
  ].join("\n");
}

/** Category index: okf/<category>/index.md (no frontmatter, §6). */
export function renderCategoryIndex(
  categorySlug: string,
  concepts: OkfConcept[],
): string {
  const cat = categories.find((c) => c.slug === categorySlug);
  const lines = [`# ${cat?.title ?? categorySlug}`, ""];
  if (cat) lines.push(cat.summary, "");
  for (const c of concepts)
    lines.push(`* [${c.title}](${c.slug}.md) - ${c.description}`);
  lines.push("");
  return lines.join("\n");
}

/** References index: okf/references/index.md (no frontmatter, §6). */
export function renderReferencesIndex(refs: OkfReference[]): string {
  const lines = [
    "# References",
    "",
    "External standards and documentation cited by the checks in this bundle.",
    "",
  ];
  for (const r of refs)
    lines.push(
      `* [${r.title}](${r.slug}.md)${r.publisher ? ` - ${r.publisher}` : ""}`,
    );
  lines.push("");
  return lines.join("\n");
}

/** Bundle-root index: okf/index.md (the one index that may carry frontmatter, §11). */
export function renderRootIndex(data: OkfData): string {
  const lines = [
    "---",
    `okf_version: ${yamlString(OKF_VERSION)}`,
    "---",
    "",
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `An Open Knowledge Format bundle of ${data.concepts.length} checks across ${categories.length} categories, derived from ${site.url}. Each check mirrors a spec page; the \`references/\` directory mirrors every cited standard. Content licensed CC BY 4.0; canonical pages live at ${site.url}/spec/.`,
    "",
    "## Categories",
    "",
  ];
  for (const cat of categories) {
    const items = data.byCategory.get(cat.slug);
    if (!items?.length) continue;
    lines.push(`* [${cat.title}](${cat.slug}/index.md) - ${cat.summary}`);
  }
  lines.push("");
  lines.push("## Bundle");
  lines.push("");
  lines.push(
    "* [References](references/index.md) - Mirrored external standards.",
  );
  lines.push("* [Change log](log.md) - History of the spec, newest first.");
  lines.push("");
  return lines.join("\n");
}
