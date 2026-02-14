"use client";

import axios from "axios";
import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { api } from "@/src/lib/api";

export type AuthUser = Record<string, unknown> | null;

export type AuthContextValue = {
  user: AuthUser;
  token: string | null;
  isInitialized: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const TOKEN_STORAGE_KEY = "token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthState = {
  user: AuthUser;
  token: string | null;
  isInitialized: boolean;
};

const authStore = (() => {
  let state: AuthState = { user: null, token: null, isInitialized: false };
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const l of listeners) l();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return state;
    },
    setState(partial: Partial<AuthState>) {
      state = { ...state, ...partial };
      emit();
    },
  };
})();

function safeEnvelope(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const maybe = data as { data?: unknown };
  return maybe.data !== undefined ? maybe.data : data;
}

function extractUser(data: unknown): AuthUser {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const candidate = obj.user !== undefined ? obj.user : payload;
  return candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  useEffect(() => {
    let cancelled = false;

    const clearAuth = () => {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
      authStore.setState({ token: null, user: null });
    };

    const init = async () => {
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        storedToken = null;
      }

      if (!storedToken) {
        if (cancelled) return;
        authStore.setState({ token: null, user: null, isInitialized: true });
        return;
      }

      if (cancelled) return;
      authStore.setState({ token: storedToken, user: null });

      try {
        const res = await api.get("/api/auth/me");
        const me = extractUser(res.data);
        if (!me) throw new Error("Invalid user response.");
        if (cancelled) return;
        authStore.setState({ user: me, isInitialized: true });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) || err instanceof Error) {
          // treat any failure as invalid session
        }
        if (cancelled) return;
        clearAuth();
        authStore.setState({ isInitialized: true });
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const login = (newToken: string, newUser: AuthUser) => {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      } catch {
        // ignore storage failures
      }
      authStore.setState({ token: newToken, user: newUser, isInitialized: true });
    };

    const logout = () => {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
      authStore.setState({ token: null, user: null, isInitialized: true });
    };

    return {
      user: snapshot.user,
      token: snapshot.token,
      isInitialized: snapshot.isInitialized,
      login,
      logout,
    };
  }, [snapshot.isInitialized, snapshot.token, snapshot.user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

