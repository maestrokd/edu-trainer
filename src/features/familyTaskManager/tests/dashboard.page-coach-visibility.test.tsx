import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyTaskDashboardPage } from "../pages/FamilyTaskDashboardPage";
import type { ChildProfileDto } from "../models/dto";

const mocks = vi.hoisted(() => ({
  dashboardController: vi.fn(),
  useInsetHeader: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: "en-US" },
  }),
}));
vi.mock("@/contexts/InsetHeaderContext", () => ({ useInsetHeader: mocks.useInsetHeader }));
vi.mock("../hooks/useFamilyTaskDashboardController", () => ({
  useFamilyTaskDashboardController: mocks.dashboardController,
}));
vi.mock("../hooks/useTrackFamilyTaskPageView", () => ({ useTrackFamilyTaskPageView: vi.fn() }));
vi.mock("../components/dashboard/DashboardHeader", () => ({
  DashboardAppHeader: () => <div>App header</div>,
  DashboardHeader: () => <div>Dashboard header</div>,
}));
vi.mock("../components/dashboard/DashboardProfileColumn", () => ({
  DashboardProfileColumn: ({ profile }: { profile: ChildProfileDto }) => <div>{profile.displayName}</div>,
}));
vi.mock("../components/gates/CapabilitySuggestions", () => ({ CapabilitySuggestions: () => null }));
vi.mock("../components/layout/FamilyTaskPageShell", () => ({
  FamilyTaskPageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("../components/taskCoach/TaskCoachWidget", () => ({
  TaskCoachWidget: ({ onVisibilityChange }: { onVisibilityChange: (visible: boolean) => void }) => (
    <div>
      <button onClick={() => onVisibilityChange(false)}>Minimize coach fixture</button>
      <button onClick={() => onVisibilityChange(true)}>Restore coach fixture</button>
    </div>
  ),
}));

const child: ChildProfileDto = {
  profileUuid: "child-1",
  memberUuid: "member-1",
  username: "kid",
  firstName: "Kid",
  lastName: null,
  locale: "en-US",
  displayName: "Kid",
  avatarEmoji: "🧒",
  color: null,
  active: true,
};

describe("FamilyTaskDashboardPage coach spacing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dashboardController.mockReturnValue({
      family: { name: "Family" },
      familyError: null,
      selectedDate: new Date("2026-08-26T12:00:00"),
      isToday: true,
      activeProfiles: [child],
      visibleProfiles: [child],
      profileFilter: [],
      setProfileFilter: vi.fn(),
      isSecondaryWithoutManageProfiles: false,
      ownProfileUuid: null,
      tasksByProfile: {},
      submittingByTaskUuid: {},
      loading: false,
      error: null,
      refetch: vi.fn(),
      handleComplete: vi.fn(),
      shiftDate: vi.fn(),
      resetToToday: vi.fn(),
    });
  });

  it("releases the character padding while minimized and restores it with the coach", () => {
    render(<FamilyTaskDashboardPage />);

    const profileStrip = document.querySelector('[data-slot="family-task-profile-strip"]');
    expect(profileStrip).toHaveClass("pr-32", "sm:pr-40");
    expect(profileStrip).not.toHaveClass("pr-14");

    fireEvent.click(screen.getByRole("button", { name: "Minimize coach fixture" }));
    expect(profileStrip).toHaveClass("pr-14");
    expect(profileStrip).not.toHaveClass("pr-32", "sm:pr-40");

    fireEvent.click(screen.getByRole("button", { name: "Restore coach fixture" }));
    expect(profileStrip).toHaveClass("pr-32", "sm:pr-40");
  });
});
