import { del, get, patch, post } from "@/services/ApiService";
import type {
  ApiItemsResponse,
  ChildProfileDto,
  CreateChildProfileRequest,
  PatchChildProfileRequest,
} from "../models/dto";

const BASE = "/private/family/child-profiles";

export const childProfilesApi = {
  async getAll(): Promise<ChildProfileDto[]> {
    const response = await get<ApiItemsResponse<ChildProfileDto>>(BASE);
    return response.items;
  },

  getById(profileUuid: string): Promise<ChildProfileDto> {
    return get(`${BASE}/${profileUuid}`);
  },

  create(data: CreateChildProfileRequest): Promise<ChildProfileDto> {
    return post(BASE, data);
  },

  update(profileUuid: string, data: PatchChildProfileRequest): Promise<ChildProfileDto> {
    return patch(`${BASE}/${profileUuid}`, data);
  },

  remove(profileUuid: string): Promise<void> {
    return del(`${BASE}/${profileUuid}`);
  },
};
