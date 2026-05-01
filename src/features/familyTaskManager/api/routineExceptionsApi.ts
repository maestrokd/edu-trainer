import { get, post } from "@/services/ApiService";
import type {
  ApiPagedItemsResponse,
  CreateRoutineExceptionsRequest,
  ReopenRoutineExceptionsRequest,
  RoutineExceptionDto,
  RoutineExceptionsMutationSummaryDto,
  RoutineExceptionsQuery,
} from "../models/dto";

const BASE = "/private/family/routines";

function normalizeRoutineExceptionsQuery(query?: RoutineExceptionsQuery): URLSearchParams | undefined {
  if (!query) {
    return undefined;
  }

  const params = new URLSearchParams();

  if (query.assigneeProfileUuid?.trim()) {
    params.set("assigneeProfileUuid", query.assigneeProfileUuid.trim());
  }

  if (query.createdByProfileUuid?.trim()) {
    params.set("createdByProfileUuid", query.createdByProfileUuid.trim());
  }

  if (query.exceptionType) {
    params.set("exceptionType", query.exceptionType);
  }

  if (query.fromDate?.trim()) {
    params.set("fromDate", query.fromDate.trim());
  }

  if (query.toDate?.trim()) {
    params.set("toDate", query.toDate.trim());
  }

  if (query.searchString?.trim()) {
    params.set("searchString", query.searchString.trim());
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

export const routineExceptionsApi = {
  getAll(routineUuid: string, query?: RoutineExceptionsQuery): Promise<ApiPagedItemsResponse<RoutineExceptionDto>> {
    const normalizedRoutineUuid = routineUuid.trim();
    return get<ApiPagedItemsResponse<RoutineExceptionDto>>(
      `${BASE}/${normalizedRoutineUuid}/exceptions`,
      query ? { params: normalizeRoutineExceptionsQuery(query) } : undefined
    );
  },

  create(routineUuid: string, data: CreateRoutineExceptionsRequest): Promise<RoutineExceptionsMutationSummaryDto> {
    return post<RoutineExceptionsMutationSummaryDto>(`${BASE}/${routineUuid.trim()}/exceptions`, data);
  },

  reopen(routineUuid: string, data: ReopenRoutineExceptionsRequest): Promise<RoutineExceptionsMutationSummaryDto> {
    return post<RoutineExceptionsMutationSummaryDto>(`${BASE}/${routineUuid.trim()}/exceptions/reopen`, data);
  },
};
