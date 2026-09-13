import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "@/services/ApiService";
import { FeatureFlag } from "@/services/featureFlagsApi";
import { useFeatureFlag } from "./useFeatureFlag";

vi.mock("@/services/ApiService", () => ({ get: vi.fn() }));
const auth = vi.hoisted(() => ({ isAuthenticated: true }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const flag = FeatureFlag.FAMILY_TASK_MANAGER_AI_ASSISTANT;
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

describe("useFeatureFlag", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.isAuthenticated = true;
    client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  });
  afterEach(() => client.clear());

  it("stays disabled during initial loading, enables only on true, and fails closed after a refresh error", async () => {
    let resolve!: (value: unknown) => void;
    vi.mocked(get).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const { result } = renderHook(() => useFeatureFlag(flag), { wrapper });
    expect(result.current).toBe(false);
    await act(async () => resolve({ features: { [flag]: true } }));
    await waitFor(() => expect(result.current).toBe(true));
    expect(get).toHaveBeenCalledWith("/private/features", { signal: expect.any(AbortSignal) });

    vi.mocked(get).mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      await client.refetchQueries({ queryKey: ["feature-flags"] });
    });
    await waitFor(() => expect(result.current).toBe(false));
    expect(client.getQueryData(["feature-flags"])).toEqual({ [flag]: true });
  });

  it.each([
    { features: { [flag]: false } },
    { features: {} },
    { features: { [flag]: "true" } },
    { features: [] },
    null,
  ])("treats a missing, false, or malformed flag as disabled: %j", async (response) => {
    vi.mocked(get).mockResolvedValue(response);
    const { result } = renderHook(() => useFeatureFlag(flag), { wrapper });
    await waitFor(() => expect(client.getQueryState(["feature-flags"])?.status).toBe("success"));
    expect(result.current).toBe(false);
  });

  it("stays disabled when discovery is unavailable on an older backend", async () => {
    vi.mocked(get).mockRejectedValue(new Error("404"));
    const { result } = renderHook(() => useFeatureFlag(flag), { wrapper });
    await waitFor(() => expect(client.getQueryState(["feature-flags"])?.status).toBe("error"));
    expect(result.current).toBe(false);
    expect(get).toHaveBeenCalledOnce();
  });

  it("does not expose cached flags or fetch without authentication", () => {
    client.setQueryData(["feature-flags"], { [flag]: true });
    auth.isAuthenticated = false;
    const { result } = renderHook(() => useFeatureFlag(flag), { wrapper });
    expect(result.current).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });
});
