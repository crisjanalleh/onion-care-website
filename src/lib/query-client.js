import { QueryClient } from "@tanstack/react-query";

// One QueryClient per browser tab, shared by the router context (so a route's
// beforeLoad can prime a query) and by the components that read the same query.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
