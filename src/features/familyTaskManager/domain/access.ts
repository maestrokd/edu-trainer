import type { Principal } from "@/contexts/AuthContext";
import { TenantMembershipRole } from "@/services/AuthService";

export function hasFamilyTaskManageAccess(activeTenantRole: Principal["activeTenantRole"] | null | undefined): boolean {
  return activeTenantRole === TenantMembershipRole.OWNER || activeTenantRole === TenantMembershipRole.PARENT;
}

export function canManageFamilyTask(principal: Principal | null | undefined): boolean {
  return hasFamilyTaskManageAccess(principal?.activeTenantRole);
}
