/**
 * API Client - Axios instance con interceptors
 * Reserva Club Frontend
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthTokens, setAuthTokens, clearAuthTokens } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Para cookies HttpOnly (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Request Interceptor - Adjuntar access token
// ============================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = getAuthTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// Response Interceptor - Auto-refresh en 401
// ============================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si no es 401 o ya reintentamos, rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Marcar como reintentado
    originalRequest._retry = true;

    // Si ya hay refresh en progreso, encolar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // Intentar refresh token (se envía automáticamente via cookie HttpOnly)
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
      const { accessToken } = response.data;

      // Actualizar tokens en memoria
      setAuthTokens(accessToken, ''); // refresh token se maneja via cookie

      // Procesar cola pendiente
      processQueue(null, accessToken);

      // Reintentar request original
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falló - limpiar auth y redirigir a login
      processQueue(refreshError as Error, null);
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ============================================
// Helpers de tipos para responses
// ============================================

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error) && !!error.response?.data;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}