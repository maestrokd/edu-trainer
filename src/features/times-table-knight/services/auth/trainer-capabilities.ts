export type CapabilityTier = "guest" | "authenticated_free" | "authenticated_paid";

/**
 * Knight-local capability registry (per-feature copy, like the other trainers —
 * extraction into a shared library is logged follow-up work, §15.10).
 */
export interface KnightCapabilities {
  /** Times Table Knight is a gated/premium feature (decided 2026-07-09, §11) */
  canPlayTimesTableKnight: boolean;
  canPersistProgressBackend: boolean;
}

export const CAPABILITIES_MAP: Record<CapabilityTier, KnightCapabilities> = {
  guest: {
    canPlayTimesTableKnight: false,
    canPersistProgressBackend: false,
  },
  authenticated_free: {
    canPlayTimesTableKnight: false,
    canPersistProgressBackend: false,
  },
  authenticated_paid: {
    canPlayTimesTableKnight: true,
    canPersistProgressBackend: false, // backend persistence is future work
  },
};
