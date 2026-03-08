import type { RewardRedemptionDto } from "../../models/dto";

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T/;
const UNKNOWN_DATE_KEY = "unknown";

export interface RedemptionDateGroup {
  dateKey: string;
  redemptions: RewardRedemptionDto[];
}

export function resolveRedemptionDate(redemption: RewardRedemptionDto): string {
  return redemption.effectiveRedeemedDate ?? redemption.redeemedDate ?? redemption.createdDate;
}

function resolveRedemptionLocalDateKey(redemption: RewardRedemptionDto): string | null {
  const localDate = redemption.effectiveRedeemedLocalDate?.trim();
  if (!localDate) {
    return null;
  }

  return LOCAL_DATE_PATTERN.test(localDate) ? localDate : null;
}

function normalizeDateKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return UNKNOWN_DATE_KEY;
  }

  const localDateMatch = LOCAL_DATE_PATTERN.exec(trimmed);
  if (localDateMatch) {
    return trimmed;
  }

  const isoDateMatch = ISO_DATE_PREFIX_PATTERN.exec(trimmed);
  if (isoDateMatch) {
    return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return UNKNOWN_DATE_KEY;
  }

  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateSortValue(dateKey: string): number | null {
  const localDateMatch = LOCAL_DATE_PATTERN.exec(dateKey);
  if (!localDateMatch) {
    return null;
  }

  const [, year, month, day] = localDateMatch;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortRedemptions(left: RewardRedemptionDto, right: RewardRedemptionDto): number {
  const leftDate = toTimestamp(resolveRedemptionDate(left));
  const rightDate = toTimestamp(resolveRedemptionDate(right));

  if (leftDate !== rightDate) {
    return rightDate - leftDate;
  }

  return left.uuid.localeCompare(right.uuid);
}

export function isKnownRedemptionDateKey(dateKey: string): boolean {
  return LOCAL_DATE_PATTERN.test(dateKey);
}

export function groupRedemptionsByProfileDate(
  redemptions: RewardRedemptionDto[]
): Record<string, RedemptionDateGroup[]> {
  const groupedByProfile: Record<string, Record<string, RewardRedemptionDto[]>> = {};

  for (const redemption of redemptions) {
    const profileUuid = redemption.assigneeProfileUuid;
    const dateKey = resolveRedemptionLocalDateKey(redemption) ?? normalizeDateKey(resolveRedemptionDate(redemption));
    const profileGroups = groupedByProfile[profileUuid] ?? {};
    const dateGroup = profileGroups[dateKey] ?? [];

    groupedByProfile[profileUuid] = profileGroups;
    profileGroups[dateKey] = [...dateGroup, redemption];
  }

  const result: Record<string, RedemptionDateGroup[]> = {};

  for (const profileUuid of Object.keys(groupedByProfile)) {
    const dateGroups = groupedByProfile[profileUuid];
    const profileGroups = Object.entries(dateGroups).map(([dateKey, dateRedemptions]) => ({
      dateKey,
      redemptions: [...dateRedemptions].sort(sortRedemptions),
    }));

    profileGroups.sort((left, right) => {
      const leftSortValue = toDateSortValue(left.dateKey);
      const rightSortValue = toDateSortValue(right.dateKey);

      if (leftSortValue === null && rightSortValue === null) {
        return left.dateKey.localeCompare(right.dateKey);
      }

      if (leftSortValue === null) {
        return 1;
      }

      if (rightSortValue === null) {
        return -1;
      }

      if (leftSortValue !== rightSortValue) {
        return rightSortValue - leftSortValue;
      }

      return right.dateKey.localeCompare(left.dateKey);
    });

    result[profileUuid] = profileGroups;
  }

  return result;
}
