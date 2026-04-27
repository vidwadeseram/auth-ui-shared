import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApiClient } from "../client/api-client.js";
import { ApiError } from "../client/errors.js";

function makeConfig(overrides?: Partial<Parameters<typeof createApiClient>[0]>) {
  return {
    baseUrl: "https://api.example.com",
    getAccessToken: () => "access-token",
    setAccessToken: vi.fn(),
    getRefreshToken: () => "refresh-token",
    setRefreshToken: vi.fn(),
    onAuthFailure: vi.fn(),
    ...overrides,
  };
}

function mockFetch(response: { status: number; body: unknown; ok?: boolean }) {
  const ok = response.ok ?? (response.status >= 200 && response.status < 300);
  const text = typeof response.body === "string" ? response.body : JSON.stringify(response.body);
  return vi.fn().mockResolvedValue({
    status: response.status,
    ok,
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(response.body),
  });
}

describe("createApiClient — URL construction", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { data: { id: "1" } } }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("prepends baseUrl to path", async () => {
    const client = createApiClient(makeConfig());
    await client.get("/api/v1/test");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/test",
      expect.any(Object)
    );
  });

  it("constructs correct URL for admin user endpoint", async () => {
    const client = createApiClient(makeConfig());
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { data: { id: "u1", email: "a@b.com", first_name: "A", last_name: "B", is_active: true, email_verified: true, role: "admin", created_at: "2024-01-01" } } }));
    await client.admin.getUser("u1");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/admin/users/u1",
      expect.any(Object)
    );
  });
});

describe("createApiClient — header management", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends Authorization header when token present", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { data: {} } }));
    const client = createApiClient(makeConfig({ getAccessToken: () => "my-token" }));
    await client.get("/test");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer my-token" });
  });

  it("omits Authorization header when no token", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { data: {} } }));
    const client = createApiClient(makeConfig({ getAccessToken: () => null }));
    await client.get("/test");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBeUndefined();
  });

  it("skips auth header for login (skipAuth)", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: { data: { access_token: "t", refresh_token: "r", token_type: "bearer", expires_in: 3600 } } }));
    const client = createApiClient(makeConfig({ getAccessToken: () => "existing-token" }));
    await client.auth.login({ email: "a@b.com", password: "pw" });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBeUndefined();
  });
});

describe("createApiClient — error handling", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("throws ApiError on non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 404, body: { error: { code: "NOT_FOUND", message: "Not found" } } }));
    const client = createApiClient(makeConfig());
    await expect(client.get("/missing")).rejects.toThrow(ApiError);
  });

  it("ApiError has correct status and code", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 403, body: { error: { code: "FORBIDDEN", message: "Forbidden" } } }));
    const client = createApiClient(makeConfig());
    try {
      await client.get("/forbidden");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).code).toBe("FORBIDDEN");
    }
  });

  it("throws ApiError with PARSE_ERROR on invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve("not-json"),
    }));
    const client = createApiClient(makeConfig());
    await expect(client.get("/bad-json")).rejects.toThrow(ApiError);
  });

  it("calls onAuthFailure when refresh token missing on 401", async () => {
    const onAuthFailure = vi.fn();
    vi.stubGlobal("fetch", mockFetch({ status: 401, body: { error: { code: "UNAUTHORIZED", message: "Unauthorized" } } }));
    const client = createApiClient(makeConfig({ getRefreshToken: () => null, onAuthFailure }));
    await expect(client.get("/protected")).rejects.toThrow();
    expect(onAuthFailure).toHaveBeenCalled();
  });
});

describe("createApiClient — token refresh", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries request with new token after successful refresh", async () => {
    const setAccessToken = vi.fn();
    const setRefreshToken = vi.fn();
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/refresh")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ data: { access_token: "new-token", refresh_token: "new-refresh" } }),
          text: () => Promise.resolve(JSON.stringify({ data: { access_token: "new-token", refresh_token: "new-refresh" } })),
        });
      }
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ status: 401, ok: false, text: () => Promise.resolve(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } })) });
      }
      return Promise.resolve({ status: 200, ok: true, text: () => Promise.resolve(JSON.stringify({ data: { id: "1" } })) });
    }));
    const client = createApiClient(makeConfig({ setAccessToken, setRefreshToken }));
    const result = await client.auth.me();
    expect(setAccessToken).toHaveBeenCalledWith("new-token");
    expect(result).toMatchObject({ id: "1" });
  });
});
