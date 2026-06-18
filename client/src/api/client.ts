// api/client.ts - Shared axios instance with Firebase token + error handling.
//
// Single instance for the whole app so we get:
//   - Authorization header set once via an interceptor
//   - Consistent baseURL and credentials behaviour
//   - Central place to log/transform errors
//
// AuthContext calls setAuthToken() whenever the Firebase ID token changes.

import axios, { AxiosError, type AxiosInstance } from "axios";

let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60_000,
});

apiClient.interceptors.request.use((config) => {
  if (currentToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Let the auth layer handle redirect; just surface the error.
      console.warn("[api] 401 - session likely expired");
    }
    return Promise.reject(error);
  },
);

export type ApiError = AxiosError<{ error?: string; message?: string }>;

export const apiErrorMessage = (err: unknown): string => {
  const e = err as ApiError;
  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    "Something went wrong"
  );
};
