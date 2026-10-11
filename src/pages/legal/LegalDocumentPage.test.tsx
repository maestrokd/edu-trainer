import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalDocumentPage } from "./LegalDocumentPage.tsx";
import { LegalDocumentType } from "@/services/LegalService.ts";
import "@/i18n.ts";

const legalMocks = vi.hoisted(() => ({
  getRequirements: vi.fn(),
  resolve: vi.fn(),
}));

vi.mock("@/services/LegalService.ts", () => ({
  LegalDocumentType: { TERMS: "TERMS", PRIVACY: "PRIVACY" },
  getLegalRequirements: legalMocks.getRequirements,
}));

vi.mock("@/legal/legal-document-registry.ts", () => ({
  resolveLegalDocument: legalMocks.resolve,
}));

describe("LegalDocumentPage", () => {
  beforeEach(() => {
    legalMocks.getRequirements.mockReset();
    legalMocks.resolve.mockReset();
  });

  it("renders the backend-declared current version", async () => {
    legalMocks.getRequirements.mockResolvedValue({
      documents: [
        {
          type: "TERMS",
          version: "1.1",
          publishedDate: "2026-10-01",
          effectiveDate: "2026-10-01",
          acceptanceRequired: true,
        },
      ],
    });
    legalMocks.resolve.mockReturnValue("# Approved Terms\n\nCurrent content.");

    render(
      <MemoryRouter initialEntries={["/terms"]}>
        <Routes>
          <Route path="/terms/:version?" element={<LegalDocumentPage type={LegalDocumentType.TERMS} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Approved Terms" })).toBeInTheDocument();
    expect(legalMocks.resolve).toHaveBeenCalledWith("TERMS", "1.1");
    expect(screen.getByText(/Version 1.1/)).toBeInTheDocument();
  });

  it("renders an explicit version without resolving current requirements", async () => {
    legalMocks.resolve.mockReturnValue("# Historical Privacy");

    render(
      <MemoryRouter initialEntries={["/privacy/1.1"]}>
        <Routes>
          <Route path="/privacy/:version?" element={<LegalDocumentPage type={LegalDocumentType.PRIVACY} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Historical Privacy" })).toBeInTheDocument();
    expect(legalMocks.getRequirements).not.toHaveBeenCalled();
    expect(legalMocks.resolve).toHaveBeenCalledWith("PRIVACY", "1.1");
  });

  it("shows a clean not-found state for an unknown explicit version", async () => {
    legalMocks.resolve.mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/terms/9.9"]}>
        <Routes>
          <Route path="/terms/:version?" element={<LegalDocumentPage type={LegalDocumentType.TERMS} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("That legal document version was not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View current version" })).toHaveAttribute("href", "/terms");
  });
});
