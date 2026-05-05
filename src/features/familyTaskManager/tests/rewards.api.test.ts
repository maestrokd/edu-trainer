import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "@/services/ApiService";
import { rewardRedemptionsApi } from "../api/rewardsApi";

vi.mock("@/services/ApiService", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

describe("rewardRedemptionsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates self redemption via reward-scoped endpoint", async () => {
    vi.mocked(post).mockResolvedValueOnce({
      uuid: "redemption-1",
    });

    await rewardRedemptionsApi.createSelf(" reward-1 ", {
      note: "Redeem now",
    });

    expect(post).toHaveBeenCalledWith("/private/family/rewards/reward-1/redemptions/self", {
      note: "Redeem now",
    });
  });

  it("creates parent/owner redemption for child via reward-scoped endpoint", async () => {
    vi.mocked(post).mockResolvedValueOnce({
      uuid: "redemption-2",
    });

    await rewardRedemptionsApi.createForChild(" reward-2 ", {
      assigneeProfileUuid: " child-1 ",
      note: "Redeemed by parent request",
    });

    expect(post).toHaveBeenCalledWith("/private/family/rewards/reward-2/redemptions", {
      assigneeProfileUuid: "child-1",
      note: "Redeemed by parent request",
    });
  });

  it("loads redemptions list through reward-redemptions collection endpoint", async () => {
    vi.mocked(get).mockResolvedValueOnce({
      page: 0,
      requestedSize: 25,
      actualPageSize: 0,
      totalItems: 0,
      totalPages: 0,
      items: [],
    });

    await rewardRedemptionsApi.getAll();

    expect(get).toHaveBeenCalledWith("/private/family/reward-redemptions", undefined);
  });
});
