import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalConsentGate } from "./LegalConsentGate.tsx";
import "@/i18n.ts";

const mocks = vi.hoisted(() => ({
  accept: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  contentAvailable: vi.fn(),
  legalConsentDocuments: [
    {
      type: "TERMS",
      currentVersion: "1.1",
      acceptedVersion: "1.0",
      acceptanceRequired: true,
      actionRequired: true,
    },
    {
      type: "PRIVACY",
      currentVersion: "1.1",
      acceptedVersion: "1.1",
      acceptanceRequired: true,
      actionRequired: false,
    },
  ],
}));

vi.mock("@/services/LegalService.ts", () => ({
  LegalDocumentType: { TERMS: "TERMS", PRIVACY: "PRIVACY" },
  acceptLegalConsents: mocks.accept,
}));

vi.mock("@/legal/legal-document-registry.ts", () => ({
  hasLegalDocument: mocks.contentAvailable,
}));

vi.mock("@/contexts/AuthContext.tsx", async () => {
  const React = await import("react");
  const requiredPrincipal = {
    profileType: "PRIMARY",
    legalConsent: {
      required: true,
      documents: mocks.legalConsentDocuments,
    },
  };
  return {
    useAuth: () => {
      const [principal, setPrincipal] = React.useState(requiredPrincipal);
      const refreshPrincipal = async () => {
        const updated = { ...requiredPrincipal, legalConsent: { required: false, documents: [] } };
        mocks.refresh();
        setPrincipal(updated);
        return updated;
      };
      return {
        principal,
        isAuthenticated: true,
        logout: mocks.logout,
        refreshPrincipal,
      };
    },
  };
});

describe("LegalConsentGate", () => {
  beforeEach(() => {
    mocks.accept.mockReset().mockResolvedValue({ required: false, documents: [] });
    mocks.refresh.mockReset();
    mocks.logout.mockReset();
    mocks.contentAvailable.mockReset().mockReturnValue(true);
    mocks.legalConsentDocuments[1].actionRequired = false;
  });

  it("submits only required documents and reveals the preserved route", async () => {
    render(
      <MemoryRouter initialEntries={["/family-tasks"]}>
        <LegalConsentGate>
          <div>Normal application</div>
        </LegalConsentGate>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "View Terms of Service" })).toBeInTheDocument();
    expect(screen.queryByText(/View Privacy Policy/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("I agree to the updated Terms of Service."));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(mocks.accept).toHaveBeenCalledWith([{ type: "TERMS", version: "1.1" }]));
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(await screen.findByText("Normal application")).toBeInTheDocument();
  });

  it("allows an exact legal route while consent is required", () => {
    render(
      <MemoryRouter initialEntries={["/terms/1.1"]}>
        <LegalConsentGate>
          <div>Legal route content</div>
        </LegalConsentGate>
      </MemoryRouter>
    );

    expect(screen.getByText("Legal route content")).toBeInTheDocument();
  });

  it("opens exact required documents in new tabs without clearing confirmations", () => {
    mocks.legalConsentDocuments[1].actionRequired = true;

    render(
      <MemoryRouter initialEntries={["/family-tasks"]}>
        <LegalConsentGate>
          <div>Normal application</div>
        </LegalConsentGate>
      </MemoryRouter>
    );

    const termsConfirmation = screen.getByLabelText("I agree to the updated Terms of Service.");
    const privacyConfirmation = screen.getByLabelText("I acknowledge the updated Privacy Policy.");
    fireEvent.click(termsConfirmation);
    fireEvent.click(privacyConfirmation);

    const termsLink = screen.getByRole("link", { name: "View Terms of Service" });
    const privacyLink = screen.getByRole("link", { name: "View Privacy Policy" });
    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(privacyLink).toHaveAttribute("target", "_blank");
    expect(termsLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(privacyLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(termsConfirmation).toBeChecked();
    expect(privacyConfirmation).toBeChecked();
  });
});
