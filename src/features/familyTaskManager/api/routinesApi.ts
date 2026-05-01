import { del, get, patch, post } from "@/services/ApiService";
import type { CreateRoutineRequest, PatchRoutineRequest, RoutineDto } from "../models/dto";
import type { FamilyRoutineSlot } from "../models/enums";

const BASE = "/private/family/routines";

export interface RoutineFilters {
  assigneeProfileUuid?: string;
  routineSlot?: FamilyRoutineSlot;
  active?: boolean;
}

export const routinesApi = {
  getAll(params?: RoutineFilters): Promise<RoutineDto[]> {
    return get(BASE, params ? { params } : undefined);
  },

  getById(routineUuid: string): Promise<RoutineDto> {
    return get(`${BASE}/${routineUuid}`);
  },

  create(data: CreateRoutineRequest): Promise<RoutineDto> {
    return post(BASE, data);
  },

  update(routineUuid: string, data: PatchRoutineRequest): Promise<RoutineDto> {
    return patch(`${BASE}/${routineUuid}`, data);
  },

  remove(routineUuid: string): Promise<void> {
    return del(`${BASE}/${routineUuid}`);
  },
};
