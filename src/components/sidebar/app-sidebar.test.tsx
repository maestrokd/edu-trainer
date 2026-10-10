import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar.tsx";
import { AppSidebar } from "./app-sidebar.tsx";
import "@/i18n.ts";

interface PrincipalStub {
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string | null;
  authorities: string[];
  activeTenantName: string | null;
  activeTenantRole: string | null;
}

const mocks = vi.hoisted(() => ({
  principal: null as PrincipalStub | null,
}));

vi.mock("@/contexts/AuthContext.tsx", () => ({
  Authority: { FAMILY_TASK_MANAGER: "FAMILY_TASK_MANAGER" },
  useAuth: () => ({ principal: mocks.principal }),
}));

vi.mock("@/contexts/SidebarContext", () => ({
  useSidebarContext: () => ({ sidebarContent: null }),
}));

vi.mock("@/components/sidebar/nav-user.tsx", () => ({
  NavUser: () => <div>Authenticated user</div>,
}));

function renderSidebar(defaultOpen = true) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar collapsible="icon" />
      </SidebarProvider>
    </MemoryRouter>
  );
}

describe("AppSidebar legal navigation", () => {
  beforeEach(() => {
    mocks.principal = null;
  });

  it("opens localized current legal links in new tabs for unauthenticated users", () => {
    renderSidebar();

    const termsLink = screen.getByRole("link", { name: "Terms of Service" });
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(privacyLink).toHaveAttribute("target", "_blank");
    expect(termsLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(privacyLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Support" })).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "Feedback" })).not.toHaveAttribute("target");
  });

  it("keeps both legal links visible for authenticated users", () => {
    mocks.principal = {
      firstName: "Taylor",
      lastName: "Trainer",
      username: "taylor@example.com",
      email: "taylor@example.com",
      authorities: [],
      activeTenantName: "Family",
      activeTenantRole: "OWNER",
    };

    renderSidebar();

    expect(screen.getByRole("link", { name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByText("Authenticated user")).toBeInTheDocument();
  });

  it("exposes legal labels as tooltips when the sidebar is collapsed", async () => {
    renderSidebar(false);

    fireEvent.pointerMove(screen.getByRole("link", { name: "Terms of Service" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Terms of Service");
  });
});
