import type { APIRoute } from "astro";
import { webmcpBody } from "~/lib/webmcp";

// Browser-side WebMCP registration. Exposes the spec as agent-callable tools via
// `navigator.modelContext` (or `document.modelContext`), so a browser agent on
// this page can search and read the spec without going through the remote MCP
// worker. The body is generated (and memoised) in src/lib/webmcp.ts so BaseLayout
// can pin the exact same bytes with an SRI hash.
//
// Spec context: https://webmachinelearning.github.io/webmcp/
export const GET: APIRoute = async () =>
  new Response(await webmcpBody(), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
