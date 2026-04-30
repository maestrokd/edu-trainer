import { post } from "./ApiService";

export const TenantMembershipRole = {
  OWNER: "OWNER",
  PARENT: "PARENT",
  CAREGIVER: "CAREGIVER",
  CHILD_DOER: "CHILD_DOER",
  CHILD_VIEWER: "CHILD_VIEWER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type TenantMembershipRole = (typeof TenantMembershipRole)[keyof typeof TenantMembershipRole];

export interface TenantSummary {
  tenantUuid: string;
  name: string;
  role: TenantMembershipRole;
  defaultTenant: boolean;
}

export interface LoginResponse {
  accessToken: string;
  activeTenantUuid?: string | null;
  activeTenantName?: string | null;
  activeTenantRole?: TenantMembershipRole | null;
  tenants?: TenantSummary[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export const useLogin = async (email: string, password: string): Promise<void> => {
  const { accessToken } = await post<LoginResponse>("/auth/login", {
    username: email,
    password,
  });
  localStorage.setItem("token", accessToken);
};

export const useLoginWithTelegram = async (initData: string): Promise<void> => {
  const { accessToken } = await post<LoginResponse>("/auth/login/telegram", {
    initData,
  });
  localStorage.setItem("token", accessToken);
};

export const logout = async (): Promise<void> => {
  await post("/auth/logout");
};

export const logoutTelegram = async (initData: string): Promise<void> => {
  await post("/auth/logout/telegram", {
    initData,
  });
};
