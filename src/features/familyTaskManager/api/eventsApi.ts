import { del, get, patch, post } from "@/services/ApiService";
import type {
  ApiItemsResponse,
  CreateEventRecurrenceRuleRequest,
  CreateEventRequest,
  EventRecurrenceRuleDto,
  FamilyEventDto,
  PatchEventRecurrenceRuleRequest,
  PatchEventRequest,
} from "../models/dto";

const EVENTS_BASE = "/private/family/events";
const RULES_BASE = "/private/family/event-recurrence-rules";

export interface EventFilters {
  from?: string;
  to?: string;
  assigneeProfileUuid?: string;
}

export const eventsApi = {
  async getAll(params?: EventFilters): Promise<FamilyEventDto[]> {
    const response = await get<ApiItemsResponse<FamilyEventDto>>(EVENTS_BASE, params ? { params } : undefined);
    return response.items;
  },

  getById(eventUuid: string): Promise<FamilyEventDto> {
    return get(`${EVENTS_BASE}/${eventUuid}`);
  },

  create(data: CreateEventRequest): Promise<FamilyEventDto> {
    return post(EVENTS_BASE, data);
  },

  update(eventUuid: string, data: PatchEventRequest): Promise<FamilyEventDto> {
    return patch(`${EVENTS_BASE}/${eventUuid}`, data);
  },

  remove(eventUuid: string): Promise<void> {
    return del(`${EVENTS_BASE}/${eventUuid}`);
  },
};

export const eventRecurrenceRulesApi = {
  async getAll(): Promise<EventRecurrenceRuleDto[]> {
    const response = await get<ApiItemsResponse<EventRecurrenceRuleDto>>(RULES_BASE);
    return response.items;
  },

  create(data: CreateEventRecurrenceRuleRequest): Promise<EventRecurrenceRuleDto> {
    return post(RULES_BASE, data);
  },

  update(ruleUuid: string, data: PatchEventRecurrenceRuleRequest): Promise<EventRecurrenceRuleDto> {
    return patch(`${RULES_BASE}/${ruleUuid}`, data);
  },

  remove(ruleUuid: string): Promise<void> {
    return del(`${RULES_BASE}/${ruleUuid}`);
  },
};
