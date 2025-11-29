import React from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/services/supabaseClient";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function loadSession() {
      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
      } else {
        setUser(data.session?.user ?? null);
        setSession(data.session ?? null);
        setError(null);
      }
      setLoading(false);
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        setUser(newSession?.user ?? null);
        setSession(newSession ?? null);
        setError(null);
        setLoading(false);
      },
    );

    loadSession();

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
    setLoading(false);
  }, [supabase]);

  const value = React.useMemo(
    () => ({ user, session, loading, error, signOut }),
    [user, session, loading, error, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
