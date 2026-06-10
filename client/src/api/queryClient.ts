// api/queryClient.ts - Shared TanStack Query client.
//
// Defaults:
//   - 30s staleTime so quick navigations don't re-fetch
//   - retry once on failure (don't hammer the API on outage)
//   - refetchOnWindowFocus disabled (intrusive for a finance dashboard)

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
