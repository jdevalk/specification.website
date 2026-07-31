import type { APIRoute } from "astro";
import { webmcpManifest } from "~/lib/webmcp";

// The spec manifest the browser-side WebMCP tools search over. Split out of
// /webmcp.js so the script stays small: every visitor used to download the whole
// manifest inline, but only an agent that actually calls search_spec /
// list_topics / get_topic needs it. Fetched once, on first such call.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await webmcpManifest()), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-if-error=86400",
    },
  });
