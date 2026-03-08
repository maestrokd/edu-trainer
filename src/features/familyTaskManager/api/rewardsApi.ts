import { del, get, patch, post } from "@/services/ApiService";
import type {
  ApiPagedItemsResponse,
  ApiPageResponse,
  ApiItemsResponse,
  CreateRewardLabelRequest,
  CreateStarAdjustmentRequest,
  CreateRedemptionRequest,
  CreateRewardRequest,
  PatchRewardRequest,
  RewardLabelsQuery,
  RewardRedemptionsQuery,
  ReviewRewardRedemptionRequest,
  RewardDto,
  RewardLabelDto,
  RewardRedemptionDto,
  RewardsQuery,
  StarLedgerEntryDto,
  StarLedgerEntriesQuery,
  StarsBalanceDto,
  StarsBalancesQuery,
} from "../models/dto";

const BASE = "/private/family/rewards";
const REDEMPTIONS_BASE = "/private/family/reward-redemptions";
const LABELS_BASE = "/private/family/reward-labels";

function normalizeRewardsQuery(query?: RewardsQuery) {
  if (!query) {
    return undefined;
  }

  const normalized: Record<string, string | boolean> = {};

  if (typeof query.active === "boolean") {
    normalized.active = query.active;
  }

  if (query.primaryLabelUuid) {
    normalized.primaryLabelUuid = query.primaryLabelUuid;
  }

  if (query.labelUuids?.length) {
    normalized.labelUuids = query.labelUuids.join(",");
  }

  if (query.labelMatchMode) {
    normalized.labelMatchMode = query.labelMatchMode;
  }

  if (query.searchString?.trim()) {
    normalized.searchString = query.searchString.trim();
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeRewardLabelsQuery(query?: RewardLabelsQuery) {
  if (!query) {
    return undefined;
  }

  const normalized: Record<string, string | boolean> = {};

  if (query.kind) {
    normalized.kind = query.kind;
  }

  if (typeof query.includeInactive === "boolean") {
    normalized.includeInactive = query.includeInactive;
  }

  if (query.searchString?.trim()) {
    normalized.searchString = query.searchString.trim();
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeRewardRedemptionsQuery(query?: RewardRedemptionsQuery): URLSearchParams | undefined {
  if (!query) {
    return undefined;
  }

  const params = new URLSearchParams();

  if (query.status) {
    params.set("status", query.status);
  }

  if (typeof query.active === "boolean") {
    params.set("active", String(query.active));
  }

  if (query.primaryLabelUuid?.trim()) {
    params.set("primaryLabelUuid", query.primaryLabelUuid.trim());
  }

  if (query.labelUuids?.length) {
    const normalizedLabelUuids = [...new Set(query.labelUuids.map((labelUuid) => labelUuid.trim()).filter(Boolean))];

    for (const labelUuid of normalizedLabelUuids) {
      params.append("labelUuids", labelUuid);
    }
  }

  if (query.labelMatchMode) {
    params.set("labelMatchMode", query.labelMatchMode);
  }

  if (query.searchString?.trim()) {
    params.set("searchString", query.searchString.trim());
  }

  if (query.redeemedFrom?.trim()) {
    params.set("redeemedFrom", query.redeemedFrom.trim());
  }

  if (query.redeemedTo?.trim()) {
    params.set("redeemedTo", query.redeemedTo.trim());
  }

  if (typeof query.page === "number" && Number.isFinite(query.page)) {
    params.set("page", String(Math.max(0, Math.floor(query.page))));
  }

  if (typeof query.size === "number" && Number.isFinite(query.size)) {
    params.set("size", String(Math.max(1, Math.floor(query.size))));
  }

  if (query.sort?.length) {
    const normalizedSort = query.sort.map((entry) => entry.trim()).filter(Boolean);
    for (const sortEntry of normalizedSort) {
      params.append("sort", sortEntry);
    }
  }

  return params.toString() ? params : undefined;
}

function normalizeStarsBalancesQuery(query?: StarsBalancesQuery): URLSearchParams | undefined {
  if (!query?.secondaryProfileUuids?.length) {
    return undefined;
  }

  const params = new URLSearchParams();
  const normalizedProfileUuids = [
    ...new Set(query.secondaryProfileUuids.map((profileUuid) => profileUuid.trim()).filter(Boolean)),
  ];

  for (const profileUuid of normalizedProfileUuids) {
    params.append("secondaryProfileUuids", profileUuid);
  }

  return params.toString() ? params : undefined;
}

export const rewardsApi = {
  async getAll(query?: RewardsQuery): Promise<RewardDto[]> {
    const response = await get<ApiItemsResponse<RewardDto>>(BASE, {
      params: normalizeRewardsQuery(query),
    });
    return response.items;
  },

  getById(rewardUuid: string): Promise<RewardDto> {
    return get(`${BASE}/${rewardUuid}`);
  },

  create(data: CreateRewardRequest): Promise<RewardDto> {
    return post(BASE, data);
  },

  update(rewardUuid: string, data: PatchRewardRequest): Promise<RewardDto> {
    return patch(`${BASE}/${rewardUuid}`, data);
  },

  remove(rewardUuid: string): Promise<void> {
    return del(`${BASE}/${rewardUuid}`);
  },
};

export const rewardLabelsApi = {
  async getAll(query?: RewardLabelsQuery): Promise<RewardLabelDto[]> {
    const response = await get<ApiItemsResponse<RewardLabelDto>>(LABELS_BASE, {
      params: normalizeRewardLabelsQuery(query),
    });
    return response.items;
  },

  create(data: CreateRewardLabelRequest): Promise<RewardLabelDto> {
    return post(LABELS_BASE, data);
  },
};

export const starsApi = {
  createAdjustment(data: CreateStarAdjustmentRequest): Promise<StarLedgerEntryDto> {
    return post(`${BASE}/stars`, data);
  },

  getEntries(params?: StarLedgerEntriesQuery): Promise<ApiPageResponse<StarLedgerEntryDto>> {
    return get(`${BASE}/stars`, params ? { params } : undefined);
  },

  async getBalances(query?: StarsBalancesQuery): Promise<StarsBalanceDto[]> {
    const response = await get<ApiItemsResponse<StarsBalanceDto>>(
      `${BASE}/stars/balances`,
      query ? { params: normalizeStarsBalancesQuery(query) } : undefined
    );
    return response.items;
  },

  async getHistory(secondaryProfileUuid?: string): Promise<StarLedgerEntryDto[]> {
    const response = await get<ApiItemsResponse<StarLedgerEntryDto>>(
      `${BASE}/stars/history`,
      secondaryProfileUuid ? { params: { secondaryProfileUuid } } : undefined
    );
    return response.items;
  },
};

export const rewardRedemptionsApi = {
  async getAll(query?: RewardRedemptionsQuery): Promise<RewardRedemptionDto[]> {
    const response = await get<ApiPagedItemsResponse<RewardRedemptionDto>>(
      REDEMPTIONS_BASE,
      query ? { params: normalizeRewardRedemptionsQuery(query) } : undefined
    );
    return response.items;
  },

  create(data: CreateRedemptionRequest): Promise<RewardRedemptionDto> {
    return post(REDEMPTIONS_BASE, data);
  },

  approve(redemptionUuid: string, data?: ReviewRewardRedemptionRequest): Promise<RewardRedemptionDto> {
    return post(`${REDEMPTIONS_BASE}/${redemptionUuid}/approve`, data);
  },

  reject(redemptionUuid: string, data?: ReviewRewardRedemptionRequest): Promise<RewardRedemptionDto> {
    return post(`${REDEMPTIONS_BASE}/${redemptionUuid}/reject`, data);
  },
};
