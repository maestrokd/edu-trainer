import React from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomHeader } from "@/layout/CommonLayout";
import { getSupabaseClient } from "@/services/supabaseClient";

const SignInPage: React.FC = () => {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  useCustomHeader(null, { visible: false });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage(t("auth.signedIn"));
      navigate("/", { replace: true });
    }
    setLoading(false);
  };

  return (
    <AuthPageShell
      title={t("auth.signInTitle")}
      description={t("auth.subtitle")}
      footer={
        <div className="space-y-2">
          <div>
            {t("auth.noAccount")}{" "}
            <Link to="/auth/sign-up" className="text-primary hover:underline">
              {t("auth.signUpTitle")}
            </Link>
          </div>
          <Link
            to="/auth/reset-password"
            className="text-primary hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
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
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.loading") : t("auth.signInAction")}
        </Button>
      </form>
    </AuthPageShell>
  );
};

export default SignInPage;
