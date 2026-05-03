import { del, get, patch, post } from "@/services/ApiService.ts";
import { type TenantMembershipRole } from "@/services/AuthService.ts";

export const TenantProfileType = {
  ADULT: "ADULT",
  CHILD: "CHILD",
} as const;

export type TenantProfileType = (typeof TenantProfileType)[keyof typeof TenantProfileType];

export const TenantMembershipStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REMOVED: "REMOVED",
} as const;

export type TenantMembershipStatus = (typeof TenantMembershipStatus)[keyof typeof TenantMembershipStatus];

export interface TenantProfileListItem {
  profileUuid: string;
  tenantUuid: string;
  profileType: TenantProfileType;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarEmoji: string | null;
  color: string | null;
  locale: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  linkedUserProfileUuid: string | null;
  email: string | null;
  username: string | null;
  role: TenantMembershipRole | null;
  membershipStatus: TenantMembershipStatus | null;
}

export interface TenantProfilesResponse {
  items: TenantProfileListItem[];
}

export interface CreateTenantProfileRequest {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  displayName?: string;
  avatarEmoji?: string;
  color?: string;
  active?: boolean;
}

export interface PatchTenantProfileRequest {
  firstName?: string;
  lastName?: string;
  password?: string;
  locale?: string;
  displayName?: string;
  avatarEmoji?: string;
  color?: string;
  active?: boolean;
}

export interface ListTenantProfilesQuery {
  profileType?: TenantProfileType;
  role?: TenantMembershipRole;
  membershipStatus?: TenantMembershipStatus;
  active?: boolean;
  searchString?: string;
}

const appendIfPresent = (params: URLSearchParams, key: string, value: string | boolean | undefined) => {
  if (value === undefined) return;
  params.set(key, String(value));
};

export const listTenantProfiles = async (
  tenantUuid: string,
  query?: ListTenantProfilesQuery
): Promise<TenantProfilesResponse> => {
  const params = new URLSearchParams();
  appendIfPresent(params, "profileType", query?.profileType);
  appendIfPresent(params, "role", query?.role);
  appendIfPresent(params, "membershipStatus", query?.membershipStatus);
  appendIfPresent(params, "active", query?.active);
  appendIfPresent(params, "searchString", query?.searchString?.trim() || undefined);

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return await get<TenantProfilesResponse>(`/private/tenants/${tenantUuid}/profiles${suffix}`);
};

export const getTenantProfile = async (tenantUuid: string, profileUuid: string): Promise<TenantProfileListItem> => {
  return await get<TenantProfileListItem>(`/private/tenants/${tenantUuid}/profiles/${profileUuid}`);
};

export const createTenantProfile = async (
  tenantUuid: string,
  request: CreateTenantProfileRequest
): Promise<TenantProfileListItem> => {
  return await post<TenantProfileListItem>(`/private/tenants/${tenantUuid}/profiles`, request);
};

export const patchTenantProfile = async (
  tenantUuid: string,
  profileUuid: string,
  request: PatchTenantProfileRequest
): Promise<TenantProfileListItem> => {
  return await patch<TenantProfileListItem>(`/private/tenants/${tenantUuid}/profiles/${profileUuid}`, request);
};

export const deleteTenantProfile = async (tenantUuid: string, profileUuid: string): Promise<void> => {
  await del<void>(`/private/tenants/${tenantUuid}/profiles/${profileUuid}`);
};

export default {
  listTenantProfiles,
  getTenantProfile,
  createTenantProfile,
  patchTenantProfile,
  deleteTenantProfile,
};
