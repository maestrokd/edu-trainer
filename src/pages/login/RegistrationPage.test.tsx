import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegistrationPage from "./RegistrationPage.tsx";
import "@/i18n.ts";

const mocks = vi.hoisted(() => ({
  sendCode: vi.fn(),
  register: vi.fn(),
  requirements: vi.fn(),
  hasDocument: vi.fn(),
}));

vi.mock("@/contexts/AuthContext.tsx", () => ({
  EmailVerificationType: {
    EMAIL_VERIFICATION_CODE_WEB: "EMAIL_VERIFICATION_CODE_WEB",
    PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB: "PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB",
  },
  useAuth: () => ({
    sendConfirmationCode: mocks.sendCode,
    doRegister: mocks.register,
    doResetPassword: vi.fn(),
  }),
}));

vi.mock("@/services/LegalService.ts", () => ({
  LegalDocumentType: { TERMS: "TERMS", PRIVACY: "PRIVACY" },
  getLegalRequirements: mocks.requirements,
}));

vi.mock("@/legal/legal-document-registry.ts", () => ({
  hasLegalDocument: mocks.hasDocument,
}));

describe("RegistrationPage legal consent", () => {
  beforeEach(() => {
    mocks.sendCode.mockReset().mockResolvedValue(undefined);
    mocks.register.mockReset().mockResolvedValue(undefined);
    mocks.hasDocument.mockReset().mockReturnValue(true);
    mocks.requirements.mockReset().mockResolvedValue({
      documents: [
        { type: "TERMS", version: "1.1" },
        { type: "PRIVACY", version: "1.1" },
      ],
    });
  });

  it("submits the exact fetched versions after every required confirmation", async () => {
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    await screen.findByText("Required confirmations");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send confirmation code" }));
    await waitFor(() => expect(mocks.sendCode).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Confirmation Code"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "StrongPassword1!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "StrongPassword1!" } });
    fireEvent.click(screen.getByLabelText("I confirm that I am 18 years of age or older."));
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    fireEvent.click(screen.getByLabelText(/I acknowledge the/));
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(mocks.register).toHaveBeenCalledWith(
        "user@example.com",
        "StrongPassword1!",
        "StrongPassword1!",
        "123456",
        {
          age18Confirmed: true,
          documents: [
            { type: "TERMS", version: "1.1" },
            { type: "PRIVACY", version: "1.1" },
          ],
        }
      )
    );
  });
});
