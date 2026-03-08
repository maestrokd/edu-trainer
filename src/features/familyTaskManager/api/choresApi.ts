import { del, get, patch, post } from "@/services/ApiService";
import type { ChoreDto, CreateChoreRequest, PatchChoreRequest } from "../models/dto";

const BASE = "/private/family/chores";

export interface ChoreFilters {
  assigneeProfileUuid?: string;
  active?: boolean;
  from?: string;
  to?: string;
}

export const choresApi = {
  getAll(params?: ChoreFilters): Promise<ChoreDto[]> {
    return get(BASE, params ? { params } : undefined);
  },

  getById(choreUuid: string): Promise<ChoreDto> {
    return get(`${BASE}/${choreUuid}`);
  },

  create(data: CreateChoreRequest): Promise<ChoreDto> {
    return post(BASE, data);
  },

  update(choreUuid: string, data: PatchChoreRequest): Promise<ChoreDto> {
    return patch(`${BASE}/${choreUuid}`, data);
  },

  remove(choreUuid: string): Promise<void> {
    return del(`${BASE}/${choreUuid}`);
  },
};
