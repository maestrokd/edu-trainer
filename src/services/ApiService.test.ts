import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshAccessToken, registerRefreshFn } from "./ApiService";

describe("refreshAccessToken", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "locks");
    localStorage.clear();
  });

  it("shares one in-flight refresh across concurrent callers", async () => {
    let resolveRefresh: ((token: string) => void) | undefined;
    const refresh = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveRefresh = resolve;
        })
    );
    registerRefreshFn(refresh);

    const first = refreshAccessToken();
    const second = refreshAccessToken();

    expect(refresh).toHaveBeenCalledTimes(1);
    resolveRefresh?.("replacement-access-token");
    await expect(Promise.all([first, second])).resolves.toEqual([
      "replacement-access-token",
      "replacement-access-token",
    ]);

    registerRefreshFn(vi.fn().mockResolvedValue("next-access-token"));
    await expect(refreshAccessToken()).resolves.toBe("next-access-token");
  });

  it("skips refresh after another browser context replaces the rejected token", async () => {
    localStorage.setItem("token", "rejected-access-token");
    const refresh = vi.fn().mockResolvedValue("unnecessary-token");
    registerRefreshFn(refresh);
    const request = vi.fn(async (_name: string, callback: () => Promise<string>) => {
      localStorage.setItem("token", "replacement-from-another-tab");
      return await callback();
    });
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request },
    });

    await expect(refreshAccessToken("rejected-access-token")).resolves.toBe("replacement-from-another-tab");

    expect(request).toHaveBeenCalledWith("edu-trainer-auth-refresh", expect.any(Function));
    expect(refresh).not.toHaveBeenCalled();
  });
});
