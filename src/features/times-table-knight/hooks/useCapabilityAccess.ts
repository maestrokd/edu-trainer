import { useMemo } from "react";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { CAPABILITIES_MAP, type CapabilityTier, type KnightCapabilities } from "../services/auth/trainer-capabilities";

/**
 * Derives the capability tier from real auth state: the SPECIAL_GAMES
 * authority marks the paid arcade entitlement.
 */
export function useCapabilityAccess(): { tier: CapabilityTier; capabilities: KnightCapabilities } {
  const { isAuthenticated, principal } = useAuth();

  const tier = useMemo<CapabilityTier>(() => {
    if (!isAuthenticated || !principal) return "guest";
    return principal.authorities.includes(Authority.SPECIAL_GAMES) ? "authenticated_paid" : "authenticated_free";
  }, [isAuthenticated, principal]);

  const capabilities = useMemo(() => CAPABILITIES_MAP[tier], [tier]);

  return { tier, capabilities };
}
