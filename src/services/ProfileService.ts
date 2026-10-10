import { get } from "./ApiService";
import type { LegalConsentState } from "@/services/LegalService.ts";

export interface UserProfileDto {
  id: number;
  uuid: string;
  profileType: "PRIMARY" | "SECONDARY";
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  locale: string;
  verifiedEmail: boolean;
  legalConsent: LegalConsentState;
}

export const getMe = async (): Promise<UserProfileDto> => {
  return await get<UserProfileDto>("/private/profiles/me");
};
