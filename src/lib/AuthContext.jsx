import { onIdTokenChanged } from "@firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { QueryClientProvider, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyContext } from "@/lib/server/accounts";
import {
  firebaseAuthErrorMessage,
  signOutFirebaseUser,
} from "@/lib/firebase/auth-client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { queryClient } from "@/lib/query-client";

async function fetchAccount() {
  try {
    const auth = getFirebaseAuth();
    const firebaseUser = await new Promise((resolve, reject) => {
      let unsubscribe = () => {};
      unsubscribe = onIdTokenChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
    if (!firebaseUser) return { user: null, error: null };
    const account = await getMyContext();
    return { user: account.user ?? null, profile: account.profile ?? null, error: null };
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return { user: null, profile: null, error: null };
    return {
      user: null,
      profile: null,
      error: {
        type: error?.type ?? error?.data?.type ?? null,
        message: firebaseAuthErrorMessage(error),
      },
    };
  }
}

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
  error: null,
  navigateToLogin: () => {},
  logout: async () => {},
});

function AuthState({ children }) {
  const client = useQueryClient();
  const { data, isPending } = useQuery(authQuery);

  useEffect(() => {
    let unsubscribe;
    try {
      const auth = getFirebaseAuth();
      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          client.setQueryData(authQuery.queryKey, { user: null, profile: null, error: null });
          return;
        }
        try {
          const account = await getMyContext();
          client.setQueryData(authQuery.queryKey, {
            user: account.user ?? null,
            profile: account.profile ?? null,
            error: null,
          });
        } catch (error) {
          client.setQueryData(authQuery.queryKey, {
            user: null,
            profile: null,
            error: {
              type: error?.type ?? error?.data?.type ?? null,
              message: firebaseAuthErrorMessage(error),
            },
          });
        }
      });
    } catch (error) {
      client.setQueryData(authQuery.queryKey, {
        user: null,
        profile: null,
        error: { type: error?.code ?? null, message: firebaseAuthErrorMessage(error) },
      });
    }
    return () => unsubscribe?.();
  }, [client]);

  const logout = useCallback(async () => {
    await signOutFirebaseUser();
    client.clear();
    if (typeof window !== "undefined") window.location.assign("/login");
  }, [client]);

  const navigateToLogin = useCallback(() => {
    if (typeof window !== "undefined") window.location.assign("/login");
  }, []);

  const user = data?.user ?? null;
  const profile = data?.profile ?? null;
  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      isLoadingAuth: isPending,
      error: data?.error ?? null,
      navigateToLogin,
      logout,
    }),
    [user, profile, isPending, data?.error, navigateToLogin, logout],
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
