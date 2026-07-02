// Post-build guard for the pinned Pagefind runtime.
//
// pagefind.js is emitted by `pagefind --site dist` after the Astro build, so
// its SRI hash can't be computed at render time — it lives as a committed
// constant (pagefindIntegrity in src/lib/integrity.ts), rendered into the
// import map and allow-listed in the CSP. This script runs at the end of the
// build and fails if that constant (or the CSP hash derived from it) has
// drifted from the freshly emitted file — the usual cause being a `pagefind`
// dependency bump. A stale hash would silently disable pagefind.js integrity
// today and break search the moment Integrity-Policy is enforced.
//
// On mismatch it prints the exact values to paste, then exits non-zero.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.cwd();
const fail = (msg) => {
  console.error(`\n[31m✗ check-pagefind-integrity: ${msg}[0m`);
  process.exit(1);
};

const sri = (buf, algo) =>
  `${algo}-${createHash(algo).update(buf).digest("base64")}`;

// Freshly built runtime.
let built;
try {
  built = readFileSync(join(root, "dist/pagefind/pagefind.js"));
} catch {
  fail("dist/pagefind/pagefind.js not found — run the full build first.");
}
const actual384 = sri(built, "sha384");

// Committed constant (read as text so this needs no TS loader).
const src = readFileSync(join(root, "src/lib/integrity.ts"), "utf8");
const pinned = src.match(/pagefindIntegrity\s*=\s*"([^"]+)"/)?.[1];
if (!pinned) fail("could not find pagefindIntegrity in src/lib/integrity.ts");

if (pinned !== actual384) {
  const importMap = JSON.stringify({
    integrity: { "/pagefind/pagefind.js": actual384 },
  });
  const csp256 = sri(Buffer.from(importMap), "sha256");
  console.error(`\n[31m✗ pagefind.js hash drifted (pagefind bumped?).[0m
  Update these two values, then rebuild:

  1. src/lib/integrity.ts → pagefindIntegrity:
       ${actual384}

  2. public/_headers → CSP script-src importmap hash:
       '${csp256}'
`);
  process.exit(1);
}

// The CSP must allow the import map we actually render.
const importMap = JSON.stringify({
  integrity: { "/pagefind/pagefind.js": pinned },
});
const csp256 = sri(Buffer.from(importMap), "sha256");
const headers = readFileSync(join(root, "public/_headers"), "utf8");
if (!headers.includes(`'${csp256}'`)) {
  fail(
    `CSP in public/_headers is missing the import map hash '${csp256}'. ` +
      `Add it to script-src.`,
  );
}

console.log(
  `✓ check-pagefind-integrity: pagefind.js pinned (${actual384}) and CSP-allowed.`,
);
