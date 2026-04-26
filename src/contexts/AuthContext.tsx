import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { post, registerLogoutFn, registerRefreshFn } from "@/services/ApiService.ts";
import {
  type LoginResponse,
  TenantMembershipRole,
  logout as apiLogout,
  logoutTelegram,
} from "@/services/AuthService.ts";
import { getMe, type UserProfileDto } from "@/services/ProfileService.ts";
import WebApp from "@twa-dev/sdk";
import { jwtDecode } from "jwt-decode";

export const Authority = {
  MANAGE_PROFILES: "MANAGE_PROFILES",
  MANAGE_SUBSCRIPTIONS: "MANAGE_SUBSCRIPTIONS",
  VIEW_REPORTS: "VIEW_REPORTS",
  SPECIAL_GAMES: "SPECIAL_GAMES",
  ENGLISH_COACH_OPENAI: "ENGLISH_COACH_OPENAI",
} as const;

export type Authority = (typeof Authority)[keyof typeof Authority];

const toAuthorities = (arr: string[] | undefined | null): Authority[] => {
  if (!arr) return [];
  const allowed = new Set(Object.values(Authority));
  return arr.filter((a): a is Authority => allowed.has(a as Authority));
};

const toTenantRole = (
  role: (typeof TenantMembershipRole)[keyof typeof TenantMembershipRole] | string | null | undefined
): (typeof TenantMembershipRole)[keyof typeof TenantMembershipRole] | null => {
  if (!role) return null;
  const allowed = new Set(Object.values(TenantMembershipRole));
  return allowed.has(role as (typeof TenantMembershipRole)[keyof typeof TenantMembershipRole])
    ? (role as (typeof TenantMembershipRole)[keyof typeof TenantMembershipRole])
    : null;
};

const resolveActiveTenantName = (
  authResponse: LoginResponse | undefined,
  activeTenantUuid: string | null
): string | null => {
  if (!authResponse) return null;
  if (authResponse.activeTenantName) return authResponse.activeTenantName;
  if (!activeTenantUuid) return null;
  return authResponse.tenants?.find((tenant) => tenant.tenantUuid === activeTenantUuid)?.name ?? null;
};

export interface Principal {
  id: string;
  authorities: Authority[];
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileType: "PRIMARY" | "SECONDARY";
  activeTenantUuid: string | null;
  activeTenantName: string | null;
  activeTenantRole: (typeof TenantMembershipRole)[keyof typeof TenantMembershipRole] | null;
}

export const EmailVerificationType = {
  EMAIL_VERIFICATION_CODE_WEB: "EMAIL_VERIFICATION_CODE_WEB",
  PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB: "PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB",
} as const;

export type EmailVerificationType = (typeof EmailVerificationType)[keyof typeof EmailVerificationType];

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  principal: Principal | null;
  isTelegram: boolean;
  sendConfirmationCode: (email: string, verificationCodeType: EmailVerificationType) => Promise<void>;
  doRegister: (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string,
    invitationToken?: string
  ) => Promise<void>;
  doResetPassword: (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithTelegram: () => Promise<string>;
  doRefresh: () => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const didInit = useRef(false);
  const [initDone, setInitDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [telegramInitDataString, setTelegramInitDataString] = useState<string | null>(null);

  useEffect(() => {
    registerRefreshFn(refreshFn);
    registerLogoutFn(logoutFn);
  });

  const refreshFn = async (): Promise<string> => {
    if (telegramInitDataString) {
      return await loginWithTelegram();
    } else {
      return await refresh();
    }
  };

  const logoutFn = async (): Promise<void> => {
    apiLogout().catch((e) => console.error("Logout error", e));
    setToken(null);
    setPrincipal(null);
    localStorage.removeItem("token");
  };

  const applyAuthenticatedSession = async (authResponse: LoginResponse): Promise<string> => {
    const accessToken = authResponse.accessToken;
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    const newPrincipal = await fetchPrincipalData(accessToken, authResponse);
    setPrincipal(newPrincipal);
    return accessToken;
  };

  const refresh = async (): Promise<string> => {
    try {
      const authResponse = await post<LoginResponse>("/auth/refresh", undefined, { withCredentials: true });
      return await applyAuthenticatedSession(authResponse);
    } catch (e) {
      console.error("AuthProvider Refresh - error", e);
      throw e;
    }
  };

  const sendConfirmationCode = async (email: string, verificationCodeType: EmailVerificationType): Promise<void> => {
    await post<void>("/auth/email/verification/send", {
      email,
      verificationCodeType,
      initData: telegramInitDataString,
    });
  };

  const doRegister = async (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string,
    invitationToken?: string
  ): Promise<void> => {
    const authResponse = await post<LoginResponse>("/auth/registration", {
      email,
      emailVerificationCode: confirmationCode,
      password,
      confirmPassword,
      initData: telegramInitDataString,
      invitationToken,
    });
    await applyAuthenticatedSession(authResponse);
  };

  const doResetPassword = async (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string
  ): Promise<void> => {
    await post<void>("/auth/password/reset", {
      email,
      emailVerificationCode: confirmationCode,
      password,
      confirmPassword,
      initData: telegramInitDataString,
    });
  };

  const login = async (email: string, password: string): Promise<void> => {
    const authResponse = await post<LoginResponse>("/auth/login", {
      username: email,
      password,
      initData: telegramInitDataString,
    });
    await applyAuthenticatedSession(authResponse);
  };

  const loginWithTelegram = async (initDataParam?: string | null): Promise<string> => {
    const initData = initDataParam ?? telegramInitDataString;
    const authResponse = await post<LoginResponse>("/auth/login/telegram", {
      initData: initData,
    });
    return await applyAuthenticatedSession(authResponse);
  };

  const logout = () => {
    // Call backend logout
    if (telegramInitDataString) {
      logoutTelegram(telegramInitDataString).catch((e) => console.error("Logout Telegram error", e));
    } else {
      apiLogout().catch((e) => console.error("Logout error", e));
    }

    setToken(null);
    setPrincipal(null);
    localStorage.removeItem("token");
    // Close WebApp in Telegram
    /*if (window && window.Telegram && window.Telegram.WebApp) {
          WebApp.close();
        }*/
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const init = async () => {
      setInitDone(false);
      if (WebApp) {
        WebApp.ready();
      }

      if (WebApp?.initData) {
        const initDataString = WebApp.initData;
        if (initDataString) {
          setTelegramInitDataString(initDataString);
          try {
            await loginWithTelegram(initDataString);
          } catch (e) {
            console.error("AuthProvider useEffect - loginWithTelegram - error", e);
          }
        }
      } else {
        const savedJwt = localStorage.getItem("token");
        if (savedJwt) {
          try {
            await refresh();
          } catch (e) {
            console.error("AuthProvider useEffect - refresh savedJwt - error", e);
          }
        }
      }
      setInitDone(true);
    };
    init();
  });

  if (!initDone) {
    return <div className="flex items-center justify-center h-screen">Loading…</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        principal,
        isTelegram: Boolean(telegramInitDataString),
        sendConfirmationCode,
        doRegister,
        doResetPassword,
        login,
        loginWithTelegram,
        doRefresh: refreshFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const fetchPrincipalData = async (token: string, authResponse?: LoginResponse): Promise<Principal> => {
  // We still decode token for authorities if they are not in the profile response or if we prefer token source of truth for authz
  const { sub, authorities, activeTenantUuid, activeTenantRole } = jwtDecode<{
    sub: string;
    authorities: string[];
    activeTenantUuid?: string | null;
    activeTenantRole?: string | null;
  }>(token);

  const profile: UserProfileDto = await getMe();
  const resolvedActiveTenantUuid = authResponse?.activeTenantUuid ?? activeTenantUuid ?? null;
  const resolvedActiveTenantRole = toTenantRole(authResponse?.activeTenantRole ?? activeTenantRole);

  return {
    id: sub,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    profileType: profile.profileType,
    authorities: toAuthorities(authorities),
    activeTenantUuid: resolvedActiveTenantUuid,
    activeTenantName: resolveActiveTenantName(authResponse, resolvedActiveTenantUuid),
    activeTenantRole: resolvedActiveTenantRole,
  };
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth should be used within AuthProvider");
  return ctx;
};
