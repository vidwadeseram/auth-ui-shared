import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { z } from 'zod';

interface ApiClientConfig {
    baseUrl: string;
    getAccessToken: () => string | null;
    setAccessToken: (token: string | null) => void;
    getRefreshToken: () => string | null;
    setRefreshToken: (token: string | null) => void;
    onAuthFailure?: () => void;
}
interface ApiClient {
    get<T = any>(path: string): Promise<T>;
    post<T = any>(path: string, body?: unknown): Promise<T>;
    patch<T = any>(path: string, body?: unknown): Promise<T>;
    delete<T = any>(path: string, body?: unknown): Promise<T>;
    auth: {
        register: (data: {
            email: string;
            password: string;
            first_name: string;
            last_name: string;
        }) => Promise<any>;
        login: (data: {
            email: string;
            password: string;
        }) => Promise<any>;
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
        create: (data: {
            name: string;
            slug?: string;
        }) => Promise<any>;
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
declare function createApiClient(config: ApiClientConfig): ApiClient;

declare class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string);
}

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
    register: (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    verifyEmail: (token: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
}
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
declare function AuthProvider({ baseUrl, children, onAuthFailure, tokenStorage }: AuthProviderProps): react_jsx_runtime.JSX.Element;
declare function useAuth(): AuthContextType;

declare const authUserResponseSchema: z.ZodObject<{
    data: z.ZodAny;
}, z.core.$strip>;
type AuthUserResponse = z.infer<typeof authUserResponseSchema>;
declare const forgotPasswordRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
declare const hTTPValidationErrorSchema: z.ZodObject<{
    detail: z.ZodOptional<z.ZodArray<z.ZodAny>>;
}, z.core.$strip>;
type HTTPValidationError = z.infer<typeof hTTPValidationErrorSchema>;
declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
type LoginRequest = z.infer<typeof loginRequestSchema>;
declare const logoutRequestSchema: z.ZodObject<{
    refresh_token: z.ZodString;
}, z.core.$strip>;
type LogoutRequest = z.infer<typeof logoutRequestSchema>;
declare const messageDataSchema: z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>;
type MessageData = z.infer<typeof messageDataSchema>;
declare const messageResponseSchema: z.ZodObject<{
    data: z.ZodAny;
}, z.core.$strip>;
type MessageResponse = z.infer<typeof messageResponseSchema>;
declare const permissionResponseSchema: z.ZodObject<{
    id: z.ZodUUID;
    name: z.ZodString;
    description: z.ZodString;
    created_at: z.ZodISODateTime;
}, z.core.$strip>;
type PermissionResponse = z.infer<typeof permissionResponseSchema>;
declare const refreshTokenRequestSchema: z.ZodObject<{
    refresh_token: z.ZodString;
}, z.core.$strip>;
type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
declare const registerRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
}, z.core.$strip>;
type RegisterRequest = z.infer<typeof registerRequestSchema>;
declare const resetPasswordRequestSchema: z.ZodObject<{
    token: z.ZodString;
    new_password: z.ZodString;
}, z.core.$strip>;
type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
declare const rolePermissionRequestSchema: z.ZodObject<{
    role_id: z.ZodUUID;
    permission_id: z.ZodUUID;
}, z.core.$strip>;
type RolePermissionRequest = z.infer<typeof rolePermissionRequestSchema>;
declare const roleResponseSchema: z.ZodObject<{
    id: z.ZodUUID;
    name: z.ZodString;
    description: z.ZodString;
    created_at: z.ZodISODateTime;
}, z.core.$strip>;
type RoleResponse = z.infer<typeof roleResponseSchema>;
declare const tokenDataSchema: z.ZodObject<{
    access_token: z.ZodString;
    refresh_token: z.ZodString;
    token_type: z.ZodOptional<z.ZodString>;
    expires_in: z.ZodNumber;
}, z.core.$strip>;
type TokenData = z.infer<typeof tokenDataSchema>;
declare const tokenResponseSchema: z.ZodObject<{
    data: z.ZodAny;
}, z.core.$strip>;
type TokenResponse = z.infer<typeof tokenResponseSchema>;
declare const userEnvelopeSchema: z.ZodObject<{
    user: z.ZodAny;
    message: z.ZodString;
}, z.core.$strip>;
type UserEnvelope = z.infer<typeof userEnvelopeSchema>;
declare const userListResponseSchema: z.ZodObject<{
    id: z.ZodUUID;
    email: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
    is_active: z.ZodBoolean;
    is_verified: z.ZodBoolean;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodISODateTime;
}, z.core.$strip>;
type UserListResponse = z.infer<typeof userListResponseSchema>;
declare const userReadSchema: z.ZodObject<{
    id: z.ZodUUID;
    email: z.ZodEmail;
    first_name: z.ZodString;
    last_name: z.ZodString;
    is_active: z.ZodBoolean;
    is_verified: z.ZodBoolean;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodISODateTime;
}, z.core.$strip>;
type UserRead = z.infer<typeof userReadSchema>;
declare const userResponseSchema: z.ZodObject<{
    data: z.ZodAny;
}, z.core.$strip>;
type UserResponse = z.infer<typeof userResponseSchema>;
declare const userRoleRequestSchema: z.ZodObject<{
    user_id: z.ZodUUID;
    role_id: z.ZodUUID;
}, z.core.$strip>;
type UserRoleRequest = z.infer<typeof userRoleRequestSchema>;
declare const userUpdateRequestSchema: z.ZodObject<{
    first_name: z.ZodOptional<z.ZodAny>;
    last_name: z.ZodOptional<z.ZodAny>;
    is_active: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
type UserUpdateRequest = z.infer<typeof userUpdateRequestSchema>;
declare const validationErrorSchema: z.ZodObject<{
    loc: z.ZodArray<z.ZodAny>;
    msg: z.ZodString;
    type: z.ZodString;
    input: z.ZodOptional<z.ZodAny>;
    ctx: z.ZodOptional<z.ZodObject<{}, z.core.$strip>>;
}, z.core.$strip>;
type ValidationError = z.infer<typeof validationErrorSchema>;
declare const verifyEmailRequestSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export { type ApiClient, type ApiClientConfig, ApiError, AuthProvider, type AuthUserResponse, type ForgotPasswordRequest, type HTTPValidationError, type LoginRequest, type LogoutRequest, type MessageData, type MessageResponse, type PermissionResponse, type RefreshTokenRequest, type RegisterRequest, type ResetPasswordRequest, type RolePermissionRequest, type RoleResponse, type TokenData, type TokenResponse, type UserEnvelope, type UserListResponse, type UserRead, type UserResponse, type UserRoleRequest, type UserUpdateRequest, type ValidationError, type VerifyEmailRequest, authUserResponseSchema, createApiClient, forgotPasswordRequestSchema, hTTPValidationErrorSchema, loginRequestSchema, logoutRequestSchema, messageDataSchema, messageResponseSchema, permissionResponseSchema, refreshTokenRequestSchema, registerRequestSchema, resetPasswordRequestSchema, rolePermissionRequestSchema, roleResponseSchema, tokenDataSchema, tokenResponseSchema, useAuth, userEnvelopeSchema, userListResponseSchema, userReadSchema, userResponseSchema, userRoleRequestSchema, userUpdateRequestSchema, validationErrorSchema, verifyEmailRequestSchema };
