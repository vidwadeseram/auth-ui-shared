import { ApiError } from "./errors.js";
import type { DataResponse, ListResponse, UserData, RoleData, PermissionData, TenantData, TenantMemberData } from "../types/api.js";
import type { TokenData, MessageResponse } from "../types/generated.js";

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string | null) => void;
  onAuthFailure?: () => void;
}

export interface ApiClient {
  get<T = unknown>(path: string): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown): Promise<T>;
  delete<T = unknown>(path: string, body?: unknown): Promise<T>;
  auth: {
    register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<DataResponse<{ user: UserData; message: string }>>;
    login: (data: { email: string; password: string }) => Promise<DataResponse<TokenData>>;
    logout: (refreshToken: string) => Promise<MessageResponse>;
    refresh: (refreshToken: string) => Promise<DataResponse<TokenData>>;
    me: () => Promise<DataResponse<UserData>>;
    verifyEmail: (token: string) => Promise<MessageResponse>;
    forgotPassword: (email: string) => Promise<MessageResponse>;
    resetPassword: (token: string, newPassword: string) => Promise<MessageResponse>;
  };
  admin: {
    listRoles: () => Promise<ListResponse<RoleData>>;
    listPermissions: () => Promise<ListResponse<PermissionData>>;
    getRolePermissions: (roleId: string) => Promise<ListResponse<PermissionData>>;
    assignPermission: (roleId: string, permissionId: string) => Promise<MessageResponse>;
    removePermission: (roleId: string, permissionId: string) => Promise<MessageResponse>;
    listUsers: () => Promise<ListResponse<UserData>>;
    getUser: (userId: string) => Promise<DataResponse<UserData>>;
    updateUser: (userId: string, data: Record<string, unknown>) => Promise<DataResponse<UserData>>;
    deleteUser: (userId: string) => Promise<MessageResponse>;
    getUserPermissions: (userId: string) => Promise<ListResponse<PermissionData>>;
    assignRole: (userId: string, roleId: string) => Promise<MessageResponse>;
    removeRole: (userId: string, roleId: string) => Promise<MessageResponse>;
  };
  tenant: {
    list: () => Promise<ListResponse<TenantData>>;
    create: (data: { name: string; slug?: string }) => Promise<DataResponse<TenantData>>;
    get: (tenantId: string) => Promise<DataResponse<TenantData>>;
    update: (tenantId: string, data: Record<string, unknown>) => Promise<DataResponse<TenantData>>;
    delete: (tenantId: string) => Promise<MessageResponse>;
    listMembers: (tenantId: string) => Promise<ListResponse<TenantMemberData>>;
    invite: (tenantId: string, email: string) => Promise<DataResponse<{ id: string; email: string; expires_at: string; token: string }>>;
    acceptInvitation: (tenantId: string, token: string) => Promise<MessageResponse>;
    updateMemberRole: (tenantId: string, userId: string, roleId: string) => Promise<MessageResponse>;
    removeMember: (tenantId: string, userId: string) => Promise<MessageResponse>;
  };
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  let refreshInFlight: Promise<string | null> | null = null;

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
        return handleResponse<T>(retryRes, opts?.rawResponse);
      }
    }

    return handleResponse<T>(res, opts?.rawResponse);
  }

  async function handleResponse<T>(res: Response, raw?: boolean): Promise<T> {
    const text = await res.text();
    if (!text) {
      if (!res.ok) throw new ApiError(res.status, "UNKNOWN", `HTTP ${res.status}`);
      return undefined as T;
    }

    let json: Record<string, unknown>;
    try { json = JSON.parse(text); } catch { throw new ApiError(res.status, "PARSE_ERROR", text); }

    if (!res.ok) {
      const err = json.error as Record<string, string> | undefined;
      throw new ApiError(res.status, err?.code || "UNKNOWN", err?.message || `HTTP ${res.status}`);
    }

    if (raw) return json as T;
    return (json.data ?? json) as T;
  }

  async function refreshToken(): Promise<string | null> {
    if (refreshInFlight) return refreshInFlight;

    const rt = config.getRefreshToken();
    if (!rt) {
      config.onAuthFailure?.();
      return null;
    }

    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${config.baseUrl}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: rt }),
        });

        const json = (await res.json()) as Record<string, unknown>;
        const data = json.data as Record<string, string> | undefined;
        if (!res.ok || !data) {
          config.setAccessToken(null);
          config.setRefreshToken(null);
          config.onAuthFailure?.();
          return null;
        }

        config.setAccessToken(data.access_token);
        config.setRefreshToken(data.refresh_token);
        return data.access_token;
      } catch (err) {
        console.warn("Token refresh failed:", err instanceof Error ? err.message : err);
        config.onAuthFailure?.();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  const auth: ApiClient["auth"] = {
    register: (data) => request("POST", "/api/v1/auth/register", data, { skipAuth: true }),
    login: (data) => request("POST", "/api/v1/auth/login", data, { skipAuth: true }),
    logout: (rt) => request("POST", "/api/v1/auth/logout", { refresh_token: rt }),
    refresh: (rt) => request("POST", "/api/v1/auth/refresh", { refresh_token: rt }, { skipAuth: true }),
    me: () => request("GET", "/api/v1/auth/me"),
    verifyEmail: (token) => request("POST", "/api/v1/auth/verify-email", { token }, { skipAuth: true }),
    forgotPassword: (email) => request("POST", "/api/v1/auth/forgot-password", { email }, { skipAuth: true }),
    resetPassword: (token, newPassword) => request("POST", "/api/v1/auth/reset-password", { token, new_password: newPassword }, { skipAuth: true }),
  };

  const admin: ApiClient["admin"] = {
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

  const tenant: ApiClient["tenant"] = {
    list: () => request("GET", "/api/v1/tenants"),
    create: (data) => request("POST", "/api/v1/tenants", data),
    get: (id) => request("GET", `/api/v1/tenants/${id}`),
    update: (id, data) => request("PATCH", `/api/v1/tenants/${id}`, data),
    delete: (id) => request("DELETE", `/api/v1/tenants/${id}`),
    listMembers: (id) => request("GET", `/api/v1/tenants/${id}/members`),
    invite: (id, email) => request("POST", `/api/v1/tenants/${id}/invitations`, { email }),
    acceptInvitation: (id, token) => request("POST", `/api/v1/tenants/${id}/invitations/accept`, { token }),
    updateMemberRole: (id, uid, rid) => request("PATCH", `/api/v1/tenants/${id}/members/${uid}/role`, { role_id: rid }),
    removeMember: (id, uid) => request("DELETE", `/api/v1/tenants/${id}/members/${uid}`),
  };

  return {
    get: <T = any>(path: string) => request<T>("GET", path, undefined, { rawResponse: true }),
    post: <T = any>(path: string, body?: unknown) => request<T>("POST", path, body, { rawResponse: true }),
    patch: <T = any>(path: string, body?: unknown) => request<T>("PATCH", path, body, { rawResponse: true }),
    delete: <T = any>(path: string, body?: unknown) => request<T>("DELETE", path, body, { rawResponse: true }),
    auth,
    admin,
    tenant,
  };
}
