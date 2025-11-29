import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";

import AuthPageShell from "@/components/auth/AuthPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCustomHeader } from "@/layout/CommonLayout";
import { getSupabaseClient } from "@/services/supabaseClient";
import { toast } from "sonner";

const EmailVerificationPage: React.FC = () => {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<"pending" | "success" | "error">(
    "pending",
  );
  const [error, setError] = React.useState<string | null>(null);

  useCustomHeader(null, { visible: false });

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      setError(t("auth.verificationErrorBody"));
      setStatus("error");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }: { error: Error | null }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          setStatus("error");
          return;
        }
        setStatus("success");
      })
      .catch((unexpectedError: unknown) => {
        setError(String(unexpectedError));
        setStatus("error");
      });
  }, [location.search, supabase.auth, t]);

  React.useEffect(() => {
    if (status === "success") {
      toast.success(t("auth.verificationSuccessTitle"), {
        description: t("auth.verificationSuccessBody"),
      });
    }
    if (status === "error") {
      toast.error(t("auth.verificationErrorTitle"), {
        description: error ?? undefined,
      });
    }
  }, [error, status, t]);

  return (
    <AuthPageShell
      title={t("auth.verificationSuccessTitle")}
      description={t("auth.verificationSuccessBody")}
      footer={
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden />
            <span>{t("auth.verificationSuccessNote")}</span>
          </div>
          <Button className="w-full" onClick={() => navigate("/auth/sign-in")}>
            {t("auth.signInAction")}
          </Button>
        </div>
      }
    >
      {status === "pending" && (
        <Alert className="bg-muted/70">
          <MailCheck aria-hidden className="text-primary" />
          <AlertTitle>{t("auth.verificationWorkingTitle")}</AlertTitle>
          <AlertDescription>
            {t("auth.verificationWorkingBody")}
          </AlertDescription>
        </Alert>
      )}

      {status === "success" && (
        <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950 dark:text-green-100">
          <CheckCircle2 aria-hidden className="text-green-500" />
          <AlertTitle>{t("auth.verificationSuccessTitle")}</AlertTitle>
          <AlertDescription>{t("auth.verificationSuccessBody")}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <ShieldCheck aria-hidden />
          <AlertTitle>{t("auth.verificationErrorTitle")}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{t("auth.verificationErrorBody")}</p>
            {error && <p className="text-xs break-words">{error}</p>}
            <Button asChild variant="secondary" size="sm">
              <Link to="/auth/sign-in">{t("auth.signInTitle")}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </AuthPageShell>
  );
};

export default EmailVerificationPage;
