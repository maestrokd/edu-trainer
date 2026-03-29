import { get, post } from "@/services/ApiService";
import type { BidDto, GoogleMailboxConnectResponseDto, MailboxDto } from "../types/contracts";

const MAILBOXES_BASE_PATH = "/api/mailboxes";

export const bidsApi = {
  connectGoogleMailbox(): Promise<GoogleMailboxConnectResponseDto> {
    return post<GoogleMailboxConnectResponseDto>(`${MAILBOXES_BASE_PATH}/google/connect`);
  },

  getMailboxes(): Promise<MailboxDto[]> {
    return get<MailboxDto[]>(MAILBOXES_BASE_PATH);
  },

  getParsedBids(mailboxId: string, forceSync: boolean = false): Promise<BidDto[]> {
    return get<BidDto[]>(`${MAILBOXES_BASE_PATH}/${mailboxId}/bids`, {
      params: {
        forceSync,
      },
    });
  },

  getParsedBidDetails(mailboxId: string, bidId: number, forceSync: boolean = false): Promise<BidDto> {
    return get<BidDto>(`${MAILBOXES_BASE_PATH}/${mailboxId}/bids/${bidId}`, {
      params: {
        forceSync,
      },
    });
  },
};
