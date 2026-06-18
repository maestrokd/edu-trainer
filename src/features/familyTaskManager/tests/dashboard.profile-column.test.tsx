import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardProfileColumn } from "../components/dashboard/DashboardProfileColumn";
import type { ChildProfileDto, TaskOccurrenceDto } from "../models/dto";
import { FamilyRoutineSlot, FamilyTaskOccurrenceStatus, FamilyTaskSourceType } from "../models/enums";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

function buildProfile(): ChildProfileDto {
  return {
    profileUuid: "profile-1",
    memberUuid: "member-1",
    username: "kid",
    firstName: "Kid",
    lastName: "One",
    locale: "en",
    displayName: "Kid One",
    avatarEmoji: "🧒",
    color: "#60a5fa",
    active: true,
  };
}

function buildTask(task: Partial<TaskOccurrenceDto>): TaskOccurrenceDto {
  return {
    uuid: task.uuid ?? "task-1",
    sourceType: task.sourceType ?? FamilyTaskSourceType.ROUTINE,
    sourceUuid: task.sourceUuid ?? "routine-morning",
    assigneeProfileUuid: task.assigneeProfileUuid ?? "profile-1",
    title: task.title ?? "Task",
    emoji: task.emoji ?? null,
    description: task.description ?? null,
    scheduledFor: task.scheduledFor ?? "2026-03-14",
    dueAt: task.dueAt ?? null,
    status: task.status ?? FamilyTaskOccurrenceStatus.OPEN,
    requiresApproval: task.requiresApproval ?? false,
    starsReward: task.starsReward ?? 1,
    starsAwarded: task.starsAwarded ?? 0,
  };
}

describe("DashboardProfileColumn filters", () => {
  it("toggles section visibility when slot filter is switched off", () => {
    const tasks = [
      buildTask({
        uuid: "morning-1",
        title: "Morning task",
        sourceType: FamilyTaskSourceType.ROUTINE,
        sourceUuid: "routine-morning",
      }),
      buildTask({
        uuid: "chore-1",
        title: "Chore task",
        sourceType: FamilyTaskSourceType.CHORE,
        sourceUuid: "chore-1",
      }),
    ];

    render(
      <DashboardProfileColumn
        profile={buildProfile()}
        profileColor="#60a5fa"
        profileTasks={tasks}
        routineSlotByUuid={{ "routine-morning": FamilyRoutineSlot.MORNING }}
        submittingByTaskUuid={{}}
        onComplete={vi.fn()}
        showCompleted={true}
      />
    );

    const morningFilter = screen.getByRole("button", { name: /morning/i });
    expect(morningFilter).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: /morning/i })).toBeInTheDocument();

    fireEvent.click(morningFilter);

    expect(morningFilter).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("heading", { name: /morning/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /chores/i })).toBeInTheDocument();
  });

  it("disables filters for sections without tasks", () => {
    const tasks = [
      buildTask({
        uuid: "morning-1",
        title: "Morning task",
        sourceType: FamilyTaskSourceType.ROUTINE,
        sourceUuid: "routine-morning",
      }),
    ];

    render(
      <DashboardProfileColumn
        profile={buildProfile()}
        profileColor="#60a5fa"
        profileTasks={tasks}
        routineSlotByUuid={{ "routine-morning": FamilyRoutineSlot.MORNING }}
        submittingByTaskUuid={{}}
        onComplete={vi.fn()}
        showCompleted={true}
      />
    );

    expect(screen.getByRole("button", { name: /morning/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /afternoon/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /anytime/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /evening/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /chores/i })).toBeDisabled();
  });

  it("renders section blocks in chronological order", () => {
    const tasks = [
      buildTask({
        uuid: "evening-1",
        title: "Evening task",
        sourceType: FamilyTaskSourceType.ROUTINE,
        sourceUuid: "routine-evening",
      }),
      buildTask({
        uuid: "anytime-1",
        title: "Anytime task",
        sourceType: FamilyTaskSourceType.ROUTINE,
        sourceUuid: "routine-anytime",
      }),
      buildTask({
        uuid: "morning-1",
        title: "Morning task",
        sourceType: FamilyTaskSourceType.ROUTINE,
        sourceUuid: "routine-morning",
      }),
      buildTask({
        uuid: "chore-1",
        title: "Chore task",
        sourceType: FamilyTaskSourceType.CHORE,
        sourceUuid: "chore-1",
      }),
      buildTask({
        uuid: "afternoon-1",
        title: "Afternoon task",
        sourceType: FamilyTaskSourceType.ROUTINE,
        sourceUuid: "routine-afternoon",
      }),
    ];

    render(
      <DashboardProfileColumn
        profile={buildProfile()}
        profileColor="#60a5fa"
        profileTasks={tasks}
        routineSlotByUuid={{
          "routine-morning": FamilyRoutineSlot.MORNING,
          "routine-afternoon": FamilyRoutineSlot.AFTERNOON,
          "routine-evening": FamilyRoutineSlot.EVENING,
          "routine-anytime": FamilyRoutineSlot.ANYTIME,
        }}
        submittingByTaskUuid={{}}
        onComplete={vi.fn()}
        showCompleted={true}
      />
    );

    const sectionTitles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent?.trim());
    expect(sectionTitles).toEqual(["morning", "afternoon", "evening", "anytime", "chores"]);
  });

  it("filters out completed and submitted tasks when showCompleted is false", () => {
    const tasks = [
      buildTask({
        uuid: "open-task",
        title: "Open task",
        status: FamilyTaskOccurrenceStatus.OPEN,
      }),
      buildTask({
        uuid: "completed-task",
        title: "Completed task",
        status: FamilyTaskOccurrenceStatus.COMPLETED,
      }),
      buildTask({
        uuid: "submitted-task",
        title: "Submitted task",
        status: FamilyTaskOccurrenceStatus.SUBMITTED,
      }),
    ];

    const { rerender } = render(
      <DashboardProfileColumn
        profile={buildProfile()}
        profileColor="#60a5fa"
        profileTasks={tasks}
        routineSlotByUuid={{}}
        submittingByTaskUuid={{}}
        onComplete={vi.fn()}
        showCompleted={false}
      />
    );

    // Completed and submitted tasks should be hidden
    expect(screen.getByText("Open task")).toBeInTheDocument();
    expect(screen.queryByText("Completed task")).not.toBeInTheDocument();
    expect(screen.queryByText("Submitted task")).not.toBeInTheDocument();

    // Rerender with showCompleted={true}
    rerender(
      <DashboardProfileColumn
        profile={buildProfile()}
        profileColor="#60a5fa"
        profileTasks={tasks}
        routineSlotByUuid={{}}
        submittingByTaskUuid={{}}
        onComplete={vi.fn()}
        showCompleted={true}
      />
    );

    // All tasks should be visible
    expect(screen.getByText("Open task")).toBeInTheDocument();
    expect(screen.getByText("Completed task")).toBeInTheDocument();
    expect(screen.getByText("Submitted task")).toBeInTheDocument();
  });
});
