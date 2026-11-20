import "@/lib/appDatabase";
import { createRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

/**
 * The router entry (`src/router.jsx`). TanStack Start looks for `getRouter` in
 * this file and calls it once per request; the generated `routeTree.gen.ts`
 * types its return value.
 *
 * Installing the Application globals first means `__APP_DB__` exists before any route
 * module is evaluated, since the route tree below imports every one of them.
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
