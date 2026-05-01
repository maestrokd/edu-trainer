import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canManageFamilyTask } from "../../domain/access";

export function FamilyManageRoute() {
  const { principal } = useAuth();

  if (!canManageFamilyTask(principal)) {
    return <Navigate to="/family-tasks" replace />;
  }

  return <Outlet />;
}
