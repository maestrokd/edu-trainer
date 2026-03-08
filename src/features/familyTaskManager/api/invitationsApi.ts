import { del, get, post } from "@/services/ApiService";
import type { ApiItemsResponse, CreateInvitationRequest, InvitationDto } from "../models/dto";

const BASE = "/private/family/invitations";

export const invitationsApi = {
  async getAll(): Promise<InvitationDto[]> {
    const response = await get<ApiItemsResponse<InvitationDto>>(BASE);
    return response.items;
  },

  create(data: CreateInvitationRequest): Promise<InvitationDto> {
    return post(BASE, data);
  },

  resend(invitationUuid: string): Promise<InvitationDto> {
    return post(`${BASE}/${invitationUuid}/resend`);
  },

  remove(invitationUuid: string): Promise<void> {
    return del(`${BASE}/${invitationUuid}`);
  },
};
