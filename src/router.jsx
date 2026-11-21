import { createRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

/**
 * The router entry (`src/router.jsx`). TanStack Start looks for `getRouter` in
 * this file and calls it once per request; the generated `routeTree.gen.ts`
 * types its return value.
 *
 * The Firebase auth context supplies browser identity; protected data access is
 * handled by authenticated server functions.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: DefaultCatchBoundary,
  });
}
