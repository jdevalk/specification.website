import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().optional(),
});

const spec = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    category: z.enum([
      "foundations",
      "seo",
      "accessibility",
      "security",
      "well-known",
      "agent-readiness",
      "performance",
      "privacy",
      "resilience",
      "i18n",
    ]),
    summary: z.string(),
    status: z
      .enum(["required", "recommended", "optional", "avoid"])
      .default("recommended"),
    appliesTo: z.array(z.string()).default(["all"]),
    relatedSlugs: z.array(z.string()).default([]),
    sources: z.array(sourceSchema).default([]),
    order: z.number().default(100),
    draft: z.boolean().default(false),
    updated: z.string().optional(),
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/changelog" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    type: z.enum(["added", "changed", "status", "removed"]).default("changed"),
    relatedSlugs: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Standards we have evaluated and deliberately left out of the spec, with the
// reason. Hand-curated like `changelog` — nothing derives it.
const considered = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/considered" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    reason: z
      .enum(["too-early", "out-of-scope", "too-narrow"])
      .default("too-early"),
    // What would flip this decision. Keeps the register actionable rather than
    // a graveyard — omit only when nothing plausibly would.
    revisit: z.string().optional(),
    sources: z.array(sourceSchema).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { spec, changelog, considered };
