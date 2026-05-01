import { get, post } from "@/services/ApiService";
import { getTimezoneHeader, getBrowserTimezone } from "./timezone";
import type { FamilyInfoDto } from "../models/dto";

const BASE = "/private/family";
export const FAMILY_CONTEXT_INCLUDE = {
  HOUSEHOLD_MEMBERS: "HOUSEHOLD_MEMBERS",
  CHILD_PROFILES: "CHILD_PROFILES",
} as const;
export type FamilyContextInclude = (typeof FAMILY_CONTEXT_INCLUDE)[keyof typeof FAMILY_CONTEXT_INCLUDE];

interface GetMyFamilyOptions {
  include?: FamilyContextInclude[];
}

function normalizeFamilyIncludeParam(include?: FamilyContextInclude[]): string | undefined {
  if (!include?.length) {
    return undefined;
  }

  const normalized = [...new Set(include.map((value) => value.trim()).filter(Boolean))];
  return normalized.length > 0 ? normalized.join(",") : undefined;
}

export const familyFamiliesApi = {
  getMyFamily(options?: GetMyFamilyOptions): Promise<FamilyInfoDto> {
    const headers = getTimezoneHeader();
    const includeParam = normalizeFamilyIncludeParam(options?.include);

    return get(`${BASE}/families/me`, {
      ...(headers ? { headers } : {}),
      ...(includeParam ? { params: { include: includeParam } } : {}),
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
