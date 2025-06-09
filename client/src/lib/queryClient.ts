import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn({ on401 }: { on401?: "returnNull" | "throw" } = {}) {
  return async ({ queryKey }: { queryKey: string[] }): Promise<any> => {
    const url = queryKey[0];
    const res = await fetch(url, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (on401 === "returnNull") {
          return null;
        }
        // Don't throw error for 401s, just return null
        return null;
      }
      throw new Error(`Request failed: ${res.status}`);
    }

    return res.json();
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});