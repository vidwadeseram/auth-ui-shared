// src/client/errors.ts
var ApiError = class extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
  status;
  code;
};

// src/client/api-client.ts
function createApiClient(config) {
  let isRefreshing = false;
  let refreshPromise = null;
  async function request(method, path, body, opts) {
    const url = `${config.baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json"
    };
    if (!opts?.skipAuth) {
      const token = config.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    if (res.status === 401 && !opts?.skipAuth) {
      const newToken = await refreshToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : void 0
        });
        return handleResponse(retryRes);
      }
    }
    return handleResponse(res);
  }
  async function handleResponse(res) {
    const text = await res.text();
    if (!text) {
      if (!res.ok) throw new ApiError(res.status, "UNKNOWN", `HTTP ${res.status}`);
      return void 0;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, "PARSE_ERROR", text);
    }
    if (!res.ok) {
      const err = json?.error;
      throw new ApiError(res.status, err?.code || "UNKNOWN", err?.message || `HTTP ${res.status}`);
    }
    return json?.data ?? json;
  }
  async function refreshToken() {
    if (isRefreshing && refreshPromise) {
      return new Promise((resolve, reject) => {
        refreshPromise.resolve = resolve;
        refreshPromise.reject = reject;
      });
    }
    const rt = config.getRefreshToken();
    if (!rt) {
      config.onAuthFailure?.();
      return null;
    }
    isRefreshing = true;
    refreshPromise = { resolve: () => {
    }, reject: () => {
    } };
    try {
      const res = await fetch(`${config.baseUrl}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt })
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
    resetPassword: (token, newPassword) => request("POST", "/api/v1/auth/reset-password", { token, new_password: newPassword }, { skipAuth: true })
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
    removeRole: (userId, roleId) => request("DELETE", "/api/v1/admin/users/roles", { user_id: userId, role_id: roleId })
  };
  const tenant = {
    list: () => request("GET", "/api/v1/tenants"),
    create: (data) => request("POST", "/api/v1/tenants", data),
    get: (id) => request("GET", `/api/v1/tenants/${id}`),
    update: (id, data) => request("PATCH", `/api/v1/tenants/${id}`, data),
    delete: (id) => request("DELETE", `/api/v1/tenants/${id}`),
    listMembers: (id) => request("GET", `/api/v1/tenants/${id}/members`),
    invite: (id, email) => request("POST", `/api/v1/tenants/${id}/invitations`, { email }),
    acceptInvitation: (id, token) => request("POST", `/api/v1/tenants/${id}/invitations/accept`, { token }),
    updateMemberRole: (id, uid, rid) => request("PATCH", `/api/v1/tenants/${id}/members/${uid}/role`, { role_id: rid }),
    removeMember: (id, uid) => request("DELETE", `/api/v1/tenants/${id}/members/${uid}`)
  };
  return { auth, admin, tenant };
}

// src/providers/auth-provider.tsx
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { jsx } from "react/jsx-runtime";
var AuthContext = createContext(null);
function AuthProvider({ baseUrl, children, onAuthFailure, tokenStorage }) {
  const [accessToken, setAccessToken] = useState(tokenStorage?.getAccessToken() ?? null);
  const [refreshToken, setRefreshToken] = useState(tokenStorage?.getRefreshToken() ?? null);
  const [user, setUser] = useState(null);
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
    }
  });
  useEffect(() => {
    if (accessToken) {
      api.auth.me().then((u) => setUser(u)).catch(() => setUser(null)).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);
  const login = useCallback(async (email, password) => {
    const data = await api.auth.login({ email, password });
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    tokenStorage?.setAccessToken(data.access_token);
    tokenStorage?.setRefreshToken(data.refresh_token);
    const me = await api.auth.me();
    setUser(me);
  }, [api]);
  const register = useCallback(async (data) => {
    await api.auth.register(data);
  }, [api]);
  const logout = useCallback(async () => {
    if (refreshToken) {
      await api.auth.logout(refreshToken).catch(() => {
      });
    }
    setAccessToken(null);
    setRefreshToken(null);
    tokenStorage?.setAccessToken(null);
    tokenStorage?.setRefreshToken(null);
    setUser(null);
  }, [api, refreshToken]);
  const verifyEmail = useCallback(async (token) => {
    await api.auth.verifyEmail(token);
  }, [api]);
  const forgotPassword = useCallback(async (email) => {
    await api.auth.forgotPassword(email);
  }, [api]);
  const resetPassword = useCallback(async (token, newPassword) => {
    await api.auth.resetPassword(token, newPassword);
  }, [api]);
  return /* @__PURE__ */ jsx(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        api,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword
      },
      children
    }
  );
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export {
  ApiError,
  AuthProvider,
  createApiClient,
  useAuth
};
//# sourceMappingURL=index.js.map