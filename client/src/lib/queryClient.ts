import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};

  // Always set Content-Type to application/json for requests with body
  if (options.body && options.method !== 'GET') {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure body is properly stringified if it's an object
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    try {
      body = JSON.stringify(body);
    } catch (error) {
      console.error('Error stringifying request body:', error);
      throw new Error('Invalid request body format');
    }
  }

  console.log('Making API request:', {
    url,
    method: options.method || 'GET',
    headers,
    bodyType: typeof body,
    body: body ? (typeof body === 'string' ? body : 'FormData') : undefined
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    body,
  });

  await throwIfResNotOk(response);
  return await response.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache for better performance
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Only retry on network errors, not on 4xx/5xx responses
        if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
          return failureCount < 2;
        }
        return false;
      },
    },
    mutations: {
      retry: false,
    },
  },
});