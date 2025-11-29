import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomHeader } from "@/layout/CommonLayout";
import { getSupabaseClient } from "@/services/supabaseClient";
import { toast } from "sonner";
import { AlertCircle, MailCheck } from "lucide-react";

const ResetPasswordPage: React.FC = () => {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const { t } = useTranslation();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useCustomHeader(null, { visible: false });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/sign-in`,
      },
    );

    if (resetError) {
      setError(resetError.message);
      toast.error(t("auth.resetErrorTitle"), {
        description: resetError.message,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } else {
      toast.success(t("auth.resetSent"), {
        icon: <MailCheck className="h-4 w-4" />,
      });
    }
    setLoading(false);
  };

  return (
    <AuthPageShell
      title={t("auth.resetPasswordTitle")}
      description={t("auth.resetPasswordSubtitle")}
      footer={
        <div className="space-y-2">
          <div>
            {t("auth.remembered")}{" "}
            <Link to="/auth/sign-in" className="text-primary hover:underline">
              {t("auth.signInTitle")}
            </Link>
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.loading") : t("auth.resetAction")}
        </Button>
      </form>
    </AuthPageShell>
  );
};

export default ResetPasswordPage;
