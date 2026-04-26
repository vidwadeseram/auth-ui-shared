import { z } from "zod";
import { ApiError } from "./errors.js";

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string | null) => void;
  onAuthFailure?: () => void;
}

interface RefreshPromise {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export interface ApiClient {
  auth: {
    register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<any>;
    login: (data: { email: string; password: string }) => Promise<any>;
    logout: (refreshToken: string) => Promise<any>;
    refresh: (refreshToken: string) => Promise<any>;
    me: () => Promise<any>;
    verifyEmail: (token: string) => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: (token: string, newPassword: string) => Promise<any>;
  };
  admin: {
    listRoles: () => Promise<any>;
    listPermissions: () => Promise<any>;
    getRolePermissions: (roleId: string) => Promise<any>;
    assignPermission: (roleId: string, permissionId: string) => Promise<any>;
    removePermission: (roleId: string, permissionId: string) => Promise<any>;
    listUsers: () => Promise<any>;
    getUser: (userId: string) => Promise<any>;
    updateUser: (userId: string, data: Record<string, unknown>) => Promise<any>;
    deleteUser: (userId: string) => Promise<any>;
    getUserPermissions: (userId: string) => Promise<any>;
    assignRole: (userId: string, roleId: string) => Promise<any>;
    removeRole: (userId: string, roleId: string) => Promise<any>;
  };
  tenant: {
    list: () => Promise<any>;
    create: (data: { name: string; slug?: string }) => Promise<any>;
    get: (tenantId: string) => Promise<any>;
    update: (tenantId: string, data: Record<string, unknown>) => Promise<any>;
    delete: (tenantId: string) => Promise<any>;
    listMembers: (tenantId: string) => Promise<any>;
    invite: (tenantId: string, email: string) => Promise<any>;
    acceptInvitation: (tenantId: string, token: string) => Promise<any>;
    updateMemberRole: (tenantId: string, userId: string, roleId: string) => Promise<any>;
    removeMember: (tenantId: string, userId: string) => Promise<any>;
  };
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  let isRefreshing = false;
  let refreshPromise: RefreshPromise | null = null;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { skipAuth?: boolean; rawResponse?: boolean }
  ): Promise<T> {
    const url = `${config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!opts?.skipAuth) {
      const token = config.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !opts?.skipAuth) {
      const newToken = await refreshToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse<T>(retryRes);
      }
    }

    return handleResponse<T>(res);
  }

  async function handleResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!text) {
      if (!res.ok) throw new ApiError(res.status, "UNKNOWN", `HTTP ${res.status}`);
      return undefined as T;
    }

    let json: any;
    try { json = JSON.parse(text); } catch { throw new ApiError(res.status, "PARSE_ERROR", text); }

    if (!res.ok) {
      const err = json?.error;
      throw new ApiError(res.status, err?.code || "UNKNOWN", err?.message || `HTTP ${res.status}`);
    }

    return (json?.data ?? json) as T;
  }

  async function refreshToken(): Promise<string | null> {
    if (isRefreshing && refreshPromise) {
      return new Promise<string>((resolve, reject) => {
        refreshPromise!.resolve = resolve;
        refreshPromise!.reject = reject;
      });
    }

    const rt = config.getRefreshToken();
    if (!rt) {
      config.onAuthFailure?.();
      return null;
    }

    isRefreshing = true;
    refreshPromise = { resolve: () => {}, reject: () => {} };

    try {
      const res = await fetch(`${config.baseUrl}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });

      const json = await res.json();
      if (!res.ok || !json?.data) {
        config.setAccessToken(null);
        config.setRefreshToken(null);
        config.onAuthFailure?.();
        return null;
      }

      config.setAccessToken(json.data.access_token);
      config.setRefreshToken(json.data.refresh_token);
      return json.data.access_token;
    } catch {
      config.onAuthFailure?.();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  const auth = {
    register: (data) => request("POST", "/api/v1/auth/register", data, { skipAuth: true }),
    login: (data) => request("POST", "/api/v1/auth/login", data, { skipAuth: true }),
    logout: (rt) => request("POST", "/api/v1/auth/logout", { refresh_token: rt }),
    refresh: (rt) => request("POST", "/api/v1/auth/refresh", { refresh_token: rt }, { skipAuth: true }),
    me: () => request("GET", "/api/v1/auth/me"),
    verifyEmail: (token) => request("POST", "/api/v1/auth/verify-email", { token }, { skipAuth: true }),
    forgotPassword: (email) => request("POST", "/api/v1/auth/forgot-password", { email }, { skipAuth: true }),
    resetPassword: (token, newPassword) => request("POST", "/api/v1/auth/reset-password", { token, new_password: newPassword }, { skipAuth: true }),
  };

  const admin = {
    listRoles: () => request("GET", "/api/v1/admin/roles"),
    listPermissions: () => request("GET", "/api/v1/admin/permissions"),
    getRolePermissions: (id) => request("GET", `/api/v1/admin/roles/${id}/permissions`),
    assignPermission: (roleId, permissionId) => request("POST", "/api/v1/admin/roles/permissions", { role_id: roleId, permission_id: permissionId }),
    removePermission: (roleId, permissionId) => request("DELETE", "/api/v1/admin/roles/permissions", { role_id: roleId, permission_id: permissionId }),
    listUsers: () => request("GET", "/api/v1/admin/users"),
    getUser: (id) => request("GET", `/api/v1/admin/users/${id}`),
    updateUser: (id, data) => request("PATCH", `/api/v1/admin/users/${id}/patch`, data),
    deleteUser: (id) => request("DELETE", `/api/v1/admin/users/${id}`),
    getUserPermissions: (id) => request("GET", `/api/v1/admin/users/${id}/permissions`),
    assignRole: (userId, roleId) => request("POST", "/api/v1/admin/users/roles", { user_id: userId, role_id: roleId }),
    removeRole: (userId, roleId) => request("DELETE", "/api/v1/admin/users/roles", { user_id: userId, role_id: roleId }),
  };

  const tenant = {
    list: () => request("GET", "/api/v1/tenants"),
    create: (data) => request("POST", "/api/v1/tenants", data),
    get: (id) => request("GET", `/api/v1/tenants/${id}`),
    update: (id, data) => request("PATCH", `/api/v1/tenants/${id}`, data),
    delete: (id) => request("DELETE", `/api/v1/tenants/${id}`),
    listMembers: (id) => request("GET", `/api/v1/tenants/${id}/members`),
    invite: (id, email) => request("POST", `/api/v1/tenants/${id}/invitations`, { email }),
    acceptInvitation: (id: string, token: string) => request("POST", `/api/v1/tenants/${id}/invitations/accept`, { token }),
    updateMemberRole: (id: string, uid: string, rid: string) => request("PATCH", `/api/v1/tenants/${id}/members/${uid}/role`, { role_id: rid }),
    removeMember: (id: string, uid: string) => request("DELETE", `/api/v1/tenants/${id}/members/${uid}`),
  };

  return { auth, admin, tenant };
}
