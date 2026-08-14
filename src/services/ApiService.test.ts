import { describe, expect, it, vi } from "vitest";
import { refreshAccessToken, registerRefreshFn } from "./ApiService";

describe("refreshAccessToken", () => {
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
});
