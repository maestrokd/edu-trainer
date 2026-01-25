import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AuthorityRouteProps {
  authority: string;
}

const AuthorityRoute: React.FC<AuthorityRouteProps> = ({ authority }) => {
  const { principal } = useAuth();

  // If principal is not loaded yet, useAuth usually handles loading state in AuthProvider,
  // but if we are here, we are likely authenticated (due to parent PrivateRoute).

  // Casting as any or string match if needed
  if (!principal?.authorities?.includes(authority as any)) {
    // Or check against enum if type safe
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AuthorityRoute;
