import { describe, expect, it } from "vitest";
import { resolveFamilyTaskCapabilities } from "../services/capabilityResolver";

describe("resolveFamilyTaskCapabilities", () => {
  it("returns guest capabilities when user is not authenticated", () => {
    const capabilities = resolveFamilyTaskCapabilities({ isAuthenticated: false, hasPremiumAccess: false });

    expect(capabilities.accessLevel).toBe("guest");
    expect(capabilities.canUseCoreFeature).toBe(false);
    expect(capabilities.shouldShowLoginSuggestion).toBe(true);
    expect(capabilities.shouldShowUpgradeSuggestion).toBe(false);
  });

  it("returns free authenticated capabilities when premium entitlement is absent", () => {
    const capabilities = resolveFamilyTaskCapabilities({ isAuthenticated: true, hasPremiumAccess: false });

    expect(capabilities.accessLevel).toBe("authenticated_free");
    expect(capabilities.canUseCoreFeature).toBe(true);
    expect(capabilities.canUseAdvancedModes).toBe(false);
    expect(capabilities.shouldShowUpgradeSuggestion).toBe(true);
  });

  it("returns paid authenticated capabilities when premium entitlement exists", () => {
    const capabilities = resolveFamilyTaskCapabilities({ isAuthenticated: true, hasPremiumAccess: true });

    expect(capabilities.accessLevel).toBe("authenticated_paid");
    expect(capabilities.canUseAdvancedModes).toBe(true);
    expect(capabilities.canAccessPremiumContent).toBe(true);
    expect(capabilities.shouldShowUpgradeSuggestion).toBe(false);
  });
});
