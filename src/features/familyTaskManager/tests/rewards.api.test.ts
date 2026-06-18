import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "@/services/ApiService";
import { rewardRedemptionsApi, starsApi } from "../api/rewardsApi";

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

describe("starsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads star entries through pageable response envelope", async () => {
    vi.mocked(get).mockResolvedValueOnce({
      page: 1,
      requestedSize: 20,
      actualPageSize: 1,
      totalItems: 21,
      totalPages: 2,
      items: [
        {
          uuid: "entry-1",
          occurrenceUuid: null,
          secondaryProfileUuid: "profile-1",
          deltaStars: 5,
          reason: "TASK_APPROVED",
          createdDate: "2026-06-17T12:00:00Z",
        },
      ],
    });

    const result = await starsApi.getEntries({
      secondaryProfileUuid: "profile-1",
      page: 1,
      size: 20,
      sort: "createdDate,desc",
    });

    expect(get).toHaveBeenCalledWith("/private/family/rewards/stars", {
      params: {
        secondaryProfileUuid: "profile-1",
        page: 1,
        size: 20,
        sort: "createdDate,desc",
      },
    });
    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(21);
  });
});
