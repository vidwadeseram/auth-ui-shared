import React from 'react';

interface ApiClientConfig {
    baseUrl: string;
    getAccessToken: () => string | null;
    setAccessToken: (token: string | null) => void;
    getRefreshToken: () => string | null;
    setRefreshToken: (token: string | null) => void;
    onAuthFailure?: () => void;
}
interface ApiClient {
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
declare function AuthProvider({ baseUrl, children, onAuthFailure, tokenStorage }: AuthProviderProps): any;
declare function useAuth(): any;

export { type ApiClient, type ApiClientConfig, ApiError, AuthProvider, createApiClient, useAuth };
