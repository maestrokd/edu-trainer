import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyTaskDashboardPage } from "../pages/FamilyTaskDashboardPage";
import { useTaskCoachAudio } from "../components/taskCoach/useTaskCoachAudio";
import type { ChildProfileDto, TaskOccurrenceDto } from "../models/dto";

const mocks = vi.hoisted(() => ({
  dashboardController: vi.fn(),
  useInsetHeader: vi.fn(),
  featureFlag: vi.fn(),
  coachMounted: vi.fn(),
}));

vi.mock("@/hooks/useFeatureFlag", () => ({ useFeatureFlag: mocks.featureFlag }));

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
  DashboardProfileColumn: ({
    profile,
    recommendedTaskUuid,
    onComplete,
  }: {
    profile: ChildProfileDto;
    recommendedTaskUuid: string | null;
    onComplete: (task: TaskOccurrenceDto) => void;
  }) => (
    <div>
      {profile.displayName}
      <span data-testid="recommendation">{recommendedTaskUuid}</span>
      <button onClick={() => onComplete({ uuid: "task-1" } as TaskOccurrenceDto)}>Complete task</button>
    </div>
  ),
}));
vi.mock("../components/gates/CapabilitySuggestions", () => ({ CapabilitySuggestions: () => null }));
vi.mock("../components/layout/FamilyTaskPageShell", () => ({
  FamilyTaskPageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("../components/taskCoach/TaskCoachWidget", () => ({
  TaskCoachWidget: ({
    onVisibilityChange,
    onRecommendation,
    successEvent,
  }: {
    onVisibilityChange: (visible: boolean) => void;
    onRecommendation: (uuid: string | null) => void;
    successEvent: unknown;
  }) => {
    mocks.coachMounted();
    useTaskCoachAudio({
      audioUrl: "blob:coach-audio",
      autoPlay: true,
      visible: true,
      onSpeakingChange: () => {},
      onError: () => {},
    });
    return (
      <div>
        <button onClick={() => onVisibilityChange(false)}>Minimize coach fixture</button>
        <button onClick={() => onVisibilityChange(true)}>Restore coach fixture</button>
        <button onClick={() => onRecommendation("task-1")}>Recommend task</button>
        <span data-testid="success-event">{JSON.stringify(successEvent)}</span>
      </div>
    );
  },
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
    mocks.featureFlag.mockReturnValue(true);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("releases the character padding while minimized and restores it with the coach", async () => {
    render(<FamilyTaskDashboardPage />);

    const profileStrip = document.querySelector('[data-slot="family-task-profile-strip"]');
    expect(profileStrip).toHaveClass("pr-32", "sm:pr-40");
    expect(profileStrip).not.toHaveClass("pr-14");

    fireEvent.click(await screen.findByRole("button", { name: "Minimize coach fixture" }));
    expect(profileStrip).toHaveClass("pr-14");
    expect(profileStrip).not.toHaveClass("pr-32", "sm:pr-40");

    fireEvent.click(screen.getByRole("button", { name: "Restore coach fixture" }));
    expect(profileStrip).toHaveClass("pr-32", "sm:pr-40");
  });

  it("does not mount the disabled assistant and still completes tasks", async () => {
    mocks.featureFlag.mockReturnValue(false);
    const { rerender } = render(<FamilyTaskDashboardPage />);
    const profileStrip = document.querySelector('[data-slot="family-task-profile-strip"]');
    expect(profileStrip).not.toHaveClass("pr-32", "sm:pr-40", "pr-14");
    expect(mocks.coachMounted).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    mocks.dashboardController().handleComplete.mockResolvedValue({
      assigneeProfileUuid: "child-1",
      starsAwarded: 2,
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete task" }));
    await waitFor(() => expect(mocks.dashboardController().handleComplete).toHaveBeenCalledOnce());
    mocks.featureFlag.mockReturnValue(true);
    rerender(<FamilyTaskDashboardPage />);
    expect(await screen.findByTestId("success-event")).toHaveTextContent("null");
  });

  it("stops playback and clears recommendations and spacing when disabled", async () => {
    const { rerender } = render(<FamilyTaskDashboardPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Recommend task" }));
    expect(screen.getByTestId("recommendation")).toHaveTextContent("task-1");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    mocks.featureFlag.mockReturnValue(false);
    rerender(<FamilyTaskDashboardPage />);
    expect(screen.queryByRole("button", { name: "Recommend task" })).not.toBeInTheDocument();
    expect(screen.getByTestId("recommendation")).toBeEmptyDOMElement();
    expect(document.querySelector('[data-slot="family-task-profile-strip"]')).not.toHaveClass(
      "pr-32",
      "sm:pr-40",
      "pr-14"
    );
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();

    mocks.featureFlag.mockReturnValue(true);
    rerender(<FamilyTaskDashboardPage />);
    await screen.findByRole("button", { name: "Recommend task" });
    expect(screen.getByTestId("recommendation")).toBeEmptyDOMElement();
  });
});
