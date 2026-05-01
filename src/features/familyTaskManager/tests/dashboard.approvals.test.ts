import { describe, expect, it } from "vitest";
import { groupApprovalsByProfileDateAndSlot, isKnownApprovalDateKey } from "../domain/dashboard/approvals";
import { SECTION_ORDER } from "../domain/dashboard/types";
import type { TaskOccurrenceDto } from "../models/dto";
import { FamilyRoutineSlot, FamilyTaskOccurrenceStatus, FamilyTaskSourceType } from "../models/enums";

function buildTask(task: Partial<TaskOccurrenceDto>): TaskOccurrenceDto {
  return {
    uuid: task.uuid ?? "task-1",
    sourceType: task.sourceType ?? FamilyTaskSourceType.ROUTINE,
    sourceUuid: task.sourceUuid ?? "routine-1",
    assigneeProfileUuid: task.assigneeProfileUuid ?? "profile-1",
    title: task.title ?? "Task",
    emoji: task.emoji ?? null,
    description: task.description ?? null,
    scheduledFor: task.scheduledFor ?? "2026-03-14",
    dueAt: task.dueAt ?? null,
    status: task.status ?? FamilyTaskOccurrenceStatus.SUBMITTED,
    requiresApproval: task.requiresApproval ?? true,
    starsReward: task.starsReward ?? 1,
    starsAwarded: task.starsAwarded ?? 0,
  };
}

describe("approvals dashboard grouping", () => {
  const routineSlotByUuid = {
    "routine-morning": FamilyRoutineSlot.MORNING,
    "routine-afternoon": FamilyRoutineSlot.AFTERNOON,
    "routine-evening": FamilyRoutineSlot.EVENING,
    "routine-anytime": FamilyRoutineSlot.ANYTIME,
  };

  it("sorts profile groups by date and section order", () => {
    const tasks = [
      buildTask({
        uuid: "profile-1-evening",
        assigneeProfileUuid: "profile-1",
        title: "Evening check",
        scheduledFor: "2026-04-12",
        sourceUuid: "routine-evening",
      }),
      buildTask({
        uuid: "profile-1-morning",
        assigneeProfileUuid: "profile-1",
        title: "Brush teeth",
        scheduledFor: "2026-04-11",
        sourceUuid: "routine-morning",
      }),
      buildTask({
        uuid: "profile-1-afternoon",
        assigneeProfileUuid: "profile-1",
        title: "Homework",
        scheduledFor: "2026-04-11",
        sourceUuid: "routine-afternoon",
      }),
      buildTask({
        uuid: "profile-1-chore",
        assigneeProfileUuid: "profile-1",
        sourceType: FamilyTaskSourceType.CHORE,
        sourceUuid: "chore-1",
        title: "Clean room",
        scheduledFor: "2026-04-11",
      }),
      buildTask({
        uuid: "profile-2-morning",
        assigneeProfileUuid: "profile-2",
        title: "Read book",
        scheduledFor: "2026-04-11T08:00:00Z",
        sourceUuid: "routine-morning",
      }),
    ];

    const grouped = groupApprovalsByProfileDateAndSlot(tasks, routineSlotByUuid, SECTION_ORDER);
    const profileOneDates = grouped["profile-1"].map((group) => group.dateKey);
    expect(profileOneDates).toEqual(["2026-04-11", "2026-04-12"]);

    const firstDateGroup = grouped["profile-1"][0];
    const firstDateSections = SECTION_ORDER.filter(
      (section) => (firstDateGroup.tasksBySection[section]?.length ?? 0) > 0
    );
    expect(firstDateSections).toEqual(["morning", "afternoon", "chores"]);

    expect(grouped["profile-2"][0].dateKey).toBe("2026-04-11");
  });

  it("sorts tasks inside each slot by title and groups invalid dates separately", () => {
    const tasks = [
      buildTask({
        uuid: "b",
        assigneeProfileUuid: "profile-1",
        title: "Zoo task",
        scheduledFor: "not-a-date",
        sourceUuid: "routine-morning",
      }),
      buildTask({
        uuid: "a",
        assigneeProfileUuid: "profile-1",
        title: "Alpha task",
        scheduledFor: "not-a-date",
        sourceUuid: "routine-morning",
      }),
    ];

    const grouped = groupApprovalsByProfileDateAndSlot(tasks, routineSlotByUuid, SECTION_ORDER);
    expect(grouped["profile-1"][0].dateKey).toBe("unknown");

    const morningTitles = grouped["profile-1"][0].tasksBySection.morning?.map((task) => task.title);
    expect(morningTitles).toEqual(["Alpha task", "Zoo task"]);
  });

  it("identifies known and unknown date keys", () => {
    expect(isKnownApprovalDateKey("2026-03-14")).toBe(true);
    expect(isKnownApprovalDateKey("unknown")).toBe(false);
  });
});
