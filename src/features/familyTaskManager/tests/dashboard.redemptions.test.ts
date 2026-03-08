import { describe, expect, it } from "vitest";
import {
  groupRedemptionsByProfileDate,
  isKnownRedemptionDateKey,
  resolveRedemptionDate,
} from "../domain/dashboard/redemptions";
import type { RewardRedemptionDto } from "../models/dto";
import { FamilyRewardRedemptionStatus } from "../models/enums";

function buildRedemption(redemption: Partial<RewardRedemptionDto>): RewardRedemptionDto {
  return {
    uuid: redemption.uuid ?? "redemption-1",
    rewardUuid: redemption.rewardUuid ?? "reward-1",
    requesterProfileUuid: redemption.requesterProfileUuid ?? "profile-1",
    assigneeProfileUuid: redemption.assigneeProfileUuid ?? "profile-1",
    status: redemption.status ?? FamilyRewardRedemptionStatus.APPROVED,
    note: redemption.note ?? null,
    reviewedByProfileUuid: redemption.reviewedByProfileUuid ?? null,
    reviewedNote: redemption.reviewedNote ?? null,
    redeemedDate: redemption.redeemedDate ?? null,
    effectiveRedeemedDate: redemption.effectiveRedeemedDate ?? undefined,
    effectiveRedeemedLocalDate: redemption.effectiveRedeemedLocalDate ?? undefined,
    createdDate: redemption.createdDate ?? "2026-04-12T09:00:00Z",
    reviewedDate: redemption.reviewedDate ?? null,
    reward: redemption.reward ?? undefined,
  };
}

describe("redemptions dashboard grouping", () => {
  it("groups by profile and sorts date groups from newest to oldest", () => {
    const redemptions = [
      buildRedemption({
        uuid: "profile-1-older",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "2026-04-12T09:00:00Z",
      }),
      buildRedemption({
        uuid: "profile-1-newest",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "2026-04-14T09:00:00Z",
      }),
      buildRedemption({
        uuid: "profile-1-middle",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "2026-04-13T09:00:00Z",
      }),
      buildRedemption({
        uuid: "profile-2-iso",
        assigneeProfileUuid: "profile-2",
        redeemedDate: "2026-04-10T01:30:00Z",
      }),
    ];

    const grouped = groupRedemptionsByProfileDate(redemptions);
    const profileOneDates = grouped["profile-1"].map((group) => group.dateKey);

    expect(profileOneDates).toEqual(["2026-04-14", "2026-04-13", "2026-04-12"]);
    expect(grouped["profile-2"][0].dateKey).toBe("2026-04-10");
  });

  it("sorts redemptions in the same date group by redeemed timestamp descending", () => {
    const redemptions = [
      buildRedemption({
        uuid: "later",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "2026-04-14T12:00:00Z",
      }),
      buildRedemption({
        uuid: "earlier",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "2026-04-14T08:00:00Z",
      }),
      buildRedemption({
        uuid: "fallback-created",
        assigneeProfileUuid: "profile-1",
        redeemedDate: null,
        createdDate: "2026-04-14T10:00:00Z",
      }),
    ];

    const grouped = groupRedemptionsByProfileDate(redemptions);
    const firstGroupUuids = grouped["profile-1"][0].redemptions.map((item) => item.uuid);

    expect(firstGroupUuids).toEqual(["later", "fallback-created", "earlier"]);
  });

  it("keeps invalid dates in an unknown group and exposes known-date checks", () => {
    const redemptions = [
      buildRedemption({
        uuid: "invalid-date",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "invalid",
      }),
    ];

    const grouped = groupRedemptionsByProfileDate(redemptions);
    expect(grouped["profile-1"][0].dateKey).toBe("unknown");

    expect(isKnownRedemptionDateKey("2026-04-14")).toBe(true);
    expect(isKnownRedemptionDateKey("unknown")).toBe(false);
    expect(resolveRedemptionDate(redemptions[0])).toBe("invalid");
  });

  it("prefers effective redemption date fields from backend when available", () => {
    const redemptions = [
      buildRedemption({
        uuid: "with-effective-date",
        assigneeProfileUuid: "profile-1",
        redeemedDate: null,
        createdDate: "2026-04-10T03:00:00Z",
        effectiveRedeemedDate: "2026-04-15T08:45:00Z",
        effectiveRedeemedLocalDate: "2026-04-15",
      }),
      buildRedemption({
        uuid: "without-effective-date",
        assigneeProfileUuid: "profile-1",
        redeemedDate: "2026-04-14T10:00:00Z",
      }),
    ];

    const grouped = groupRedemptionsByProfileDate(redemptions);

    expect(grouped["profile-1"][0].dateKey).toBe("2026-04-15");
    expect(resolveRedemptionDate(redemptions[0])).toBe("2026-04-15T08:45:00Z");
  });
});
