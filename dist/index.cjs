var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiError: () => ApiError,
  AuthProvider: () => AuthProvider,
  authUserResponseSchema: () => authUserResponseSchema,
  createApiClient: () => createApiClient,
  forgotPasswordRequestSchema: () => forgotPasswordRequestSchema,
  hTTPValidationErrorSchema: () => hTTPValidationErrorSchema,
  loginRequestSchema: () => loginRequestSchema,
  logoutRequestSchema: () => logoutRequestSchema,
  messageDataSchema: () => messageDataSchema,
  messageResponseSchema: () => messageResponseSchema,
  permissionResponseSchema: () => permissionResponseSchema,
  refreshTokenRequestSchema: () => refreshTokenRequestSchema,
  registerRequestSchema: () => registerRequestSchema,
  resetPasswordRequestSchema: () => resetPasswordRequestSchema,
  rolePermissionRequestSchema: () => rolePermissionRequestSchema,
  roleResponseSchema: () => roleResponseSchema,
  tokenDataSchema: () => tokenDataSchema,
  tokenResponseSchema: () => tokenResponseSchema,
  useAuth: () => useAuth,
  userEnvelopeSchema: () => userEnvelopeSchema,
  userListResponseSchema: () => userListResponseSchema,
  userReadSchema: () => userReadSchema,
  userResponseSchema: () => userResponseSchema,
  userRoleRequestSchema: () => userRoleRequestSchema,
  userUpdateRequestSchema: () => userUpdateRequestSchema,
  validationErrorSchema: () => validationErrorSchema,
  verifyEmailRequestSchema: () => verifyEmailRequestSchema
});
module.exports = __toCommonJS(index_exports);

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
  let refreshInFlight = null;
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
        return handleResponse(retryRes, opts?.rawResponse);
      }
    }
    return handleResponse(res, opts?.rawResponse);
  }
  async function handleResponse(res, raw) {
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
    if (raw) return json;
    return json?.data ?? json;
  }
  async function refreshToken() {
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
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
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
  return {
    get: (path) => request("GET", path, void 0, { rawResponse: true }),
    post: (path, body) => request("POST", path, body, { rawResponse: true }),
    patch: (path, body) => request("PATCH", path, body, { rawResponse: true }),
    delete: (path, body) => request("DELETE", path, body, { rawResponse: true }),
    auth,
    admin,
    tenant
  };
}

// src/providers/auth-provider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var AuthContext = (0, import_react.createContext)(null);
function normalizeUser(raw) {
  return {
    id: raw.id,
    email: raw.email,
    first_name: raw.first_name,
    last_name: raw.last_name,
    is_active: raw.is_active ?? true,
    is_verified: raw.is_verified ?? raw.email_verified ?? false,
    email_verified: raw.email_verified ?? raw.is_verified ?? false,
    role: raw.role ?? "user",
    created_at: raw.created_at ?? ""
  };
}
function AuthProvider({ baseUrl, children, onAuthFailure, tokenStorage }) {
  const [accessToken, setAccessToken] = (0, import_react.useState)(tokenStorage?.getAccessToken() ?? null);
  const [refreshToken, setRefreshToken] = (0, import_react.useState)(tokenStorage?.getRefreshToken() ?? null);
  const [user, setUser] = (0, import_react.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
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
  (0, import_react.useEffect)(() => {
    if (accessToken) {
      api.auth.me().then((u) => setUser(normalizeUser(u))).catch(() => setUser(null)).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);
  const login = (0, import_react.useCallback)(async (email, password) => {
    const data = await api.auth.login({ email, password });
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    tokenStorage?.setAccessToken(data.access_token);
    tokenStorage?.setRefreshToken(data.refresh_token);
    const me = await api.auth.me();
    setUser(normalizeUser(me));
  }, [api]);
  const register = (0, import_react.useCallback)(async (data) => {
    await api.auth.register(data);
  }, [api]);
  const logout = (0, import_react.useCallback)(async () => {
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
  const verifyEmail = (0, import_react.useCallback)(async (token) => {
    await api.auth.verifyEmail(token);
  }, [api]);
  const forgotPassword = (0, import_react.useCallback)(async (email) => {
    await api.auth.forgotPassword(email);
  }, [api]);
  const resetPassword = (0, import_react.useCallback)(async (token, newPassword) => {
    await api.auth.resetPassword(token, newPassword);
  }, [api]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    AuthContext.Provider,
    {
      value: {
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
        resetPassword
      },
      children
    }
  );
}
function useAuth() {
  const ctx = (0, import_react.useContext)(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// src/types/generated.ts
var import_zod = require("zod");
var authUserResponseSchema = import_zod.z.object({ data: import_zod.z.any() });
var forgotPasswordRequestSchema = import_zod.z.object({ email: import_zod.z.email() });
var hTTPValidationErrorSchema = import_zod.z.object({ detail: import_zod.z.array(import_zod.z.any()).optional() });
var loginRequestSchema = import_zod.z.object({ email: import_zod.z.email(), password: import_zod.z.string() });
var logoutRequestSchema = import_zod.z.object({ refresh_token: import_zod.z.string() });
var messageDataSchema = import_zod.z.object({ message: import_zod.z.string() });
var messageResponseSchema = import_zod.z.object({ data: import_zod.z.any() });
var permissionResponseSchema = import_zod.z.object({ id: import_zod.z.uuid(), name: import_zod.z.string(), description: import_zod.z.string(), created_at: import_zod.z.iso.datetime() });
var refreshTokenRequestSchema = import_zod.z.object({ refresh_token: import_zod.z.string() });
var registerRequestSchema = import_zod.z.object({ email: import_zod.z.email(), password: import_zod.z.string(), first_name: import_zod.z.string(), last_name: import_zod.z.string() });
var resetPasswordRequestSchema = import_zod.z.object({ token: import_zod.z.string(), new_password: import_zod.z.string() });
var rolePermissionRequestSchema = import_zod.z.object({ role_id: import_zod.z.uuid(), permission_id: import_zod.z.uuid() });
var roleResponseSchema = import_zod.z.object({ id: import_zod.z.uuid(), name: import_zod.z.string(), description: import_zod.z.string(), created_at: import_zod.z.iso.datetime() });
var tokenDataSchema = import_zod.z.object({ access_token: import_zod.z.string(), refresh_token: import_zod.z.string(), token_type: import_zod.z.string().optional(), expires_in: import_zod.z.number().int() });
var tokenResponseSchema = import_zod.z.object({ data: import_zod.z.any() });
var userEnvelopeSchema = import_zod.z.object({ user: import_zod.z.any(), message: import_zod.z.string() });
var userListResponseSchema = import_zod.z.object({ id: import_zod.z.uuid(), email: import_zod.z.string(), first_name: import_zod.z.string(), last_name: import_zod.z.string(), is_active: import_zod.z.boolean(), is_verified: import_zod.z.boolean(), created_at: import_zod.z.iso.datetime(), updated_at: import_zod.z.iso.datetime() });
var userReadSchema = import_zod.z.object({ id: import_zod.z.uuid(), email: import_zod.z.email(), first_name: import_zod.z.string(), last_name: import_zod.z.string(), is_active: import_zod.z.boolean(), is_verified: import_zod.z.boolean(), created_at: import_zod.z.iso.datetime(), updated_at: import_zod.z.iso.datetime() });
var userResponseSchema = import_zod.z.object({ data: import_zod.z.any() });
var userRoleRequestSchema = import_zod.z.object({ user_id: import_zod.z.uuid(), role_id: import_zod.z.uuid() });
var userUpdateRequestSchema = import_zod.z.object({ first_name: import_zod.z.any().optional(), last_name: import_zod.z.any().optional(), is_active: import_zod.z.any().optional() });
var validationErrorSchema = import_zod.z.object({ loc: import_zod.z.array(import_zod.z.any()), msg: import_zod.z.string(), type: import_zod.z.string(), input: import_zod.z.any().optional(), ctx: import_zod.z.object({}).optional() });
var verifyEmailRequestSchema = import_zod.z.object({ token: import_zod.z.string() });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiError,
  AuthProvider,
  authUserResponseSchema,
  createApiClient,
  forgotPasswordRequestSchema,
  hTTPValidationErrorSchema,
  loginRequestSchema,
  logoutRequestSchema,
  messageDataSchema,
  messageResponseSchema,
  permissionResponseSchema,
  refreshTokenRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  rolePermissionRequestSchema,
  roleResponseSchema,
  tokenDataSchema,
  tokenResponseSchema,
  useAuth,
  userEnvelopeSchema,
  userListResponseSchema,
  userReadSchema,
  userResponseSchema,
  userRoleRequestSchema,
  userUpdateRequestSchema,
  validationErrorSchema,
  verifyEmailRequestSchema
});
//# sourceMappingURL=index.cjs.map