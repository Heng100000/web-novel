const PRIMARY_API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://api.our-novel.com/api").replace(/\/$/, '') + "/";
const FALLBACK_API_URL = "http://localhost:8000/api/";

// We will use this as the active base URL, and switch it if primary fails.
let currentApiUrl = PRIMARY_API_URL;

/**
 * Custom error class to handle API validation errors and details.
 */
export class ApiError extends Error {
  constructor(public data: any, public status: number) {
    const message = data.detail || data.error || `Error ${status}`;
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      // Clear auth data and redirect to login on 401 Unauthorized
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Generic API client for the entire application.
 * Normalizes URL paths, handles authentication, and supports a local fallback.
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  const cleanEndpoint = endpoint.replace(/^\//, '');
  let url = `${currentApiUrl}${cleanEndpoint}`;

  const headers: HeadersInit = {
    ...(config.headers || {}),
  };

  // Automatically set Content-Type to application/json if body is present and not FormData
  if (config.body && !(config.body instanceof FormData)) {
    (headers as any)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...config, headers });
    // If server is explicitly down with gateway errors, we might want to fallback too
    if (!response.ok && [502, 503, 504].includes(response.status)) {
        throw new Error(`Server returned ${response.status}`);
    }
    return await handleResponse<T>(response);
  } catch (error: any) {
    // If it's an ApiError (like 400 or 404), it's a successful connection but bad request, so we don't fallback.
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or 50x server error: try fallback if we are on primary
    if (currentApiUrl === PRIMARY_API_URL && PRIMARY_API_URL !== FALLBACK_API_URL) {
      console.warn(`Connection to primary API (${PRIMARY_API_URL}) failed. Falling back to local (${FALLBACK_API_URL})...`);
      currentApiUrl = FALLBACK_API_URL;
      
      // Retry with fallback URL
      url = `${currentApiUrl}${cleanEndpoint}`;
      const fallbackResponse = await fetch(url, { ...config, headers });
      return await handleResponse<T>(fallbackResponse);
    }
    
    throw error;
  }
}

/**
 * Domain-specific API helpers
 */
export const cartApi = {
  getCart: () => apiClient<any[]>("/add-to-cart/"),
  
  addItem: (bookId: number, quantity: number = 1) => 
    apiClient<any>("/add-to-cart/", {
      method: "POST",
      body: JSON.stringify({ items: [{ book: bookId, quantity }] }),
    }),
    
  addBatch: (items: { book: number; quantity: number }[]) =>
    apiClient<any>("/add-to-cart/", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  updateItem: (id: number, quantity: number) =>
    apiClient<any>(`/add-to-cart/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (id: number) =>
    apiClient<any>(`/add-to-cart/${id}/`, {
      method: "DELETE",
    }),
};

export const orderApi = {
  getOrders: () => apiClient<any[]>("/orders/"),
  getStats: () => apiClient<any>("/orders/stats/"),
  checkout: (batchId: string, address: string) =>
    apiClient<any>("/orders/checkout/", {
      method: "POST",
      body: JSON.stringify({ batch_id: batchId, shipping_address: address }),
    }),
};

export function getMediaUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Extract domain from the currently active API URL (removes /api/ from the end)
  const currentDomain = currentApiUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${currentDomain}/${cleanPath}`;
}

