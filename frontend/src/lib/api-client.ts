const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://api.our-novel.com/api").replace(/\/$/, '') + "/";

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
  const url = `${API_URL}${cleanEndpoint}`;

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

  const response = await fetch(url, { ...config, headers });
  // If server is explicitly down with gateway errors, we might want to throw error
  if (!response.ok && [502, 503, 504].includes(response.status)) {
      throw new Error(`Server returned ${response.status}`);
  }
  return await handleResponse<T>(response);
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
  if (!path) return "/images/placeholder_character.png";
  if (path.startsWith("http")) return path;
  
  // Ensure we have a clean base URL without trailing slashes
  let baseUrl = "https://api.our-novel.com";

  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      baseUrl = envUrl.replace(/\/api\/?$/, '');
    }
  }

  // Make sure baseUrl always starts with http if it's not already there
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  const cleanPath = path.replace(/^\//, '');
  
  // CRITICAL: If the path doesn't already start with 'media/', prepend it
  const finalPath = cleanPath.startsWith('media/') ? cleanPath : `media/${cleanPath}`;
  
  return `${baseUrl}/${finalPath}`;
}
