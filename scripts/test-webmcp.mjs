// Run after building: exercise the actual Function.toString()-emitted bundle.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const bundle = readFileSync(
  new URL("../dist/webmcp.js", import.meta.url),
  "utf8",
);
const manifest = JSON.parse(
  readFileSync(
    new URL("../dist/webmcp-manifest.json", import.meta.url),
    "utf8",
  ),
);
const response = () => ({ ok: true, json: async () => manifest });

async function loadTools(fetch) {
  const tools = {};
  vm.runInNewContext(bundle, {
    console,
    document: {
      modelContext: {
        registerTool(tool) {
          tools[tool.name] = tool;
          return Promise.resolve();
        },
      },
    },
    fetch,
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(Object.keys(tools).length, 5);
  return tools;
}

for (const origin of [
  "https://preview.example.pages.dev",
  "http://localhost:4321",
]) {
  test(`topic reads use the current deployment at ${origin}`, async () => {
    const page = manifest.pages[0];
    const path = `/spec/${page.category}/${page.slug}.md`;
    const markdown = readFileSync(
      new URL(`../dist${path}`, import.meta.url),
      "utf8",
    );
    const requests = [];
    const tools = await loadTools(async (url) => {
      // Resolve from a nested page and enforce the deployed connect-src 'self'.
      const resolved = new URL(
        url,
        `${origin}/spec/${page.category}/${page.slug}/`,
      );
      requests.push(resolved.href);
      if (resolved.origin !== origin)
        throw new TypeError("Blocked cross-origin fetch");
      if (resolved.pathname === "/webmcp-manifest.json") return response();
      assert.equal(resolved.pathname, path);
      return { ok: true, text: async () => markdown };
    });

    const result = await tools.get_topic.execute({
      slug: page.slug,
      limit: 500,
    });
    assert.equal(result, markdown);
    assert.deepEqual(requests, [
      `${origin}/webmcp-manifest.json`,
      `${origin}${path}`,
    ]);
  });
}

for (const cancelledCaller of ["first", "second"]) {
  test(`cancelling the ${cancelledCaller} caller leaves the shared fetch usable`, async () => {
    let finish;
    let requests = 0;
    const tools = await loadTools((_url, options) => {
      requests++;
      return new Promise((resolve, reject) => {
        finish = () => resolve(response());
        options.signal?.addEventListener("abort", () =>
          reject(options.signal.reason),
        );
      });
    });
    const first = new AbortController();
    const second = new AbortController();
    const search = tools.search_spec.execute(
      { query: "CSP" },
      { signal: first.signal },
    );
    const list = tools.list_topics.execute({}, { signal: second.signal });
    const cancelled = cancelledCaller === "first" ? search : list;
    const surviving = cancelledCaller === "first" ? list : search;
    let result;
    cancelled.then((value) => {
      result = value;
    });
    (cancelledCaller === "first" ? first : second).abort(
      new Error("cancelled"),
    );
    // Cancellation settles without waiting for the shared network request.
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(result?.code, "MANIFEST_ERROR");
    finish();
    assert.equal(typeof (await surviving), "string");
    assert.equal(typeof (await tools.list_topics.execute({})), "string");
    assert.equal(requests, 1);
  });
}

test("an already-cancelled call does not fetch or read the cached manifest", async () => {
  let requests = 0;
  const tools = await loadTools(async () => {
    requests++;
    return response();
  });
  const controller = new AbortController();
  controller.abort(new Error("cancelled"));
  const options = { signal: controller.signal };
  assert.equal(
    (await tools.list_topics.execute({}, options)).code,
    "MANIFEST_ERROR",
  );
  assert.equal(requests, 0);
  await tools.list_topics.execute({});
  assert.equal(
    (await tools.list_topics.execute({}, options)).code,
    "MANIFEST_ERROR",
  );
  assert.equal(requests, 1);
});

test("a cancelled topic read does not start the Markdown fetch", async () => {
  let finish;
  let requests = 0;
  const tools = await loadTools(() => {
    requests++;
    if (requests > 1)
      return Promise.reject(new Error("unexpected Markdown fetch"));
    return new Promise((resolve) => {
      finish = () => resolve(response());
    });
  });
  const controller = new AbortController();
  const topic = tools.get_topic.execute(
    { slug: manifest.pages[0].slug },
    { signal: controller.signal },
  );
  controller.abort(new Error("cancelled"));
  finish();
  assert.equal((await topic).code, "MANIFEST_ERROR");
  assert.equal(requests, 1);
});

test("network failures remain retryable and listeners are removed", async () => {
  let requests = 0;
  const tools = await loadTools(async () => {
    if (++requests === 1) throw new Error("offline");
    return response();
  });
  const listeners = new Set();
  const signal = {
    aborted: false,
    addEventListener(_event, listener) {
      listeners.add(listener);
    },
    removeEventListener(_event, listener) {
      listeners.delete(listener);
    },
  };
  assert.equal(
    (await tools.list_topics.execute({}, { signal })).retryable,
    true,
  );
  assert.equal(listeners.size, 0);
  assert.equal(
    typeof (await tools.list_topics.execute({}, { signal })),
    "string",
  );
  assert.equal(listeners.size, 0);
  assert.equal(requests, 2);
});
