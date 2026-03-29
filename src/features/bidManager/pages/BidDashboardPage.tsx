import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailPlus, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bidsApi } from "../api/bidsApi";
import { BidListTable } from "../components/BidListTable";
import { BidManagerShell } from "../components/BidManagerShell";
import { BID_MANAGER_ROUTES } from "../constants/routes";
import type { BidDto, MailboxDto } from "../types/contracts";
import { extractApiErrorMessage } from "../utils/errors";
import { wait } from "../utils/presentation";

const SYNC_POLL_INTERVAL_MS = 3000;
const SYNC_MAX_ATTEMPTS = 5;

export function BidDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mailboxId } = useParams<{ mailboxId: string }>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [awaitingOAuthReturn, setAwaitingOAuthReturn] = useState(false);

  const {
    data: mailboxes = [],
    isLoading: isMailboxesLoading,
    error: mailboxesError,
    isSuccess: isMailboxesLoaded,
  } = useQuery<MailboxDto[]>({
    queryKey: ["bidManager", "mailboxes"],
    queryFn: bidsApi.getMailboxes,
  });

  const selectedMailboxId = useMemo(() => {
    if (!mailboxId) {
      return null;
    }
    return mailboxes.some((mailbox) => mailbox.id === mailboxId) ? mailboxId : null;
  }, [mailboxId, mailboxes]);

  useEffect(() => {
    if (!isMailboxesLoaded || mailboxes.length === 0) {
      return;
    }

    if (!mailboxId || !mailboxes.some((mailbox) => mailbox.id === mailboxId)) {
      navigate(BID_MANAGER_ROUTES.byMailbox(mailboxes[0].id), { replace: true });
    }
  }, [isMailboxesLoaded, mailboxes, mailboxId, navigate]);

  useEffect(() => {
    setActionError(null);
  }, [selectedMailboxId]);

  useEffect(() => {
    if (!awaitingOAuthReturn) {
      return;
    }

    const refreshConnectedMailboxes = () => {
      void queryClient.invalidateQueries({ queryKey: ["bidManager", "mailboxes"] });
      setAwaitingOAuthReturn(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshConnectedMailboxes();
      }
    };

    window.addEventListener("focus", refreshConnectedMailboxes);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshConnectedMailboxes);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [awaitingOAuthReturn, queryClient]);

  const {
    data: bids = [],
    isLoading: isBidsLoading,
    isFetching: isBidsFetching,
    error: bidsError,
    refetch: refetchBids,
  } = useQuery<BidDto[]>({
    queryKey: ["bidManager", "bids", selectedMailboxId],
    queryFn: () => bidsApi.getParsedBids(selectedMailboxId!, false),
    enabled: Boolean(selectedMailboxId),
  });

  const forceSyncMutation = useMutation({
    mutationFn: async (targetMailboxId: string): Promise<BidDto[]> => {
      let latestBids = await bidsApi.getParsedBids(targetMailboxId, true);

      for (let attempt = 0; attempt < SYNC_MAX_ATTEMPTS; attempt += 1) {
        await wait(SYNC_POLL_INTERVAL_MS);
        latestBids = await bidsApi.getParsedBids(targetMailboxId, false);

        if (latestBids.length > 0) {
          break;
        }
      }

      return latestBids;
    },
    onSuccess: (latestBids, targetMailboxId) => {
      setActionError(null);
      queryClient.setQueryData(["bidManager", "bids", targetMailboxId], latestBids);
    },
    onError: (error) => {
      setActionError(extractApiErrorMessage(error, "Failed to synchronize parsed bids."));
    },
  });

  const connectGmailMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await bidsApi.connectGoogleMailbox();
      if (!response.authorizationUrl || response.authorizationUrl.trim().length === 0) {
        throw new Error("Google authorization URL is missing in backend response.");
      }
      return response.authorizationUrl;
    },
    onSuccess: (authorizationUrl) => {
      setActionError(null);
      setAwaitingOAuthReturn(true);

      const popupWindow = window.open(authorizationUrl, "_blank", "noopener,noreferrer");
      if (!popupWindow) {
        window.location.assign(authorizationUrl);
      }
    },
    onError: (error) => {
      setActionError(extractApiErrorMessage(error, "Failed to start Google Gmail connection."));
      setAwaitingOAuthReturn(false);
    },
  });

  const handleMailboxChange = (nextMailboxId: string) => {
    navigate(BID_MANAGER_ROUTES.byMailbox(nextMailboxId));
  };

  const handleForceSync = async () => {
    if (!selectedMailboxId) {
      return;
    }

    setActionError(null);
    await forceSyncMutation.mutateAsync(selectedMailboxId);
  };

  const handleConnectGmail = async () => {
    setActionError(null);
    await connectGmailMutation.mutateAsync();
  };

  const mailboxesErrorMessage = mailboxesError
    ? extractApiErrorMessage(mailboxesError, "Failed to load connected mailboxes.")
    : null;
  const bidsErrorMessage = bidsError ? extractApiErrorMessage(bidsError, "Failed to load parsed bids.") : null;
  const hasNoMailboxes = !isMailboxesLoading && mailboxes.length === 0;
  const hasNoBids = !isBidsLoading && bids.length === 0 && !bidsError;

  return (
    <BidManagerShell title="Bid Dashboard" subtitle="Review parsed construction bids from connected mailboxes.">
      {mailboxesErrorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{mailboxesErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {bidsErrorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{bidsErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Parsed Bids</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-md space-y-2">
              <Label htmlFor="mailbox-selector">Connected Mailbox</Label>
              <Select
                value={selectedMailboxId ?? undefined}
                onValueChange={handleMailboxChange}
                disabled={isMailboxesLoading || hasNoMailboxes}
              >
                <SelectTrigger id="mailbox-selector">
                  <SelectValue placeholder="Select mailbox" />
                </SelectTrigger>
                <SelectContent>
                  {mailboxes.map((mailbox) => (
                    <SelectItem key={mailbox.id} value={mailbox.id}>
                      {mailbox.email} ({mailbox.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-start gap-2">
              <Button onClick={() => void handleConnectGmail()} disabled={connectGmailMutation.isPending}>
                {connectGmailMutation.isPending ? <Loader2 className="animate-spin" /> : <MailPlus />}
                Connect Gmail
              </Button>
              <Button
                onClick={() => void handleForceSync()}
                disabled={!selectedMailboxId || forceSyncMutation.isPending || isMailboxesLoading}
              >
                {forceSyncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Force Sync
              </Button>
              {forceSyncMutation.isPending ? (
                <p className="text-xs text-muted-foreground">Sync in progress...</p>
              ) : null}
              {awaitingOAuthReturn ? (
                <p className="text-xs text-muted-foreground">
                  Complete Google sign-in and return to this tab to refresh connected mailboxes.
                </p>
              ) : null}
            </div>
          </div>

          {isMailboxesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading connected mailboxes...
            </div>
          ) : null}

          {hasNoMailboxes ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              <p>No connected mailboxes yet.</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => void handleConnectGmail()}
                disabled={connectGmailMutation.isPending}
              >
                {connectGmailMutation.isPending ? <Loader2 className="animate-spin" /> : <MailPlus />}
                Connect Gmail
              </Button>
            </div>
          ) : null}

          {!hasNoMailboxes && isBidsLoading && bids.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading parsed bids...
            </div>
          ) : null}

          {!hasNoMailboxes && hasNoBids ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No parsed bids yet.</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => void handleForceSync()}
                disabled={!selectedMailboxId || forceSyncMutation.isPending}
              >
                {forceSyncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Force Sync
              </Button>
            </div>
          ) : null}

          {!hasNoMailboxes && !hasNoBids ? <BidListTable bids={bids} mailboxId={selectedMailboxId!} /> : null}

          {isBidsFetching && !isBidsLoading ? (
            <p className="text-xs text-muted-foreground">Refreshing bids...</p>
          ) : null}

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionError(null);
                void refetchBids();
              }}
              disabled={!selectedMailboxId || isBidsLoading}
            >
              Refresh list
            </Button>
          </div>
        </CardContent>
      </Card>
    </BidManagerShell>
  );
}
