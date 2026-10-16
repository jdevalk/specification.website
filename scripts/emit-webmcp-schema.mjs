// Emit webmcp.schema.json from the built /webmcp.js bundle.
//
// Loads dist/webmcp.js in a stubbed browser environment, captures the tools
// passed to registerTool(), and writes their descriptors (minus `execute`)
// as JSON. Run after `npm run build:astro` (or `npm run build`):
//
//   node scripts/emit-webmcp-schema.mjs
//
// The schema feeds `npx webmcp-evals local -t webmcp.schema.json -e webmcp.evals.json`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = fileURLToPath(new URL("..", import.meta.url));
const bundle = readFileSync(`${root}/dist/webmcp.js`, "utf8");

const tools = [];
const sandbox = {
  console,
  document: {
    modelContext: {
      registerTool: (t) => {
        tools.push(t);
        return Promise.resolve();
      },
    },
    querySelector: () => null,
  },
  navigator: {},
  window: { location: { assign: () => {} } },
  fetch: () => Promise.reject(new Error("no network in schema emit")),
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(bundle, sandbox, { filename: "webmcp.js" });
await new Promise((r) => setImmediate(r));

const schema = {
  tools: tools.map((t) => {
    const descriptor = { ...t };
    delete descriptor.execute;
    return descriptor;
  }),
};
writeFileSync(
  `${root}/webmcp.schema.json`,
  JSON.stringify(schema, null, 2) + "\n",
);
console.log(
  `✓ webmcp.schema.json — ${schema.tools.length} tools (${schema.tools.map((t) => t.name).join(", ")})`,
);
