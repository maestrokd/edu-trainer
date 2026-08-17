import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const apiMock = vi.hoisted(() => ({
  post: vi.fn(),
  refreshAccessToken: vi.fn(),
  registerRefreshFn: vi.fn(),
  registerLogoutFn: vi.fn(),
}));

const profileMock = vi.hoisted(() => ({
  getMe: vi.fn(),
}));

const tenantServiceMock = vi.hoisted(() => ({
  switchTenant: vi.fn(),
}));

const jwtMock = vi.hoisted(() => ({
  jwtDecode: vi.fn(),
}));

const webAppMock = vi.hoisted(() => ({
  ready: vi.fn(),
  initData: "",
}));

vi.mock("@/services/ApiService.ts", () => ({
  post: apiMock.post,
  refreshAccessToken: apiMock.refreshAccessToken,
  registerRefreshFn: apiMock.registerRefreshFn,
  registerLogoutFn: apiMock.registerLogoutFn,
}));

vi.mock("@/services/ProfileService.ts", () => ({
  getMe: profileMock.getMe,
}));

vi.mock("@/services/AuthService.ts", () => ({
  TenantMembershipRole: {
    OWNER: "OWNER",
    PARENT: "PARENT",
    CAREGIVER: "CAREGIVER",
    CHILD_DOER: "CHILD_DOER",
    CHILD_VIEWER: "CHILD_VIEWER",
    MEMBER: "MEMBER",
    VIEWER: "VIEWER",
  },
  logout: vi.fn(),
  logoutAll: vi.fn(),
  logoutTelegram: vi.fn(),
}));

vi.mock("@/services/TenantService.ts", () => ({
  default: tenantServiceMock,
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: jwtMock.jwtDecode,
}));

vi.mock("@twa-dev/sdk", () => ({
  default: webAppMock,
}));

const TestHarness = () => {
  const auth = useAuth();
  return (
    <div>
      <button type="button" onClick={() => auth.doRefresh()}>
        refresh
      </button>
      <button type="button" onClick={() => auth.switchTenant("tenant-b")}>
        switch
      </button>
      <div data-testid="principal">{JSON.stringify(auth.principal)}</div>
    </div>
  );
};

const session = (tenantUuid: string, tenantName: string, defaultTenant: string) => ({
  accessToken: `token-${tenantUuid}`,
  activeTenantUuid: tenantUuid,
  activeTenantName: tenantName,
  activeTenantRole: "OWNER",
  tenants: [
    { tenantUuid, name: tenantName, role: "OWNER", defaultTenant: tenantUuid === defaultTenant },
    { tenantUuid: defaultTenant, name: "Login default", role: "MEMBER", defaultTenant: true },
  ],
});

describe("AuthContext tenant sessions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    apiMock.post.mockReset();
    apiMock.refreshAccessToken.mockReset();
    apiMock.registerRefreshFn.mockReset();
    apiMock.registerLogoutFn.mockReset();
    profileMock.getMe.mockReset();
    tenantServiceMock.switchTenant.mockReset();
    jwtMock.jwtDecode.mockReset();
    webAppMock.initData = "";
    apiMock.refreshAccessToken.mockImplementation(async () => {
      const registeredRefresh = apiMock.registerRefreshFn.mock.calls.at(-1)?.[0];
      return await registeredRefresh();
    });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    profileMock.getMe.mockResolvedValue({
      username: "user@example.com",
      firstName: "Test",
      lastName: "User",
      email: "user@example.com",
      profileType: "PRIMARY",
    });
    jwtMock.jwtDecode.mockImplementation((token: string) => ({
      sub: "user-uuid",
      authorities: ["MANAGE_PROFILES"],
      activeTenantUuid: token.replace("token-", ""),
      activeTenantRole: "OWNER",
    }));
  });

  const renderProvider = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestHarness />
        </AuthProvider>
      </QueryClientProvider>
    );

  it("keeps the tenant returned by refresh even when another tenant is the login default", async () => {
    apiMock.post.mockResolvedValue(session("tenant-a", "Active tenant", "tenant-b"));
    renderProvider();

    fireEvent.click(await screen.findByRole("button", { name: "refresh" }));

    await waitFor(() => {
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeTenantUuid":"tenant-a"');
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeTenantName":"Active tenant"');
    });
  });

  it("applies the switched tenant response and resets tenant-scoped queries", async () => {
    const resetQueries = vi.spyOn(queryClient, "resetQueries");
    tenantServiceMock.switchTenant.mockResolvedValue(session("tenant-b", "Switched tenant", "tenant-a"));
    renderProvider();

    fireEvent.click(await screen.findByRole("button", { name: "switch" }));

    await waitFor(() => {
      expect(tenantServiceMock.switchTenant).toHaveBeenCalledWith("tenant-b");
      expect(screen.getByTestId("principal")).toHaveTextContent('"activeTenantUuid":"tenant-b"');
      expect(localStorage.getItem("token")).toBe("token-tenant-b");
      expect(resetQueries).toHaveBeenCalledTimes(1);
    });
  });
});
