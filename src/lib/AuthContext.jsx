import { createContext, useCallback, useContext, useMemo } from "react";
import { QueryClientProvider, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/api/appClient";
import { queryClient } from "@/lib/query-client";

// Reads the signed-in visitor from the application account API. A 401/403 simply means nobody
// is signed in; anything else is surfaced as an `error` so the route gate can
// tell "not signed in" apart from "signed in but not a user of this app".
async function fetchAccount() {
  try {
    const user = await db.auth.me();
    return { user: user ?? null, error: null };
  } catch (error) {
    const status = error?.status;
    if (status === 401 || status === 403) return { user: null, error: null };
    return {
      user: null,
      error: {
        type: error?.type ?? error?.data?.type ?? null,
        message: error?.message ?? "Unable to load your account.",
      },
    };
  }
}

/**
 * The one source of truth for "who is signed in". The route gate reads it from
 * the router's QueryClient (`queryClient.ensureQueryData(authQuery)`), and the
 * provider below reads the same cache, so both always agree.
 */
export const authQuery = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: fetchAccount,
  staleTime: 30_000,
  retry: false,
});

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  navigateToLogin: () => {},
  logout: async () => {},
});

function AuthState({ children }) {
  const client = useQueryClient();
  const { data, isPending } = useQuery(authQuery);

  const logout = useCallback(async () => {
    await db.auth.logout?.();
    client.clear();
    if (typeof window !== "undefined") window.location.assign("/login");
  }, [client]);

  const navigateToLogin = useCallback(() => {
    if (typeof window !== "undefined") window.location.assign("/login");
  }, []);

  const user = data?.user ?? null;
  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoadingAuth: isPending, navigateToLogin, logout }),
    [user, isPending, navigateToLogin, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthState>{children}</AuthState>
    </QueryClientProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
