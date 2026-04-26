export interface UserData {
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

export interface RoleData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface PermissionData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantMemberData {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  joined_at: string;
  user_email?: string;
  role_name?: string;
}

export interface DataResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  data: T[];
}
