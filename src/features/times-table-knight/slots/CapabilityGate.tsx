import { useCapabilityAccess } from "../hooks/useCapabilityAccess";
import type { KnightCapabilities } from "../services/auth/trainer-capabilities";

interface CapabilityGateProps {
  capability: keyof KnightCapabilities;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Conditionally renders children based on the user's capability tier. */
export function CapabilityGate({ capability, children, fallback = null }: CapabilityGateProps) {
  const { capabilities } = useCapabilityAccess();
  return capabilities[capability] ? <>{children}</> : <>{fallback}</>;
}
