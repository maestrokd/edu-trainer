import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import InvitationRegistrationPage from "./InvitationRegistrationPage.tsx";
import "@/i18n.ts";

const mocks = vi.hoisted(() => ({
  doRegister: vi.fn(),
  resolveInvitation: vi.fn(),
}));

vi.mock("@/contexts/AuthContext.tsx", () => ({
  EmailVerificationType: {
    EMAIL_VERIFICATION_CODE_WEB: "EMAIL_VERIFICATION_CODE_WEB",
  },
  useAuth: () => ({
    doRegister: mocks.doRegister,
    sendConfirmationCode: vi.fn(),
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/services/TenantInvitationService.ts", () => ({
  TenantInvitationStatus: {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    EXPIRED: "EXPIRED",
  },
  default: {
    resolveTenantInvitation: mocks.resolveInvitation,
  },
}));

vi.mock("@/hooks/use-registration-legal-consent.ts", () => ({
  useRegistrationLegalConsent: () => ({
    ready: false,
    age18Confirmed: false,
    documents: [],
  }),
}));

vi.mock("@/components/legal/RegistrationLegalConsentFields.tsx", () => ({
  RegistrationLegalConsentFields: () => <div>Legal consent unavailable</div>,
}));

describe("InvitationRegistrationPage legal consent", () => {
  it("blocks a programmatic form submission while legal consent is not ready", async () => {
    mocks.doRegister.mockReset();
    mocks.resolveInvitation.mockResolvedValue({
      invitationUuid: "invitation-id",
      tenantUuid: "tenant-id",
      tenantName: "Family",
      email: "invitee@example.com",
      role: "MEMBER",
      status: "PENDING",
      expiresAt: "2026-10-10T12:00:00Z",
      existingUser: false,
    });

    render(
      <MemoryRouter initialEntries={["/auth/invitations/token/register"]}>
        <Routes>
          <Route path="/auth/invitations/:token/register" element={<InvitationRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("invitee@example.com")).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: "Create account and join" });
    expect(submitButton).toBeDisabled();

    const form = submitButton.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => expect(mocks.doRegister).not.toHaveBeenCalled());
  });
});
