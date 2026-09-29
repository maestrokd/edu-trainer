export type UserAccessLevel = "guest" | "authenticated_free" | "authenticated_paid";

export interface PowersOfTenTrainerCapabilities {
  canUseCoreFeature: boolean;
  canSaveProgress: boolean;
  canViewAdvancedStats: boolean;
}

export const CAPABILITIES_BY_ACCESS: Record<UserAccessLevel, PowersOfTenTrainerCapabilities> = {
  guest: { canUseCoreFeature: true, canSaveProgress: false, canViewAdvancedStats: false },
  authenticated_free: { canUseCoreFeature: true, canSaveProgress: true, canViewAdvancedStats: false },
  authenticated_paid: { canUseCoreFeature: true, canSaveProgress: true, canViewAdvancedStats: true },
};
