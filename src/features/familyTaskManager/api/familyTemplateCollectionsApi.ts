import type { AxiosResponse } from "axios";
import { apiClient, get, post } from "@/services/ApiService";
import type {
  ApiItemsResponse,
  ChoreTemplateCandidateDto,
  ChoreTemplateCollectionPayload,
  RewardTemplateCandidateDto,
  RewardTemplateCollectionPayload,
  RoutineTemplateCandidateDto,
  RoutineTemplateCollectionPayload,
  TemplateCollectionPayload,
  TemplateExportRequest,
  TemplateImportExecuteResponseDto,
  TemplateImportPreviewResponseDto,
} from "../models/dto";

type AnyTemplateItem = Record<string, unknown>;
export type AnyTemplateCollectionPayload = TemplateCollectionPayload<AnyTemplateItem>;

export interface SafeParseTemplateJsonSuccess {
  ok: true;
  payload: AnyTemplateCollectionPayload;
}

export interface SafeParseTemplateJsonFailure {
  ok: false;
  errorCode:
    | "EMPTY"
    | "PARSE_ERROR"
    | "INVALID_ROOT"
    | "MISSING_SCHEMA_VERSION"
    | "INVALID_ITEMS"
    | "INVALID_ITEM_ENTRY";
  errorDetail?: string;
}

export type SafeParseTemplateJsonResult = SafeParseTemplateJsonSuccess | SafeParseTemplateJsonFailure;

const BASE = "/private/family/template-collections";
export const TEMPLATE_COLLECTION_MAX_FILE_SIZE_BYTES = 1_048_576;

function unwrapItemsResponse<T>(response: ApiItemsResponse<T> | T[]): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response.items) ? response.items : [];
}

function buildFormData(file: File): FormData {
  const data = new FormData();
  data.append("file", file);
  return data;
}

async function exportCollection<TCollection extends TemplateCollectionPayload<object>>(
  path: string,
  req: TemplateExportRequest,
  download = false
): Promise<TCollection | AxiosResponse<Blob>> {
  if (download) {
    return apiClient.post<Blob>(`${BASE}/${path}/export`, req, {
      params: { download: true },
      responseType: "blob",
    });
  }

  return post<TCollection>(`${BASE}/${path}/export`, req);
}

function previewImport(path: string, payload: AnyTemplateCollectionPayload): Promise<TemplateImportPreviewResponseDto> {
  return post(`${BASE}/${path}/import/preview`, payload);
}

function executeImport(path: string, payload: AnyTemplateCollectionPayload): Promise<TemplateImportExecuteResponseDto> {
  return post(`${BASE}/${path}/import`, payload);
}

function previewImportFile(path: string, file: File): Promise<TemplateImportPreviewResponseDto> {
  return post(`${BASE}/${path}/import-file/preview`, buildFormData(file), {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

function executeImportFile(path: string, file: File): Promise<TemplateImportExecuteResponseDto> {
  return post(`${BASE}/${path}/import-file`, buildFormData(file), {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export const familyTemplateCollectionsApi = {
  async listRoutineCandidates(): Promise<RoutineTemplateCandidateDto[]> {
    const response = await get<ApiItemsResponse<RoutineTemplateCandidateDto> | RoutineTemplateCandidateDto[]>(
      `${BASE}/routines`
    );
    return unwrapItemsResponse(response);
  },

  exportRoutines(
    req: TemplateExportRequest,
    download = false
  ): Promise<RoutineTemplateCollectionPayload | AxiosResponse<Blob>> {
    return exportCollection<RoutineTemplateCollectionPayload>("routines", req, download);
  },

  previewRoutineImport(payload: AnyTemplateCollectionPayload): Promise<TemplateImportPreviewResponseDto> {
    return previewImport("routines", payload);
  },

  importRoutines(payload: AnyTemplateCollectionPayload): Promise<TemplateImportExecuteResponseDto> {
    return executeImport("routines", payload);
  },

  previewRoutineImportFile(file: File): Promise<TemplateImportPreviewResponseDto> {
    return previewImportFile("routines", file);
  },

  importRoutinesFile(file: File): Promise<TemplateImportExecuteResponseDto> {
    return executeImportFile("routines", file);
  },

  async listChoreCandidates(): Promise<ChoreTemplateCandidateDto[]> {
    const response = await get<ApiItemsResponse<ChoreTemplateCandidateDto> | ChoreTemplateCandidateDto[]>(
      `${BASE}/chores`
    );
    return unwrapItemsResponse(response);
  },

  exportChores(
    req: TemplateExportRequest,
    download = false
  ): Promise<ChoreTemplateCollectionPayload | AxiosResponse<Blob>> {
    return exportCollection<ChoreTemplateCollectionPayload>("chores", req, download);
  },

  previewChoreImport(payload: AnyTemplateCollectionPayload): Promise<TemplateImportPreviewResponseDto> {
    return previewImport("chores", payload);
  },

  importChores(payload: AnyTemplateCollectionPayload): Promise<TemplateImportExecuteResponseDto> {
    return executeImport("chores", payload);
  },

  previewChoreImportFile(file: File): Promise<TemplateImportPreviewResponseDto> {
    return previewImportFile("chores", file);
  },

  importChoresFile(file: File): Promise<TemplateImportExecuteResponseDto> {
    return executeImportFile("chores", file);
  },

  async listRewardCandidates(): Promise<RewardTemplateCandidateDto[]> {
    const response = await get<ApiItemsResponse<RewardTemplateCandidateDto> | RewardTemplateCandidateDto[]>(
      `${BASE}/rewards`
    );
    return unwrapItemsResponse(response);
  },

  exportRewards(
    req: TemplateExportRequest,
    download = false
  ): Promise<RewardTemplateCollectionPayload | AxiosResponse<Blob>> {
    return exportCollection<RewardTemplateCollectionPayload>("rewards", req, download);
  },

  previewRewardImport(payload: AnyTemplateCollectionPayload): Promise<TemplateImportPreviewResponseDto> {
    return previewImport("rewards", payload);
  },

  importRewards(payload: AnyTemplateCollectionPayload): Promise<TemplateImportExecuteResponseDto> {
    return executeImport("rewards", payload);
  },

  previewRewardImportFile(file: File): Promise<TemplateImportPreviewResponseDto> {
    return previewImportFile("rewards", file);
  },

  importRewardsFile(file: File): Promise<TemplateImportExecuteResponseDto> {
    return executeImportFile("rewards", file);
  },
};

function resolveFileNameFromDisposition(disposition: string | undefined, fallbackName: string): string {
  if (!disposition) {
    return fallbackName;
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const regularMatch = disposition.match(/filename="?([^"]+)"?/i);
  return regularMatch?.[1] ?? fallbackName;
}

export function downloadBlob(response: AxiosResponse<Blob>, fallbackName: string): string {
  const disposition = response.headers["content-disposition"] as string | undefined;
  const fileName = resolveFileNameFromDisposition(disposition, fallbackName);

  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);

  return fileName;
}

export function safeParseTemplateJson(text: string): SafeParseTemplateJsonResult {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return {
      ok: false,
      errorCode: "EMPTY",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedText);
  } catch (error) {
    const detail = error instanceof Error ? error.message : undefined;
    return {
      ok: false,
      errorCode: "PARSE_ERROR",
      errorDetail: detail,
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      errorCode: "INVALID_ROOT",
    };
  }

  const candidate = parsed as Partial<AnyTemplateCollectionPayload>;
  if (typeof candidate.schemaVersion !== "string" || candidate.schemaVersion.trim().length === 0) {
    return {
      ok: false,
      errorCode: "MISSING_SCHEMA_VERSION",
    };
  }

  if (!Array.isArray(candidate.items)) {
    return {
      ok: false,
      errorCode: "INVALID_ITEMS",
    };
  }

  const hasInvalidItem = candidate.items.some((item) => !item || typeof item !== "object" || Array.isArray(item));
  if (hasInvalidItem) {
    return {
      ok: false,
      errorCode: "INVALID_ITEM_ENTRY",
    };
  }

  return {
    ok: true,
    payload: {
      schemaVersion: candidate.schemaVersion,
      items: candidate.items as AnyTemplateItem[],
    },
  };
}

export function buildSelectedTemplatePayload<TItem extends object>(
  fullPayload: TemplateCollectionPayload<TItem>,
  selectedIndexes: number[]
): TemplateCollectionPayload<TItem> {
  const selected = [...new Set(selectedIndexes)]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < fullPayload.items.length)
    .map((index) => fullPayload.items[index]);

  return {
    schemaVersion: fullPayload.schemaVersion,
    items: selected,
  };
}

export function buildNextSelection(current: string[], value: string, checked: boolean): string[] {
  const inSelection = current.includes(value);

  if (checked && !inSelection) {
    return [...current, value];
  }

  if (!checked && inSelection) {
    return current.filter((entry) => entry !== value);
  }

  return current;
}
