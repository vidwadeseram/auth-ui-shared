import { z } from 'zod';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

interface UserData {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    email_verified: boolean;
    role: string;
    created_at: string;
    updated_at?: string;
}
interface RoleData {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}
interface PermissionData {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}
interface TenantData {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
interface TenantMemberData {
    id: string;
    tenant_id: string;
    user_id: string;
    role_id: string;
    is_active: boolean;
    joined_at: string;
    user_email?: string;
    role_name?: string;
}
interface DataResponse<T> {
    data: T;
}
interface ListResponse<T> {
    data: T[];
}

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

interface ApiClientConfig {
    baseUrl: string;
    getAccessToken: () => string | null;
    setAccessToken: (token: string | null) => void;
    getRefreshToken: () => string | null;
    setRefreshToken: (token: string | null) => void;
    onAuthFailure?: () => void;
}
interface ApiClient {
    get<T = unknown>(path: string): Promise<T>;
    post<T = unknown>(path: string, body?: unknown): Promise<T>;
    patch<T = unknown>(path: string, body?: unknown): Promise<T>;
    delete<T = unknown>(path: string, body?: unknown): Promise<T>;
    auth: {
        register: (data: {
            email: string;
            password: string;
            first_name: string;
            last_name: string;
        }) => Promise<DataResponse<{
            user: UserData;
            message: string;
        }>>;
        login: (data: {
            email: string;
            password: string;
        }) => Promise<DataResponse<TokenData>>;
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
        create: (data: {
            name: string;
            slug?: string;
        }) => Promise<DataResponse<TenantData>>;
        get: (tenantId: string) => Promise<DataResponse<TenantData>>;
        update: (tenantId: string, data: Record<string, unknown>) => Promise<DataResponse<TenantData>>;
        delete: (tenantId: string) => Promise<MessageResponse>;
        listMembers: (tenantId: string) => Promise<ListResponse<TenantMemberData>>;
        invite: (tenantId: string, email: string) => Promise<DataResponse<{
            id: string;
            email: string;
            expires_at: string;
            token: string;
        }>>;
        acceptInvitation: (tenantId: string, token: string) => Promise<MessageResponse>;
        updateMemberRole: (tenantId: string, userId: string, roleId: string) => Promise<MessageResponse>;
        removeMember: (tenantId: string, userId: string) => Promise<MessageResponse>;
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

export { type ApiClient, type ApiClientConfig, ApiError, AuthProvider, type AuthUserResponse, type DataResponse, type ForgotPasswordRequest, type HTTPValidationError, type ListResponse, type LoginRequest, type LogoutRequest, type MessageData, type MessageResponse, type PermissionData, type PermissionResponse, type RefreshTokenRequest, type RegisterRequest, type ResetPasswordRequest, type RoleData, type RolePermissionRequest, type RoleResponse, type TenantData, type TenantMemberData, type TokenData, type TokenResponse, type UserData, type UserEnvelope, type UserListResponse, type UserRead, type UserResponse, type UserRoleRequest, type UserUpdateRequest, type ValidationError, type VerifyEmailRequest, authUserResponseSchema, createApiClient, forgotPasswordRequestSchema, hTTPValidationErrorSchema, loginRequestSchema, logoutRequestSchema, messageDataSchema, messageResponseSchema, permissionResponseSchema, refreshTokenRequestSchema, registerRequestSchema, resetPasswordRequestSchema, rolePermissionRequestSchema, roleResponseSchema, tokenDataSchema, tokenResponseSchema, useAuth, userEnvelopeSchema, userListResponseSchema, userReadSchema, userResponseSchema, userRoleRequestSchema, userUpdateRequestSchema, validationErrorSchema, verifyEmailRequestSchema };
