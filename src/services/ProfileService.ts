import { get } from "./ApiService";

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
}

export const getMe = async (): Promise<UserProfileDto> => {
  return await get<UserProfileDto>("/private/profiles/me");
};
