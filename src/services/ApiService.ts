import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import axiosRetry from "axios-retry";

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  errorCode: string;
  message: string;
  path: string;
  errors: ApiErrorDetail[];
}

export class ApiError extends Error {
  errorCode: string;

  constructor(errorCode: string, message: string) {
    super(message);
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return Boolean(obj && typeof obj === "object" && "errorCode" in obj && "message" in obj);
}

export function extractErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error) && error.response?.data && isApiErrorResponse(error.response.data)) {
    const data = error.response.data;
    return data.errorCode;
  }
  if (error instanceof ApiError) {
    return error.errorCode;
  }
  if (error && typeof error === "object" && "errorCode" in error && typeof error.errorCode === "string") {
    return error.errorCode;
  }
  return null;
}

let refreshFn: (() => Promise<string>) | null = null;
let refreshPromise: Promise<string> | null = null;
let logoutFn: (() => void) | null = null;
const REFRESH_LOCK_NAME = "edu-trainer-auth-refresh";

export function registerRefreshFn(fn: () => Promise<string>) {
  refreshFn = fn;
}

async function performRefresh(rejectedAccessToken?: string | null): Promise<string> {
  const registeredRefresh = refreshFn;
  if (!registeredRefresh) {
    throw new Error("Refresh handler is not registered");
  }

  const lockManager = typeof navigator !== "undefined" && "locks" in navigator ? navigator.locks : null;
  if (!lockManager) {
    return await registeredRefresh();
  }

  return await lockManager.request(REFRESH_LOCK_NAME, async () => {
    const currentAccessToken = localStorage.getItem("token");
    if (rejectedAccessToken !== undefined && currentAccessToken && currentAccessToken !== rejectedAccessToken) {
      return currentAccessToken;
    }
    return await registeredRefresh();
  });
}

export function refreshAccessToken(rejectedAccessToken?: string | null): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh(rejectedAccessToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function extractBearerToken(config: AxiosRequestConfig): string | undefined {
  const headers = config.headers as (Record<string, unknown> & { get?: (name: string) => unknown }) | undefined;
  const authorization =
    typeof headers?.get === "function"
      ? headers.get("Authorization")
      : (headers?.Authorization ?? headers?.authorization);
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return undefined;
  }
  return authorization.substring(7);
}

export function registerLogoutFn(fn: typeof logoutFn) {
  logoutFn = fn;
}

// 1. Create axios instance with baseURL & JSON headers
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BE_REST_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  // Treat 4xx as errors but only throw on 5xx by default
  validateStatus: (status) => status < 400,
});

// 2. Retry on network errors / 5xx up to 3 times
axiosRetry(apiClient, {
  retries: 0,
  retryDelay: axiosRetry.exponentialDelay,
});

// 3. Request interceptor: inject auth token if present
apiClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {};
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response interceptor: centralized logging & error handling, Handle 401 by refreshing token and retrying once
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    console.error("API Error - in:", error.response?.status, error.response?.data);
    const originalConfig = (error.config ?? {}) as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    // On 401, attempt refresh only once and skip if refresh endpoint itself
    if (status === 401 && !originalConfig._retry) {
      // Avoid infinite loop: do not retry the refresh endpoint.
      if (originalConfig.url?.endsWith("/auth/session/refresh")) {
        logoutFn?.();
        return Promise.reject(error);
      }
      if (
        originalConfig.url?.endsWith("/auth/login") ||
        originalConfig.url?.endsWith("/auth/login/telegram") ||
        originalConfig.url?.endsWith("/auth/registration")
      ) {
        logoutFn?.();
        return Promise.reject(error);
      }

      originalConfig._retry = true;
      try {
        await refreshAccessToken(extractBearerToken(originalConfig));
        return apiClient.request(originalConfig);
      } catch (refreshError) {
        // Refresh failed: clear token and stop
        console.error("Refresh - API Error:", refreshError);
        logoutFn?.();
        return Promise.reject(error);
      }
    }

    // All other errors
    if (error.response) {
      console.error("API Error: Response.", error.message, error.response.status, error.response.data);
      return Promise.reject(error);
    } else if (error.request) {
      console.error("API Error: No response received : Request.", error.message, error.request);
    } else {
      console.error("API Error:", error.message);
    }
    return Promise.reject(new ApiError("TECHNICAL_ERROR", "Technical error"));
  }
);

// 5. Generic HTTP methods returning `response.data`
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.get<T>(url, config)).data;

export const post = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.post<T>(url, data, config)).data;

export const put = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.put<T>(url, data, config)).data;

export const patch = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.patch<T>(url, data, config)).data;

export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  (await apiClient.delete<T>(url, config)).data;

// 6. Default export for easy imports
export default {
  get,
  post,
  put,
  patch,
  del,
};
