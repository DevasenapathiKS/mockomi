"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { api, setAuthToken, setUnauthorizedHandler } from '@/lib/http';
import type { ApiSuccess, AuthResult, AuthUser } from '@/types/api';
import { extractErrorMessage } from '@/utils/errors';

const TOKEN_KEY = 'mockomi_token';
const USER_KEY = 'mockomi_user';

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);
  const [isAuthenticating, setAuthenticating] = useState(false);

  const persistSession = useCallback((payload: AuthResult) => {
    setUser(payload.user);
    setToken(payload.token);
    setAuthToken(payload.token);
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.replace('/auth/login');
  }, [clearSession, router]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      toast.error('Your session expired. Please log in again.');
      router.replace('/auth/login');
    });
  }, [clearSession, router]);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser(parsedUser);
        setToken(storedToken);
        setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to restore session', error);
      clearSession();
    } finally {
      setBootstrapping(false);
    }
  }, [clearSession]);

  const resolveLandingRoute = useCallback((role: AuthUser['role']) => {
    if (role === 'candidate') return '/dashboard';
    if (role === 'interviewer') return '/sessions';
    return '/dashboard';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthenticating(true);
    try {
      const response = await api.post<ApiSuccess<AuthResult>>('/api/auth/login', {
        email,
        password,
      });

      persistSession(response.data.data);
      toast.success('Welcome back!');
      router.replace(resolveLandingRoute(response.data.data.user.role));
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setAuthenticating(false);
    }
  }, [persistSession, resolveLandingRoute, router]);

  const register = useCallback(async (email: string, password: string) => {
    setAuthenticating(true);
    try {
      await api.post('/api/auth/register', { email, password });
      toast.success('Account created. Signing you in...');
      await login(email, password);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setAuthenticating(false);
    }
  }, [login]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isBootstrapping,
    isAuthenticating,
    login,
    register,
    logout,
  }), [isAuthenticating, isBootstrapping, login, logout, register, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
