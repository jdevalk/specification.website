// Build-time Subresource Integrity hashes for scripts we serve but do not
// fingerprint. Computed from the committed bytes during the Astro build (this
// runs in Node/SSG, never ships to the client), so the hash can never drift
// from what we serve: change the file and the next build re-hashes it.
//
// Used by the SRI `integrity` attributes in BaseLayout.astro. The frozen
// Plausible tracker (public/js/plausible.js) is refreshed by the daily
// .github/workflows/refresh-plausible.yml job; because the hash is derived
// here, that job only has to touch the .js file.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

/**
 * sha384 SRI hash (`sha384-<base64>`) of a repo-relative file path. Anchored on
 * process.cwd() (the repo root when `astro build` runs) rather than
 * import.meta.url, which Vite rewrites to the bundled chunk location.
 */
function sri(relativeToRepoRoot: string): string {
  const bytes = readFileSync(join(process.cwd(), relativeToRepoRoot));
  return `sha384-${createHash("sha384").update(bytes).digest("base64")}`;
}

/** Frozen, self-hosted Plausible tracker at /js/plausible.js. */
export const plausibleIntegrity = sri("public/js/plausible.js");

/**
 * SRI hash of the Pagefind runtime (/pagefind/pagefind.js), which
 * pagefind-component-ui.js pulls in via `import(`${bundlePath}pagefind.js`)`.
 * Unlike plausibleIntegrity this is a committed constant, because pagefind.js
 * is emitted by `pagefind --site dist` AFTER the Astro build, so it cannot be
 * hashed here at render time. Its bytes are fixed per Pagefind version (it
 * embeds no site data), so this only changes when the `pagefind` dependency is
 * bumped. scripts/check-pagefind-integrity.mjs runs after the build and fails
 * if this drifts from the emitted file — printing the value to paste here — so
 * a bump can't silently ship a stale hash (or break search once Integrity-Policy
 * is enforced).
 */
export const pagefindIntegrity =
  "sha384-oWDbZtddm6imqwKspZTD9CKGLSoOfvCVazIPigUPcSHDVGymVJvsBvvI3lFJNjm2";

/**
 * Inline import map attaching pagefindIntegrity to the dynamic import of
 * pagefind.js — so the runtime is integrity-checked today, and is ready for
 * `Integrity-Policy: blocked-destinations=(script)` enforcement (import maps
 * are the only way to give a dynamically imported module integrity metadata).
 * Rendered verbatim in <head> via set:html; its sha256 is allow-listed in the
 * CSP script-src in public/_headers. If this serialisation changes, recompute
 * that hash: printf '%s' '<the JSON>' | openssl dgst -sha256 -binary | openssl base64 -A
 */
export const pagefindImportMap = JSON.stringify({
  integrity: {
    "/pagefind/pagefind.js": pagefindIntegrity,
  },
});
