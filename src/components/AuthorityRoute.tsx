import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { type Authority, useAuth } from "@/contexts/AuthContext";
import { TenantMembershipRole } from "@/services/AuthService";

interface AuthorityRouteProps {
  authority: Authority;
  requireTenantOwner?: boolean;
}

const AuthorityRoute: React.FC<AuthorityRouteProps> = ({ authority, requireTenantOwner = false }) => {
  const { principal } = useAuth();

  // If principal is not loaded yet, useAuth usually handles loading state in AuthProvider,
  // but if we are here, we are likely authenticated (due to parent PrivateRoute).

  if (!principal?.authorities?.includes(authority)) {
    return <Navigate to="/" replace />;
  }

  if (requireTenantOwner && principal.activeTenantRole !== TenantMembershipRole.OWNER) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AuthorityRoute;
