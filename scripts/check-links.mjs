// Link checker driven through linkinator's programmatic API.
//
// We do NOT shell out to `npx linkinator`: linkinator@6's CLI runs `await main()`
// at the top level, and on Node 22 the event loop can empty while that await is
// still pending, aborting with exit 13 ("unsettled top-level await") after
// fetching only `/`. That is a deterministic crash of the CLI, not a broken
// link, and it cannot be retried away (see #58). The LinkChecker class below is
// unaffected, and we drive it with `.then()`/`process.exit` rather than a
// top-level await so our own process can never hit the same foot-gun.
//
// Usage:
//   node scripts/check-links.mjs <url> --internal          # skip every off-host link
//   node scripts/check-links.mjs <url> --config <file.json> # use a linkinator config

import { readFileSync } from "node:fs";
import { LinkChecker } from "linkinator";

const args = process.argv.slice(2);
const path = args.find((a) => !a.startsWith("--")) || "http://localhost:4321";

const options = { path, recurse: true };

const configIdx = args.indexOf("--config");
if (configIdx !== -1) {
  const cfg = JSON.parse(readFileSync(args[configIdx + 1], "utf8"));
  // The CLI config calls the skip list `skip`; the API calls it `linksToSkip`.
  const { skip, ...rest } = cfg;
  Object.assign(options, rest);
  if (skip) options.linksToSkip = skip;
}

if (args.includes("--internal")) {
  // Anything that is not localhost is an external link — skip it here; the
  // daily `external` job covers those.
  options.linksToSkip = ["^https?://(?!localhost)"];
}

const checker = new LinkChecker();
const broken = [];
checker.on("link", (link) => {
  if (link.state === "BROKEN") {
    broken.push(link);
    const where = link.parent ? ` (linked from ${link.parent})` : "";
    console.log(`  ✗ [${link.status ?? "---"}] ${link.url}${where}`);
  }
});

checker
  .check(options)
  .then((result) => {
    const scanned = result.links.length;
    const skipped = result.links.filter((l) => l.state === "SKIPPED").length;
    console.log(
      `Scanned ${scanned} links (${skipped} skipped) — ${broken.length} broken.`,
    );
    process.exit(result.passed ? 0 : 1);
  })
  .catch((err) => {
    console.error("::error::link checker crashed:", err);
    process.exit(2);
  });
