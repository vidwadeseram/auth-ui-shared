import { describe, it, expect } from "vitest";
import type { UserData, RoleData, PermissionData, TenantData, TenantMemberData, DataResponse, ListResponse } from "../types/api.js";

describe("api.ts type exports", () => {
  it("UserData has required fields", () => {
    const user: UserData = {
      id: "1",
      email: "a@b.com",
      first_name: "A",
      last_name: "B",
      is_active: true,
      email_verified: false,
      role: "user",
      created_at: "2024-01-01",
    };
    expect(user.id).toBe("1");
    expect(user.email).toBe("a@b.com");
    expect(user.updated_at).toBeUndefined();
  });

  it("RoleData has required fields", () => {
    const role: RoleData = { id: "r1", name: "admin", created_at: "2024-01-01" };
    expect(role.name).toBe("admin");
    expect(role.description).toBeUndefined();
  });

  it("PermissionData has required fields", () => {
    const perm: PermissionData = { id: "p1", name: "read:users", created_at: "2024-01-01" };
    expect(perm.name).toBe("read:users");
  });

  it("TenantData has required fields", () => {
    const tenant: TenantData = {
      id: "t1",
      name: "Acme",
      slug: "acme",
      owner_id: "u1",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
    };
    expect(tenant.slug).toBe("acme");
  });

  it("TenantMemberData has required fields", () => {
    const member: TenantMemberData = {
      id: "m1",
      tenant_id: "t1",
      user_id: "u1",
      role_id: "r1",
      is_active: true,
      joined_at: "2024-01-01",
    };
    expect(member.user_email).toBeUndefined();
    expect(member.role_name).toBeUndefined();
  });

  it("DataResponse wraps a single item", () => {
    const res: DataResponse<UserData> = {
      data: { id: "1", email: "a@b.com", first_name: "A", last_name: "B", is_active: true, email_verified: true, role: "user", created_at: "2024-01-01" },
    };
    expect(res.data.id).toBe("1");
  });

  it("ListResponse wraps an array", () => {
    const res: ListResponse<RoleData> = { data: [{ id: "r1", name: "admin", created_at: "2024-01-01" }] };
    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe("admin");
  });
});
