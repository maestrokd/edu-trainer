import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "./AuthProvider";

type Props = {
  variant?: "header" | "sidebar";
};

const AuthStatus: React.FC<Props> = ({ variant = "sidebar" }) => {
  const { user, loading, error, signOut } = useAuth();
  const { t } = useTranslation();

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  if (variant === "header") {
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
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <Skeleton className="h-14 w-full" />
      ) : (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/60 px-3 py-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
            {displayName?.[0] ?? "?"}
          </div>
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-xs text-muted-foreground">
              {user ? t("auth.signedInAs") : t("auth.notSignedIn")}
            </span>
            <span className="text-sm font-medium truncate">
              {user ? displayName : t("auth.signInTitle")}
            </span>
          </div>
        </div>
      )}

      {user ? (
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={signOut}
        >
          {t("auth.logoutAction")}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button asChild className="w-full" size="sm">
            <Link to="/auth/sign-in">{t("auth.signInTitle")}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link to="/auth/sign-up">{t("auth.signUpTitle")}</Link>
          </Button>
        </div>
      )}

      {error && (
        <div className="text-destructive text-xs" title={error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
