import React from "react";
import { CAPABILITIES_BY_ACCESS, type UserAccessLevel } from "../services/auth/trainer-capabilities";

export function usePowersOfTenCapabilities() {
  const accessLevel = React.useMemo<UserAccessLevel>(() => "guest", []);
  return { accessLevel, capabilities: CAPABILITIES_BY_ACCESS[accessLevel] };
}
