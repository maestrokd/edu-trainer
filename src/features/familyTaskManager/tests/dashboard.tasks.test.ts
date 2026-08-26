import { describe, expect, it } from "vitest";
import { groupTasksByProfile, resolveTaskBucket, toTopSlot } from "../domain/dashboard/tasks";
import type { TaskOccurrenceDto } from "../models/dto";
import { FamilyRoutineSlot, FamilyTaskOccurrenceStatus, FamilyTaskSourceType } from "../models/enums";

function buildTask(task: Partial<TaskOccurrenceDto>): TaskOccurrenceDto {
  return {
    uuid: task.uuid ?? "task-1",
    sourceType: task.sourceType ?? FamilyTaskSourceType.ROUTINE,
    sourceUuid: task.sourceUuid ?? "routine-1",
    routineSlot: task.routineSlot ?? null,
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
    const bucket = resolveTaskBucket(buildTask({ sourceType: FamilyTaskSourceType.CHORE }));

    expect(bucket).toBe("chores");
  });

  it("groups and sorts tasks by section order and title", () => {
    const tasks = [
      buildTask({ uuid: "3", title: "Zoo", routineSlot: FamilyRoutineSlot.EVENING }),
      buildTask({ uuid: "2", title: "Brush teeth", routineSlot: FamilyRoutineSlot.MORNING }),
      buildTask({ uuid: "1", title: "Clean room", sourceType: FamilyTaskSourceType.CHORE, sourceUuid: "chore-1" }),
      buildTask({ uuid: "5", title: "Read book", routineSlot: FamilyRoutineSlot.ANYTIME }),
      buildTask({ uuid: "6", title: "Math practice", routineSlot: FamilyRoutineSlot.AFTERNOON }),
      buildTask({ uuid: "4", title: "Arrange books", routineSlot: FamilyRoutineSlot.MORNING }),
    ];

    const grouped = groupTasksByProfile(tasks);
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
