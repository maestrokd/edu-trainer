export type User = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    [key: string]: unknown;
  };
};

export type Session = {
  user: User | null;
} | null;

export type AuthChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY";

type AuthSubscription = { unsubscribe: () => void };

type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session) => void;

type AuthResponse = { data: { session: Session }; error: Error | null };

type SignInWithPasswordCredentials = { email: string; password: string };

type SignUpOptions = { emailRedirectTo?: string };

type SignUpCredentials = { email: string; password: string; options?: SignUpOptions };

type ResetPasswordOptions = { redirectTo?: string };

const listeners = new Set<AuthStateChangeCallback>();

let currentSession: Session = null;

function notify(event: AuthChangeEvent) {
  for (const listener of listeners) {
    listener(event, currentSession);
  }
}

const auth = {
  async getSession(): Promise<AuthResponse> {
    return { data: { session: currentSession }, error: null };
  },
  onAuthStateChange(callback: AuthStateChangeCallback) {
    listeners.add(callback);
    const subscription: AuthSubscription = {
      unsubscribe: () => listeners.delete(callback),
    };
    return { data: { subscription }, error: null };
  },
  async signOut(): Promise<{ error: Error | null }> {
    currentSession = null;
    notify("SIGNED_OUT");
    return { error: null };
  },
  async signInWithPassword({ email }: SignInWithPasswordCredentials): Promise<{
    data: { session: Session };
    error: Error | null;
  }> {
    currentSession = { user: { id: "stub-user", email } };
    notify("SIGNED_IN");
    return { data: { session: currentSession }, error: null };
  },
  async signUp({ email }: SignUpCredentials): Promise<{
    data: { user: User; session: Session };
    error: Error | null;
  }> {
    return {
      data: { user: { id: "stub-user", email }, session: null },
      error: null,
    };
  },
  async resetPasswordForEmail(
    _email: string,
    _options?: ResetPasswordOptions,
  ): Promise<{ data: { user: null }; error: Error | null }> {
    return { data: { user: null }, error: null };
  },
  async exchangeCodeForSession(_code: string): Promise<AuthResponse> {
    return { data: { session: currentSession }, error: null };
  },
};

export interface SupabaseClient {
  auth: typeof auth;
}

export function createClient(_url: string, _anonKey: string): SupabaseClient {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.warn(
      "Using a local Supabase stub. Install @supabase/supabase-js for full functionality.",
    );
  }
  return { auth };
}
