import { get, post } from "@/services/ApiService.ts";
import { type TenantMembershipRole } from "@/services/AuthService.ts";

export const TenantType = {
  FAMILY: "FAMILY",
  COMPANY: "COMPANY",
} as const;

export type TenantType = (typeof TenantType)[keyof typeof TenantType];

export const TenantStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  ARCHIVED: "ARCHIVED",
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const TenantMembershipStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REMOVED: "REMOVED",
} as const;

export type TenantMembershipStatus = (typeof TenantMembershipStatus)[keyof typeof TenantMembershipStatus];

export interface TenantListItem {
  tenantUuid: string;
  tenantType: TenantType;
  name: string;
  timezone: string | null;
  locale: string | null;
  tenantStatus: TenantStatus;
  membershipRole: TenantMembershipRole;
  membershipStatus: TenantMembershipStatus;
  defaultTenant: boolean;
  joinedAt: string;
}

export interface TenantListResponse {
  items: TenantListItem[];
}

export const listMyTenants = async (): Promise<TenantListResponse> => {
  return await get<TenantListResponse>("/private/tenants");
};

export const setDefaultTenant = async (tenantUuid: string): Promise<TenantListItem> => {
  return await post<TenantListItem>(`/private/tenants/${tenantUuid}/default`);
};

export default {
  listMyTenants,
  setDefaultTenant,
};
