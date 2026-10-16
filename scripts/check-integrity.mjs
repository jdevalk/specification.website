// Post-build guard for hand-pinned integrity hashes.
//
// Most scripts are hashed at build from their committed bytes
// (src/lib/integrity.ts sri(), and the generated webmcp body), so they can't
// drift. This checks the few hashes that must be written as literals because
// the file is emitted by `pagefind --site dist` AFTER the Astro build:
//
//   - pagefind.js            → pagefindIntegrity (src/lib/integrity.ts), and the
//                              CSP sha256 of the import map derived from it.
//   - pagefind-component-ui.js → pagefindComponentUiIntegrity (integrity.ts) and
//                              the same hash hardcoded in public/search.js.
//
// A stale hash would break search once Integrity-Policy is enforced (and today
// silently disables the check). On mismatch this prints the value to paste and
// exits non-zero, failing the build.
//
// It also walks the built HTML and checks that every SRI-pinned script URL
// carries `?v=<slice of its hash>` (hashVersion() in src/lib/integrity.ts) and
// that the hash matches the file it points at, so a changed file always gets a
// new URL rather than colliding with a visitor's stale cached copy.
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.cwd();
const sri = (buf, algo) =>
  `${algo}-${createHash(algo).update(buf).digest("base64")}`;

let failed = false;
const fail = (msg) => {
  console.error(`  \x1b[31m✗ ${msg}\x1b[0m`);
  failed = true;
};

function built384(rel) {
  try {
    return sri(readFileSync(join(root, rel)), "sha384");
  } catch {
    console.error(
      `\x1b[31m✗ check-integrity: ${rel} not found — run the full build first.\x1b[0m`,
    );
    process.exit(1);
  }
}

const integrityTs = readFileSync(join(root, "src/lib/integrity.ts"), "utf8");
const searchJs = readFileSync(join(root, "public/search.js"), "utf8");
const statsTs = readFileSync(join(root, "functions/admin/stats.ts"), "utf8");
const headers = readFileSync(join(root, "public/_headers"), "utf8");

// Each file's live hash must appear in every place that pins it as a literal.
// (Most scripts are hashed at build via src/lib/integrity.ts and need no entry.)
const pinned = [
  {
    label: "pagefind.js",
    file: "dist/pagefind/pagefind.js",
    refs: [["src/lib/integrity.ts", integrityTs]],
  },
  {
    label: "pagefind-component-ui.js",
    file: "dist/pagefind/pagefind-component-ui.js",
    refs: [
      ["src/lib/integrity.ts", integrityTs],
      ["public/search.js", searchJs],
    ],
  },
  {
    // Served by an edge Function, which can't hash at build — pinned literally.
    label: "admin-stats.js",
    file: "public/admin-stats.js",
    refs: [["functions/admin/stats.ts", statsTs]],
  },
];

for (const { label, file, refs } of pinned) {
  const actual = built384(file);
  for (const [name, text] of refs) {
    if (!text.includes(actual)) {
      fail(
        `${label} hash drifted — ${name} is stale.\n     Set it to: ${actual}`,
      );
    }
  }
}

// The CSP must allow the import map we render from pagefindIntegrity.
const pagefindIntegrity = (integrityTs.match(
  /pagefindIntegrity\s*=\s*"([^"]+)"/,
) || [])[1];
const importMap = JSON.stringify({
  integrity: { "/pagefind/pagefind.js": pagefindIntegrity },
});
const csp256 = sri(Buffer.from(importMap), "sha256");
if (!headers.includes(`'${csp256}'`)) {
  fail(`public/_headers CSP is missing the import map hash '${csp256}'.`);
}

// The inline WebMCP guard is hashed by CSP over its exact emitted bytes, so
// check the built HTML rather than the source constant. Its text is meant to be
// invariant across builds (the per-build SRI travels in a data- attribute, which
// CSP does not hash) — if this fires, the guard itself was edited.
const homepage = readFileSync(join(root, "dist/index.html"), "utf8");
const guard = (homepage.match(
  /<script data-webmcp-src=[^>]*>([\s\S]*?)<\/script>/,
) || [])[1];
if (!guard) {
  fail("dist/index.html has no inline WebMCP guard — BaseLayout changed?");
} else {
  const guardHash = sri(Buffer.from(guard), "sha256");
  if (!headers.includes(`'${guardHash}'`)) {
    fail(
      `public/_headers CSP is missing the WebMCP guard hash.\n     Set it to: ${guardHash}`,
    );
  }
}

// Every SRI-pinned script in the built HTML must use a versioned URL that
// matches the bytes actually served at that path.
const hashVersion = (integrity) =>
  integrity.slice(7, 19).replace(/[^A-Za-z0-9]/g, "_");
const htmlFiles = readdirSync(join(root, "dist"), { recursive: true }).filter(
  (f) => String(f).endsWith(".html"),
);
const seen = new Map();
for (const rel of htmlFiles) {
  const html = readFileSync(join(root, "dist", String(rel)), "utf8");
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    const integrity = (tag.match(/\b(?:data-webmcp-sri|integrity)="([^"]+)"/) ||
      [])[1];
    if (!integrity) continue;
    const src = (tag.match(/\b(?:data-webmcp-src|src)="([^"]+)"/) || [])[1];
    if (!src) continue;
    const [path, query = ""] = src.split("?");
    if (query !== `v=${hashVersion(integrity)}`) {
      fail(
        `${rel}: ${src} is not versioned by its hash.\n     Expected: ${path}?v=${hashVersion(integrity)}`,
      );
      continue;
    }
    if (seen.has(src)) continue;
    seen.set(src, integrity);
    if (built384(join("dist", path)) !== integrity) {
      fail(`${rel}: integrity for ${path} does not match dist${path}.`);
    }
  }
}
if (seen.size === 0) fail("no SRI-pinned scripts found in dist/**/*.html.");

if (failed) {
  console.error("\ncheck-integrity: FAILED");
  process.exit(1);
}
console.log(
  `✓ check-integrity: pagefind.js + component-ui + WebMCP guard pinned and CSP-allowed; ${seen.size} script URLs versioned by hash.`,
);
