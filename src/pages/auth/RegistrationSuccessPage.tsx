import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { MailCheck, ShieldCheck } from "lucide-react";

import AuthPageShell from "@/components/auth/AuthPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCustomHeader } from "@/layout/CommonLayout";

const RegistrationSuccessPage: React.FC = () => {
  const { t } = useTranslation();

  useCustomHeader(null, { visible: false });

  return (
    <AuthPageShell
      title={t("auth.verificationTitle")}
      description={t("auth.verificationSubtitle")}
      footer={
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden />
            <span>{t("auth.verificationHint")}</span>
          </div>
          <Button asChild className="w-full">
            <Link to="/auth/sign-in">{t("auth.signInAction")}</Link>
          </Button>
        </div>
      }
    >
      <Alert className="bg-muted/70">
        <MailCheck aria-hidden className="text-primary" />
        <AlertTitle>{t("auth.signUpSuccessTitle")}</AlertTitle>
        <AlertDescription>{t("auth.signUpSuccess")}</AlertDescription>
      </Alert>
    </AuthPageShell>
  );
};

export default RegistrationSuccessPage;
