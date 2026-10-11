import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationLegalConsentFields } from "@/components/legal/RegistrationLegalConsentFields.tsx";
import { useRegistrationLegalConsent } from "./use-registration-legal-consent.ts";
import { MemoryRouter } from "react-router-dom";
import "@/i18n.ts";

const mocks = vi.hoisted(() => ({
  requirements: vi.fn(),
  hasDocument: vi.fn(),
}));

vi.mock("@/services/LegalService.ts", () => ({
  LegalDocumentType: { TERMS: "TERMS", PRIVACY: "PRIVACY" },
  getLegalRequirements: mocks.requirements,
}));

vi.mock("@/legal/legal-document-registry.ts", () => ({
  hasLegalDocument: mocks.hasDocument,
}));

function Harness({ enabled = true }: { enabled?: boolean }) {
  const state = useRegistrationLegalConsent(enabled);
  return (
    <>
      {enabled && <RegistrationLegalConsentFields state={state} />}
      <output data-testid="ready">{String(state.ready)}</output>
      <output data-testid="documents">{JSON.stringify(state.documents)}</output>
    </>
  );
}

describe("registration legal consent", () => {
  beforeEach(() => {
    mocks.requirements.mockReset().mockResolvedValue({
      documents: [
        { type: "TERMS", version: "1.1" },
        { type: "PRIVACY", version: "1.1" },
      ],
    });
    mocks.hasDocument.mockReset().mockReturnValue(true);
  });

  it("requires all three confirmations and retains exact backend versions", async () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    );

    await screen.findByText("Required confirmations");
    expect(screen.getByTestId("ready")).toHaveTextContent("false");
    fireEvent.click(screen.getByLabelText("I confirm that I am 18 years of age or older."));
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    fireEvent.click(screen.getByLabelText(/I acknowledge the/));

    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
    expect(screen.getByTestId("documents")).toHaveTextContent(
      '[{"type":"TERMS","version":"1.1"},{"type":"PRIVACY","version":"1.1"}]'
    );
  });

  it("does not fetch or require legal consent for password reset mode", () => {
    render(
      <MemoryRouter>
        <Harness enabled={false} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("ready")).toHaveTextContent("true");
    expect(mocks.requirements).not.toHaveBeenCalled();
    expect(screen.queryByText("Required confirmations")).not.toBeInTheDocument();
  });
});
