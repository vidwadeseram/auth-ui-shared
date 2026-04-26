import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createApiClient, type ApiClient } from "../client/api-client.js";
import type { UserData } from "../types/api.js";

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  api: ApiClient;
  apiClient: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  baseUrl: string;
  children: React.ReactNode;
  onAuthFailure?: () => void;
  tokenStorage?: {
    getAccessToken: () => string | null;
    setAccessToken: (token: string | null) => void;
    getRefreshToken: () => string | null;
    setRefreshToken: (token: string | null) => void;
  };
}

function normalizeUser(raw: UserData): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    first_name: raw.first_name,
    last_name: raw.last_name,
    is_active: raw.is_active ?? true,
    is_verified: raw.email_verified ?? false,
    email_verified: raw.email_verified ?? false,
    role: raw.role ?? "user",
    created_at: raw.created_at ?? "",
  };
}

export function AuthProvider({ baseUrl, children, onAuthFailure, tokenStorage }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(tokenStorage?.getAccessToken() ?? null);
  const [refreshToken, setRefreshToken] = useState<string | null>(tokenStorage?.getRefreshToken() ?? null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const api = createApiClient({
    baseUrl,
    getAccessToken: () => accessToken,
    setAccessToken: (t) => {
      setAccessToken(t);
      tokenStorage?.setAccessToken(t);
    },
    getRefreshToken: () => refreshToken,
    setRefreshToken: (t) => {
      setRefreshToken(t);
      tokenStorage?.setRefreshToken(t);
    },
    onAuthFailure: () => {
      setUser(null);
      onAuthFailure?.();
    },
  });

  useEffect(() => {
    if (accessToken) {
      api.auth.me()
        .then((u) => setUser(normalizeUser(u.data)))
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setAccessToken(res.data.access_token);
    setRefreshToken(res.data.refresh_token);
    tokenStorage?.setAccessToken(res.data.access_token);
    tokenStorage?.setRefreshToken(res.data.refresh_token);
    const me = await api.auth.me();
    setUser(normalizeUser(me.data));
  }, [api]);

  const register = useCallback(async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    await api.auth.register(data);
  }, [api]);

  const logout = useCallback(async () => {
    if (refreshToken) {
      await api.auth.logout(refreshToken).catch(() => {});
    }
    setAccessToken(null);
    setRefreshToken(null);
    tokenStorage?.setAccessToken(null);
    tokenStorage?.setRefreshToken(null);
    setUser(null);
  }, [api, refreshToken]);

  const verifyEmail = useCallback(async (token: string) => {
    await api.auth.verifyEmail(token);
  }, [api]);

  const forgotPassword = useCallback(async (email: string) => {
    await api.auth.forgotPassword(email);
  }, [api]);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await api.auth.resetPassword(token, newPassword);
  }, [api]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        isLoading,
        isAuthenticated: !!user,
        api,
        apiClient: api,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
