import { get, post } from "@/services/ApiService.ts";
import { type TenantMembershipRole } from "@/services/AuthService.ts";

export const TenantInvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED",
} as const;

export type TenantInvitationStatus = (typeof TenantInvitationStatus)[keyof typeof TenantInvitationStatus];

export const TenantInvitationRole = {
  PARENT: "PARENT",
  CAREGIVER: "CAREGIVER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type TenantInvitationRole = (typeof TenantInvitationRole)[keyof typeof TenantInvitationRole];

export const TenantInvitationLocale = {
  EN_US: "en-US",
  UK_UA: "uk-UA",
  RU_RU: "ru-RU",
} as const;

export type TenantInvitationLocale = (typeof TenantInvitationLocale)[keyof typeof TenantInvitationLocale];

export interface CreateTenantInvitationRequest {
  email: string;
  role: TenantInvitationRole;
  locale?: TenantInvitationLocale;
}

export interface TenantInvitationResponse {
  invitationUuid: string;
  tenantUuid: string;
  tenantName: string;
  email: string;
  role: TenantInvitationRole;
  status: TenantInvitationStatus;
  expiresAt: string;
  createdAt?: string;
  token?: string;
}

export interface ResolveTenantInvitationResponse {
  invitationUuid: string;
  tenantUuid: string;
  tenantName: string;
  email: string;
  role: TenantMembershipRole;
  status: TenantInvitationStatus;
  expiresAt: string;
  existingUser: boolean;
}

export interface AcceptTenantInvitationResponse {
  tenantUuid: string;
  tenantName: string;
  role: TenantMembershipRole;
  status: "ACTIVE";
  joinedAt: string;
}

export interface TenantInvitationListItem {
  invitationUuid: string;
  tenantUuid: string;
  tenantName: string;
  email: string;
  role: TenantMembershipRole;
  status: TenantInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedByUserProfileUuid: string | null;
  acceptedByUserProfileUuid: string | null;
}

export interface TenantInvitationsResponse {
  items: TenantInvitationListItem[];
}

export interface ListTenantInvitationsQuery {
  role?: TenantMembershipRole;
  status?: TenantInvitationStatus;
  searchString?: string;
}

const appendIfPresent = (params: URLSearchParams, key: string, value: string | undefined) => {
  if (!value) return;
  params.set(key, value);
};

export const createTenantInvitation = async (
  tenantUuid: string,
  request: CreateTenantInvitationRequest
): Promise<TenantInvitationResponse> => {
  return await post<TenantInvitationResponse>(`/private/tenants/${tenantUuid}/invitations`, request);
};

export const resolveTenantInvitation = async (token: string): Promise<ResolveTenantInvitationResponse> => {
  return await get<ResolveTenantInvitationResponse>(`/auth/invitations/${token}`);
};

export const acceptTenantInvitation = async (token: string): Promise<AcceptTenantInvitationResponse> => {
  return await post<AcceptTenantInvitationResponse>("/private/tenants/invitations/accept", { token });
};

export const listTenantInvitations = async (
  tenantUuid: string,
  query?: ListTenantInvitationsQuery
): Promise<TenantInvitationsResponse> => {
  const params = new URLSearchParams();
  appendIfPresent(params, "role", query?.role);
  appendIfPresent(params, "status", query?.status);
  appendIfPresent(params, "searchString", query?.searchString?.trim() || undefined);

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return await get<TenantInvitationsResponse>(`/private/tenants/${tenantUuid}/invitations${suffix}`);
};

export default {
  createTenantInvitation,
  resolveTenantInvitation,
  acceptTenantInvitation,
  listTenantInvitations,
};
