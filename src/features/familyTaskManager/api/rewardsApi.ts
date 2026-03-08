import { del, get, patch, post } from "@/services/ApiService";
import type {
  ApiItemsResponse,
  CreateRedemptionRequest,
  CreateRewardRequest,
  PatchRewardRequest,
  ReviewRewardRedemptionRequest,
  RewardDto,
  RewardRedemptionDto,
  StarLedgerEntryDto,
  StarsBalanceDto,
} from "../models/dto";
import type { FamilyRewardRedemptionStatus } from "../models/enums";

const BASE = "/private/family/rewards";
const REDEMPTIONS_BASE = "/private/family/reward-redemptions";

export const rewardsApi = {
  async getAll(active?: boolean): Promise<RewardDto[]> {
    const response = await get<ApiItemsResponse<RewardDto>>(
      BASE,
      active === undefined ? undefined : { params: { active } }
    );
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

export const starsApi = {
  getBalance(secondaryProfileUuid?: string): Promise<StarsBalanceDto> {
    return get(`${BASE}/stars/balance`, secondaryProfileUuid ? { params: { secondaryProfileUuid } } : undefined);
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
  async getAll(status?: FamilyRewardRedemptionStatus): Promise<RewardRedemptionDto[]> {
    const response = await get<ApiItemsResponse<RewardRedemptionDto>>(
      REDEMPTIONS_BASE,
      status ? { params: { status } } : undefined
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
