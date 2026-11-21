// Cloudflare Worker entry for TanStack Start. Wrangler points to this file.
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { recordRouteError } from "@/lib/error-capture.server";

// Runs once the router has loaded the page.
const handler = createStartHandler((ctx) => {
  for (const match of ctx.router.state.matches) {
    if (match.status === "error") recordRouteError(ctx.request, match.error, match.routeId);
  }
  return defaultStreamHandler(ctx);
});

export default { fetch: handler };
