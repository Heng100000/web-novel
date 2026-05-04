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
      // Clear auth data but don't force redirect here, let AuthGuard handle it
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
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

  clearCart: () =>
    apiClient<any>("/add-to-cart/clear/", {
      method: "POST",
    }),
};

export const favoritesApi = {
  getFavorites: () => apiClient<any[]>("/favorites/"),
  list: () => apiClient<any>("/favorites/"),
  toggle: (bookId: number) => 
    apiClient<any>("/favorites/toggle/", {
      method: "POST",
      body: JSON.stringify({ book_id: bookId }),
    }),
  check: (bookId: number) =>
    apiClient<any>(`/favorites/check/?book_id=${bookId}`),
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

export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "/images/placeholder_book.png";
  
  // If it's already a full URL (from S3 or elsewhere), use it directly
  if (path.startsWith("http")) return path;
  
  const cleanPath = path.replace(/^\//, '');
  
  // Priority 1: Check if S3 is configured in environment
  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
  if (s3Bucket) {
    // If the path already includes 'media/', don't add it again
    const finalPath = cleanPath.startsWith('media/') ? cleanPath : cleanPath;
    return `https://${s3Bucket}.s3.amazonaws.com/${finalPath}`;
  }

  // Priority 2: Use API Server URL with 'media/' prefix for local files
  let baseUrl = "https://api.our-novel.com";
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      baseUrl = envUrl.replace(/\/api\/?$/, '');
    }
  }

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }
  
  const finalPath = cleanPath.startsWith('media/') ? cleanPath : `media/${cleanPath}`;
  return `${baseUrl}/${finalPath}`;
}
