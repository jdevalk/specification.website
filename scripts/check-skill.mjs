// Catch drift in the hand-maintained Agent Skill.
//
// public/.well-known/agent-skills/specification-website/SKILL.md is authored by
// hand (CLAUDE.md step 8), but four of its claims are mechanically derivable
// from the repo. Nothing stopped them rotting: the page count sat at "140+"
// while the corpus grew, the MCP protocol revision named a superseded date, and
// the category list could silently diverge from src/lib/site.ts. This script is
// the guard.
//
//   node scripts/check-skill.mjs --check   # CI: fail on any drift
//   node scripts/check-skill.mjs           # rewrite SKILL.md + index.json digest
//
// The four derived facts:
//
//   1. page count      ← src/content/spec/<category>/<slug>.md
//   2. category count  ← `categories` in src/lib/site.ts
//      + category list
//   3. protocol rev    ← PROTOCOL_VERSION in mcp/src/index.ts
//   4. digest          ← sha256 of SKILL.md, recorded in agent-skills/index.json
//
// Ordering: the digest is computed last, over the bytes on disk after (1)-(3)
// have been rewritten. A formatter running between hash and commit would
// invalidate the digest, so public/.well-known/ is excluded in .prettierignore.
// We assert that exclusion rather than trusting the comment there to survive.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_NAME = "specification-website";
const SKILL = join(
  root,
  `public/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`,
);
const INDEX = join(root, "public/.well-known/agent-skills/index.json");
const SPEC_DIR = join(root, "src/content/spec");
const SITE = join(root, "src/lib/site.ts");
const MCP = join(root, "mcp/src/index.ts");
const PRETTIERIGNORE = join(root, ".prettierignore");

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

const sentenceCase = (w) => w[0].toUpperCase() + w.slice(1);
const matchCase = (word, like) =>
  like[0] === like[0].toUpperCase() ? sentenceCase(word) : word;

// Line number (1-indexed) of a character offset, for pointing at the drift.
const lineAt = (text, index) => text.slice(0, index).split("\n").length;

// ---------------------------------------------------------------------------
// Reading the sources of truth
// ---------------------------------------------------------------------------

async function pageCount() {
  const dirs = await readdir(SPEC_DIR, { withFileTypes: true });
  let n = 0;
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const files = await readdir(join(SPEC_DIR, d.name));
    n += files.filter((f) => f.endsWith(".md")).length;
  }
  return n;
}

// site.ts is TypeScript, so we can't import it from a plain .mjs script.
// Slice out the `categories` array literal and pull the slugs in source order.
async function categorySlugs() {
  const src = await readFile(SITE, "utf8");
  const start = src.indexOf("export const categories = [");
  if (start === -1) throw new Error(`no 'categories' array in ${SITE}`);
  // Closing bracket at column 0 — the array is `] as const;` today, but don't
  // depend on the suffix.
  const end = src.indexOf("\n]", start);
  if (end === -1) throw new Error(`unterminated 'categories' array in ${SITE}`);
  const block = src.slice(start, end);
  const slugs = [...block.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (slugs.length === 0)
    throw new Error(`no slugs in 'categories' in ${SITE}`);
  return slugs;
}

async function protocolVersion() {
  const src = await readFile(MCP, "utf8");
  const m = src.match(/const PROTOCOL_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!m) throw new Error(`no PROTOCOL_VERSION in ${MCP}`);
  return m[1];
}

// ---------------------------------------------------------------------------
// The four checks. Each returns { problems: [...], text } — `text` is the
// SKILL.md body with the fix applied, used only in write mode.
// ---------------------------------------------------------------------------

function checkPageCount(text, expected) {
  const problems = [];
  // Matches "159 pages" and the old fuzzy "140+ pages".
  const re = /\b(\d+)(\+?)\s+pages\b/g;
  let found = 0;
  const next = text.replace(re, (whole, num, plus, offset) => {
    found++;
    if (Number(num) === expected && plus === "") return whole;
    problems.push(
      `SKILL.md:${lineAt(text, offset)} states "${whole}" — the corpus has ` +
        `${expected} pages (src/content/spec/*/*.md). Expected "${expected} pages".`,
    );
    return `${expected} pages`;
  });
  if (found === 0) {
    problems.push(
      `SKILL.md states no page count — expected a "${expected} pages" claim.`,
    );
  }
  return { problems, text: next };
}

function checkCategoryCount(text, expected) {
  const problems = [];
  const word = NUMBER_WORDS[expected];
  if (!word) throw new Error(`no number word for ${expected} categories`);
  const re = /\b([A-Za-z]+)\s+categories\b/g;
  let found = 0;
  const next = text.replace(re, (whole, said, offset) => {
    // "the ten categories" — the captured word is the count. Skip phrases like
    // "Current categories" where the preceding word isn't a numeral at all.
    if (!NUMBER_WORDS.includes(said.toLowerCase())) return whole;
    found++;
    if (said.toLowerCase() === word) return whole;
    const fixed = matchCase(word, said);
    problems.push(
      `SKILL.md:${lineAt(text, offset)} says "${whole}" — src/lib/site.ts ` +
        `defines ${expected}. Expected "${fixed} categories".`,
    );
    return `${fixed} categories`;
  });
  if (found === 0) {
    problems.push(
      `SKILL.md states no category count — expected a "${word} categories" claim.`,
    );
  }
  return { problems, text: next };
}

// The "## Categories" section lists one bullet per category, in site.ts order:
//   - `foundations` — HTML, head, document basics.
// We check the slugs and their order, not the prose after the dash.
function checkCategoryList(text, expected) {
  const problems = [];
  const start = text.indexOf("\n## Categories\n");
  if (start === -1) {
    return { problems: ["SKILL.md has no '## Categories' section."], text };
  }
  const rest = text.slice(start + 1);
  const nextHeading = rest.indexOf("\n## ", 1);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const listed = [...section.matchAll(/^-\s+`([^`]+)`/gm)].map((m) => m[1]);

  if (listed.join("\n") !== expected.join("\n")) {
    const missing = expected.filter((s) => !listed.includes(s));
    const extra = listed.filter((s) => !expected.includes(s));
    const detail = [
      missing.length ? `missing: ${missing.join(", ")}` : null,
      extra.length ? `not a category: ${extra.join(", ")}` : null,
      !missing.length && !extra.length ? "wrong order" : null,
    ]
      .filter(Boolean)
      .join("; ");
    problems.push(
      `SKILL.md '## Categories' diverges from src/lib/site.ts — ${detail}. ` +
        `Expected, in order: ${expected.join(", ")}.`,
    );
  }
  // Not auto-fixable: each bullet carries hand-written prose we can't invent.
  return { problems, text };
}

function checkProtocol(text, expected) {
  const problems = [];
  // Horizontal whitespace only — `\s*$` in multiline mode would eat the blank
  // line after the bullet and glue the next paragraph on.
  const re = /^(-[ \t]+Protocol revision:[ \t]*)(\S+)[ \t]*$/m;
  const m = text.match(re);
  if (!m) {
    return {
      problems: ["SKILL.md has no '- Protocol revision:' line."],
      text,
    };
  }
  if (m[2] !== expected) {
    problems.push(
      `SKILL.md:${lineAt(text, m.index)} claims MCP protocol revision ` +
        `${m[2]} — mcp/src/index.ts serves ${expected}.`,
    );
  }
  return { problems, text: text.replace(re, `$1${expected}`) };
}

// ---------------------------------------------------------------------------
// Digest + the .prettierignore invariant that keeps it stable
// ---------------------------------------------------------------------------

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function assertNotFormatterOwned() {
  const ignore = await readFile(PRETTIERIGNORE, "utf8");
  const ignored = ignore
    .split("\n")
    .map((l) => l.trim())
    .some((l) => l === "public/.well-known/" || l === "public/.well-known");
  if (!ignored) {
    throw new Error(
      "public/.well-known/ is not in .prettierignore. Prettier would reformat " +
        "SKILL.md after this script hashes it, invalidating the digest on every " +
        "commit. Re-add the ignore entry before removing this guard.",
    );
  }
}

async function readIndex() {
  const json = JSON.parse(await readFile(INDEX, "utf8"));
  const entry = json.skills?.find((s) => s.name === SKILL_NAME);
  if (!entry) throw new Error(`${INDEX} has no skill named "${SKILL_NAME}"`);
  return { json, entry };
}

// ---------------------------------------------------------------------------

async function main() {
  const check = process.argv.includes("--check");
  await assertNotFormatterOwned();

  const [pages, cats, proto] = await Promise.all([
    pageCount(),
    categorySlugs(),
    protocolVersion(),
  ]);

  const original = await readFile(SKILL, "utf8");
  let text = original;
  const problems = [];
  for (const step of [
    (t) => checkPageCount(t, pages),
    (t) => checkCategoryCount(t, cats.length),
    (t) => checkCategoryList(t, cats),
    (t) => checkProtocol(t, proto),
  ]) {
    const result = step(text);
    problems.push(...result.problems);
    text = result.text;
  }

  // Digest last: it must cover the bytes that will actually be committed. In
  // check mode that's the file as it stands on disk (`original`); in write mode
  // it's the text after the prose fixes above. Hashing `text` in check mode
  // would report a phantom digest mismatch on top of every prose drift.
  const { json, entry } = await readIndex();
  const committedDigest = `sha256:${sha256(Buffer.from(original, "utf8"))}`;
  const expectedDigest = `sha256:${sha256(Buffer.from(text, "utf8"))}`;

  if (check) {
    if (entry.digest !== committedDigest) {
      problems.push(
        `agent-skills/index.json digest is ${entry.digest} but SKILL.md hashes ` +
          `to ${committedDigest}. Run \`npm run sign:skill\`.`,
      );
    }
    if (problems.length) {
      console.error(`✗ Agent Skill drift (${problems.length}):\n`);
      for (const p of problems) console.error(`  • ${p}`);
      console.error(
        `\n  Fix the prose, then run \`npm run sign:skill\` to update the digest.`,
      );
      process.exit(1);
    }
    console.log(
      `  SKILL.md agrees with the repo — ${pages} pages, ${cats.length} categories, ` +
        `MCP ${proto}, digest ✓`,
    );
    return;
  }

  // Write mode. The category list is the one claim we refuse to invent.
  const unfixable = problems.filter((p) => p.includes("'## Categories'"));
  if (unfixable.length) {
    console.error(`✗ Cannot auto-fix — edit SKILL.md by hand:\n`);
    for (const p of unfixable) console.error(`  • ${p}`);
    process.exit(1);
  }

  const digestDrifted = entry.digest !== expectedDigest;
  if (text !== original) await writeFile(SKILL, text);
  if (digestDrifted) {
    entry.digest = expectedDigest;
    // Preserve the file's trailing newline convention; 2-space indent matches
    // the committed file (and Prettier never touches public/.well-known/).
    await writeFile(INDEX, JSON.stringify(json, null, 2) + "\n");
  }

  if (text === original && !digestDrifted) {
    console.log("  SKILL.md and its digest were already in sync ✓");
    return;
  }
  for (const p of problems) console.log(`  fixed: ${p}`);
  if (digestDrifted) console.log(`  digest → ${expectedDigest}`);
  console.log(
    `  SKILL.md now claims ${pages} pages, ${cats.length} categories, MCP ${proto} ✓`,
  );
}

await main();
