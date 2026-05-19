import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ERROR_CODES } from "./apiError";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const TOKEN_KEY = "psyclinic_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Normalize every error into the ApiError contract so callers never have
// to inspect raw axios errors.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      const netErr: ApiError = {
        status: 0,
        code: ERROR_CODES.NETWORK,
        message:
          "Could not reach the server. Check your connection and that the API is running.",
      };
      return Promise.reject(netErr);
    }

    const { status, data } = error.response;
    const body = (data ?? {}) as Record<string, unknown>;

    const apiErr: ApiError = {
      status,
      code:
        (body.code as string) ||
        (status === 401 ? ERROR_CODES.UNAUTHORIZED : ERROR_CODES.UNKNOWN),
      message:
        (body.error as string) ||
        (status === 401
          ? "You need to sign in to continue."
          : "Something went wrong."),
      detail: body.detail as string | undefined,
      details: body.details as string[] | undefined,
    };
    return Promise.reject(apiErr);
  }
);
