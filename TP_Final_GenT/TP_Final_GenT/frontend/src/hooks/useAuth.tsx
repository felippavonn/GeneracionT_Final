/**
 * Auth Hook - Estado global de autenticación
 * Reserva Club Frontend
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================
// Tipos
// ============================================

export type UserRole = 'admin' | 'socio' | 'no_socio';

export interface User {
  id: string;
  email: string;
  rol: UserRole;
  cuotaVigenteHasta: string | null;
  bloqueadoHasta: string | null;
  deudaPendiente: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================
// Storage Keys
// ============================================

const ACCESS_TOKEN_KEY = 'rc_access_token';

// ============================================
// Helpers de storage (solo access token en memory + localStorage backup)
// ============================================

function getStoredTokens(): { accessToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null };
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  };
}

function setStoredTokens(accessToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ============================================
// Auth Context
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const queryClient = useQueryClient();

  // Inicializar: cargar tokens de localStorage y validar
  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        setState(prev => ({ ...prev, accessToken, isLoading: true }));
        try {
          await refreshUserData(accessToken);
        } catch {
          clearStoredTokens();
          setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);

  const refreshUserData = async (token: string): Promise<void> => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState({
        user: response.data,
        accessToken: token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      throw new Error('Token inválido');
    }
  };

  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.post('/auth/login', { email, password });
      return response.data; // { accessToken, user }
    },
    onSuccess: (data) => {
      setStoredTokens(data.accessToken);
      setState({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });

  const register = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.post('/auth/register', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      setStoredTokens(data.accessToken);
      setState({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorar errores de logout
    } finally {
      clearStoredTokens();
      queryClient.clear();
      setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (state.accessToken) {
      await refreshUserData(state.accessToken);
    }
  }, [state.accessToken]);

  const value: AuthContextType = {
    ...state,
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

// ============================================
// Helpers para api client (acceso a tokens)
// ============================================

export function getAuthTokens(): { accessToken: string | null; refreshToken: string | null } {
  // Access token viene del context (en memoria), refresh token está en cookie HttpOnly
  return {
    accessToken: getStoredTokens().accessToken,
    refreshToken: null, // Manejado por backend via cookie
  };
}

export function setAuthTokens(accessToken: string, _refreshToken: string): void {
  setStoredTokens(accessToken);
}

export function clearAuthTokens(): void {
  clearStoredTokens();
}