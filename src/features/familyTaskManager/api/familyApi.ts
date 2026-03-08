import { get, post } from "@/services/ApiService";
import { getTimezoneHeader, getBrowserTimezone } from "./timezone";
import type { ApiItemsResponse, FamilyInfoDto, HouseholdMemberDto } from "../models/dto";

const BASE = "/private/family";

export const familyFamiliesApi = {
  getMyFamily(): Promise<FamilyInfoDto> {
    const headers = getTimezoneHeader();
    return get(`${BASE}/families/me`, {
      ...(headers ? { headers } : {}),
    });
  },

  createFamily(name: string): Promise<FamilyInfoDto> {
    const timezone = getBrowserTimezone();
    return post(`${BASE}/families`, {
      name,
      ...(timezone ? { timezone } : {}),
    });
  },
};

export const householdMembersApi = {
  async getMembers(): Promise<HouseholdMemberDto[]> {
    const response = await get<ApiItemsResponse<HouseholdMemberDto>>(`${BASE}/household-members`);
    return response.items;
  },
};
