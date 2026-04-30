import { get } from "@/services/ApiService.ts";
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
  displayName: string;
  firstName: string | null;
  lastName: string | null;
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

export default {
  listTenantProfiles,
};
