export const BID_MANAGER_ROUTES = {
  root: "/mailboxes/bids",
  byMailbox: (mailboxId: string) => `/mailboxes/${mailboxId}/bids`,
  details: (mailboxId: string, bidId: number | string) => `/mailboxes/${mailboxId}/bids/${bidId}`,
} as const;
