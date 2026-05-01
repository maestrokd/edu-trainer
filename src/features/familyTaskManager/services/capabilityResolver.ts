import type { CapabilityContext, FamilyTaskCapabilities, UserAccessLevel } from "../types/capabilities";

function resolveAccessLevel({ isAuthenticated, hasPremiumAccess }: CapabilityContext): UserAccessLevel {
  if (!isAuthenticated) {
    return "guest";
  }

  if (hasPremiumAccess) {
    return "authenticated_paid";
  }

  return "authenticated_free";
}

export function resolveFamilyTaskCapabilities(context: CapabilityContext): FamilyTaskCapabilities {
  const accessLevel = resolveAccessLevel(context);
  const isGuest = accessLevel === "guest";
  const isPaid = accessLevel === "authenticated_paid";

  return {
    accessLevel,
    canUseCoreFeature: !isGuest,
    canSaveProgress: !isGuest,
    canSyncAcrossDevices: !isGuest,
    canUseAdvancedModes: isPaid,
    canViewAdvancedStats: isPaid,
    canReceivePersonalizedSuggestions: !isGuest,
    canAccessPremiumContent: isPaid,
    shouldShowLoginSuggestion: isGuest,
    shouldShowUpgradeSuggestion: !isGuest && !isPaid,
  };
}
