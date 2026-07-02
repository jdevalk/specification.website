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
import { readFileSync } from "node:fs";
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

if (failed) {
  console.error("\ncheck-integrity: FAILED");
  process.exit(1);
}
console.log(
  "✓ check-integrity: pagefind.js + component-ui pinned and CSP-allowed.",
);
