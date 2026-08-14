import { beforeEach, describe, expect, it, vi } from "vitest";
import { setDefaultTenant, switchTenant } from "./TenantService";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/services/ApiService.ts", () => apiMock);

describe("TenantService", () => {
  beforeEach(() => {
    apiMock.post.mockReset();
  });

  it("switches the current session without using the default preference endpoint", async () => {
    apiMock.post.mockResolvedValue({ accessToken: "replacement-token" });

    await switchTenant("tenant-uuid");

    expect(apiMock.post).toHaveBeenCalledWith("/auth/tenants/switch", { tenantUuid: "tenant-uuid" });
  });

  it("updates the login default through the membership preference endpoint", async () => {
    apiMock.post.mockResolvedValue({ tenantUuid: "tenant-uuid", defaultTenant: true });

    await setDefaultTenant("tenant-uuid");

    expect(apiMock.post).toHaveBeenCalledWith("/private/tenants/tenant-uuid/default");
  });
});
