import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "./AuthProvider";

const AuthStatus: React.FC = () => {
  const { user, loading, error, signOut } = useAuth();
  const { t } = useTranslation();

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  return (
    <div className="flex items-center gap-2">
      {loading ? (
        <Skeleton className="h-9 w-24" />
      ) : user ? (
        <>
          <div className="flex flex-col text-right leading-tight">
            <span className="text-xs text-muted-foreground">
              {t("auth.signedInAs")}
            </span>
            <span className="text-sm font-medium truncate max-w-[12ch]">
              {displayName}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            {t("auth.logoutAction")}
          </Button>
        </>
      ) : (
        <Button variant="secondary" size="sm" asChild>
          <Link to="/auth/sign-in">{t("auth.signInTitle")}</Link>
        </Button>
      )}
      {error && (
        <span
          className="text-destructive text-xs max-w-[180px] truncate"
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default AuthStatus;
