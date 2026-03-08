import { Authority, useAuth } from "@/contexts/AuthContext";
import { resolveFamilyTaskCapabilities } from "../services/capabilityResolver";

export function useFamilyTaskCapabilities() {
  const { isAuthenticated, principal } = useAuth();
  const authorities = principal?.authorities ?? [];
  const hasPremiumAccess =
    authorities.includes(Authority.MANAGE_SUBSCRIPTIONS) || authorities.includes(Authority.SPECIAL_GAMES);

  return resolveFamilyTaskCapabilities({ isAuthenticated, hasPremiumAccess });
}
