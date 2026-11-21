import { redirect } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { authQuery } from "@/lib/AuthContext";

/**
 * The login gate for a pathless layout route (src/routes/_authed.jsx), which gates
 * every route under src/routes/_authed/ (their URLs carry no "_authed" segment):
 *
 *   createFileRoute("/_authed")({ ssr: false, beforeLoad: requireSignedIn, errorComponent: AuthGateError })
 *
 * TanStack Router's authenticated-routes pattern: beforeLoad reads the visitor from the
 * router context (the QueryClient's cached `authQuery`, shared with useAuth()), so a
 * child's loader never runs as an anonymous visitor. Signed out → /login with the way
 * back; signed in but not a user of this app → the not-registered screen. Children read
 * the visitor with `Route.useRouteContext().user`. `ssr: false` — the server is anonymous,
 * so these pages render in the browser only, and children inherit that.
 */
export async function requireSignedIn({ context, location }) {
  const { user, profile, error } = await context.queryClient.ensureQueryData(authQuery);
  if (user?.emailVerified === false) {
    throw redirect({ to: "/verify-email", search: { email: user.email ?? "" } });
  }
  if (user) {
    if (user.role === "farmer" && !profile && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding" });
    }
    return { user, profile };
  }
  if (error) throw new Error(error.message);
  throw redirect({ to: "/login", search: { returnTo: location.href, from_url: location.href }, reloadDocument: true });
}

export function AuthGateError({ error }) {
  return <DefaultCatchBoundary error={error} />;
}
