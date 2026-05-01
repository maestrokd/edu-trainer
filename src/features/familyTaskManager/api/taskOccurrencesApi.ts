import { get, post } from "@/services/ApiService";
import { getTimezoneHeader } from "./timezone";
import type {
  ApiItemsResponse,
  ReviewTaskCompletionRequest,
  SubmitTaskCompletionRequest,
  TaskCompletionEventDto,
  TaskOccurrenceDto,
} from "../models/dto";
import type { FamilyTaskOccurrenceStatus } from "../models/enums";

const BASE = "/private/family/tasks";

export interface TaskOccurrenceFilters {
  profileUuid?: string;
  from?: string;
  to?: string;
  status?: FamilyTaskOccurrenceStatus;
}

export interface TaskHistoryFilters {
  profileUuid?: string;
  from?: string;
  to?: string;
}

export const taskOccurrencesApi = {
  async getToday(profileUuid?: string): Promise<TaskOccurrenceDto[]> {
    const headers = getTimezoneHeader();
    const config = {
      ...(headers ? { headers } : {}),
      ...(profileUuid ? { params: { profileUuid } } : {}),
    };
    const response = await get<ApiItemsResponse<TaskOccurrenceDto>>(`${BASE}/today`, config);
    return response.items;
  },

  async getOccurrences(params?: TaskOccurrenceFilters): Promise<TaskOccurrenceDto[]> {
    const headers = getTimezoneHeader();
    const config = {
      ...(headers ? { headers } : {}),
      ...(params ? { params } : {}),
    };
    const response = await get<ApiItemsResponse<TaskOccurrenceDto>>(`${BASE}/occurrences`, config);
    return response.items;
  },

  getOccurrence(occurrenceUuid: string): Promise<TaskOccurrenceDto> {
    return get(`${BASE}/occurrences/${occurrenceUuid}`);
  },

  async getApprovalQueue(): Promise<TaskOccurrenceDto[]> {
    const response = await get<ApiItemsResponse<TaskOccurrenceDto>>(`${BASE}/approval-queue`);
    return response.items;
  },

  async getHistory(params?: TaskHistoryFilters): Promise<TaskCompletionEventDto[]> {
    const response = await get<ApiItemsResponse<TaskCompletionEventDto>>(
      `${BASE}/history`,
      params ? { params } : undefined
    );
    return response.items;
  },

  async getOccurrenceHistory(occurrenceUuid: string): Promise<TaskCompletionEventDto[]> {
    const response = await get<ApiItemsResponse<TaskCompletionEventDto>>(`${BASE}/${occurrenceUuid}/history`);
    return response.items;
  },

  submit(occurrenceUuid: string, payload?: SubmitTaskCompletionRequest): Promise<TaskOccurrenceDto> {
    return post(`${BASE}/${occurrenceUuid}/submit`, payload);
  },

  approve(occurrenceUuid: string, payload?: ReviewTaskCompletionRequest): Promise<TaskOccurrenceDto> {
    return post(`${BASE}/${occurrenceUuid}/approve`, payload);
  },

  reject(occurrenceUuid: string, payload?: ReviewTaskCompletionRequest): Promise<TaskOccurrenceDto> {
    return post(`${BASE}/${occurrenceUuid}/reject`, payload);
  },
};
