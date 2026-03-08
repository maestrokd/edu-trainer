import { describe, expect, it } from "vitest";
import { groupTasksByProfile, resolveTaskBucket, toTopSlot } from "../domain/dashboard/tasks";
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
    status: task.status ?? FamilyTaskOccurrenceStatus.OPEN,
    requiresApproval: task.requiresApproval ?? false,
    starsReward: task.starsReward ?? 1,
    starsAwarded: task.starsAwarded ?? 0,
  };
}

describe("dashboard task domain helpers", () => {
  it("resolves chore tasks into chore bucket", () => {
    const bucket = resolveTaskBucket(
      buildTask({
        sourceType: FamilyTaskSourceType.CHORE,
      }),
      {}
    );

    expect(bucket).toBe("chores");
  });

  it("groups and sorts tasks by section order and title", () => {
    const routineSlotByUuid = {
      "routine-morning": FamilyRoutineSlot.MORNING,
      "routine-afternoon": FamilyRoutineSlot.AFTERNOON,
      "routine-evening": FamilyRoutineSlot.EVENING,
      "routine-anytime": FamilyRoutineSlot.ANYTIME,
    };

    const tasks = [
      buildTask({ uuid: "3", title: "Zoo", sourceUuid: "routine-evening" }),
      buildTask({ uuid: "2", title: "Brush teeth", sourceUuid: "routine-morning" }),
      buildTask({ uuid: "1", title: "Clean room", sourceType: FamilyTaskSourceType.CHORE, sourceUuid: "chore-1" }),
      buildTask({ uuid: "5", title: "Read book", sourceUuid: "routine-anytime" }),
      buildTask({ uuid: "6", title: "Math practice", sourceUuid: "routine-afternoon" }),
      buildTask({ uuid: "4", title: "Arrange books", sourceUuid: "routine-morning" }),
    ];

    const grouped = groupTasksByProfile(tasks, routineSlotByUuid);
    const sortedTitles = grouped["profile-1"].map((task) => task.title);

    expect(sortedTitles).toEqual(["Arrange books", "Brush teeth", "Math practice", "Zoo", "Read book", "Clean room"]);
  });

  it("keeps each section in its own top progress bucket", () => {
    expect(toTopSlot("morning")).toBe("morning");
    expect(toTopSlot("afternoon")).toBe("afternoon");
    expect(toTopSlot("anytime")).toBe("anytime");
    expect(toTopSlot("evening")).toBe("evening");
    expect(toTopSlot("chores")).toBe("chores");
  });
});
