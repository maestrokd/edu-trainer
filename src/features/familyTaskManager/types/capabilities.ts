export type UserAccessLevel = "guest" | "authenticated_free" | "authenticated_paid";

export interface FamilyTaskCapabilities {
  accessLevel: UserAccessLevel;
  canUseCoreFeature: boolean;
  canSaveProgress: boolean;
  canSyncAcrossDevices: boolean;
  canUseAdvancedModes: boolean;
  canViewAdvancedStats: boolean;
  canReceivePersonalizedSuggestions: boolean;
  canAccessPremiumContent: boolean;
  shouldShowLoginSuggestion: boolean;
  shouldShowUpgradeSuggestion: boolean;
}

export interface CapabilityContext {
  isAuthenticated: boolean;
  hasPremiumAccess: boolean;
}
