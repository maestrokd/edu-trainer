import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invitationsApi } from "../api/invitationsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { InvitationDto } from "../models/dto";

export function InvitationsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("invitations");

  const [invitations, setInvitations] = useState<InvitationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await invitationsApi.getAll();
      setInvitations(data);
    } catch {
      setError("familyTask.errors.invitations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleInvite = async () => {
    if (!invitedEmail.trim()) {
      return;
    }

    setSending(true);

    try {
      await invitationsApi.create({ invitedEmail: invitedEmail.trim(), message: message || undefined });
      setInvitedEmail("");
      setMessage("");
      await load();
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (invitationUuid: string) => {
    await invitationsApi.resend(invitationUuid);
    await load();
  };

  const handleDelete = async (invitationUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    await invitationsApi.remove(invitationUuid);
    await load();
  };

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="invitations">
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">{t("familyTask.invitations.title", "Manage Family")}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              placeholder={t("familyTask.invitations.form.email", "Email Address")}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={invitedEmail}
              onChange={(event) => setInvitedEmail(event.target.value)}
            />
            <input
              placeholder={t("familyTask.invitations.message", "Message")}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button
              disabled={sending || !invitedEmail.trim()}
              onClick={() => void handleInvite()}
              className="sm:col-span-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {sending ? t("common.sending", "Sending...") : t("familyTask.invitations.invite", "Invite Member")}
            </button>
          </div>

          {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
              <span>{t(error, "Failed to load invitations.")}</span>
              <button className="underline" onClick={() => void load()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}
          {!loading && !error && invitations.length === 0 && (
            <p className="text-muted-foreground">{t("familyTask.invitations.empty", "No invitations sent yet.")}</p>
          )}

          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.uuid}
                className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-sm">{invitation.invitedEmail}</p>
                  <span className="text-xs text-muted-foreground">{invitation.status}</span>
                </div>

                <div className="flex gap-2">
                  {invitation.status === "PENDING" && (
                    <button
                      onClick={() => void handleResend(invitation.uuid)}
                      className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                    >
                      {t("common.resend", "Resend")}
                    </button>
                  )}
                  <button
                    onClick={() => void handleDelete(invitation.uuid)}
                    className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                  >
                    {t("common.delete", "Delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
