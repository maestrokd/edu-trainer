import { del, get, patch, post } from "@/services/ApiService";
import type {
  ApiItemsResponse,
  CreateListItemRequest,
  CreateListRequest,
  CreateListSectionRequest,
  FamilyListDto,
  ListItemDto,
  ListSectionDto,
  PatchListItemRequest,
  PatchListRequest,
  PatchListSectionRequest,
} from "../models/dto";

const LISTS_BASE = "/private/family/lists";
const SECTIONS_BASE = "/private/family/list-sections";
const ITEMS_BASE = "/private/family/list-items";

export const listsApi = {
  async getAll(active?: boolean): Promise<FamilyListDto[]> {
    const response = await get<ApiItemsResponse<FamilyListDto>>(
      LISTS_BASE,
      active === undefined ? undefined : { params: { active } }
    );
    return response.items;
  },

  getById(listUuid: string): Promise<FamilyListDto> {
    return get(`${LISTS_BASE}/${listUuid}`);
  },

  create(data: CreateListRequest): Promise<FamilyListDto> {
    return post(LISTS_BASE, data);
  },

  update(listUuid: string, data: PatchListRequest): Promise<FamilyListDto> {
    return patch(`${LISTS_BASE}/${listUuid}`, data);
  },

  remove(listUuid: string): Promise<void> {
    return del(`${LISTS_BASE}/${listUuid}`);
  },
};

export const listSectionsApi = {
  async getByList(listUuid: string): Promise<ListSectionDto[]> {
    const response = await get<ApiItemsResponse<ListSectionDto>>(SECTIONS_BASE, { params: { listUuid } });
    return response.items;
  },

  create(data: CreateListSectionRequest): Promise<ListSectionDto> {
    return post(SECTIONS_BASE, data);
  },

  update(sectionUuid: string, data: PatchListSectionRequest): Promise<ListSectionDto> {
    return patch(`${SECTIONS_BASE}/${sectionUuid}`, data);
  },

  remove(sectionUuid: string): Promise<void> {
    return del(`${SECTIONS_BASE}/${sectionUuid}`);
  },
};

export const listItemsApi = {
  async getByList(listUuid: string, completed?: boolean): Promise<ListItemDto[]> {
    const response = await get<ApiItemsResponse<ListItemDto>>(ITEMS_BASE, {
      params: completed === undefined ? { listUuid } : { listUuid, completed },
    });
    return response.items;
  },

  create(data: CreateListItemRequest): Promise<ListItemDto> {
    return post(ITEMS_BASE, data);
  },

  update(itemUuid: string, data: PatchListItemRequest): Promise<ListItemDto> {
    return patch(`${ITEMS_BASE}/${itemUuid}`, data);
  },

  remove(itemUuid: string): Promise<void> {
    return del(`${ITEMS_BASE}/${itemUuid}`);
  },

  toggleComplete(itemUuid: string): Promise<ListItemDto> {
    return post(`${ITEMS_BASE}/${itemUuid}/toggle-complete`);
  },
};
