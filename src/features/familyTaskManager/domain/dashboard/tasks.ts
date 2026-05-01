import type { TaskOccurrenceDto } from "../../models/dto";
import { FamilyRoutineSlot, FamilyTaskOccurrenceStatus, FamilyTaskSourceType } from "../../models/enums";
import type { SlotBucket, TopSlot } from "./types";
import { SECTION_SORT_ORDER, SLOT_BY_ROUTINE_SLOT } from "./types";

export function resolveTaskBucket(
  task: TaskOccurrenceDto,
  routineSlotByUuid: Record<string, FamilyRoutineSlot>
): SlotBucket {
  if (task.sourceType === FamilyTaskSourceType.CHORE) {
    return "chores";
  }

  const routineSlot = routineSlotByUuid[task.sourceUuid] ?? FamilyRoutineSlot.ANYTIME;
  return SLOT_BY_ROUTINE_SLOT[routineSlot];
}

export function toTopSlot(bucket: SlotBucket): TopSlot {
  return bucket;
}

export function resolveTaskIcon(task: TaskOccurrenceDto, bucket: SlotBucket): string {
  const explicitEmoji = task.emoji?.trim();
  if (explicitEmoji) {
    return explicitEmoji;
  }

  const text = `${task.title} ${task.description ?? ""}`.toLowerCase();

  if (/tooth|brush/.test(text)) return "😁";
  if (/homework|study|school|read/.test(text)) return "📝";
  if (/bed|sleep/.test(text)) return "🛏️";
  if (/clean|vacuum|broom|organize|room/.test(text)) return "🧹";
  if (/dish|plate|kitchen/.test(text)) return "🍽️";
  if (/laundry|clothes/.test(text)) return "🧺";
  if (/trash|garbage|bin/.test(text)) return "🗑️";

  if (bucket === "morning") return "☀️";
  if (bucket === "evening") return "🌙";
  if (bucket === "chores") return "🧽";

  return "✅";
}

export function groupTasksByProfile(
  tasks: TaskOccurrenceDto[],
  routineSlotByUuid: Record<string, FamilyRoutineSlot>
): Record<string, TaskOccurrenceDto[]> {
  const grouped: Record<string, TaskOccurrenceDto[]> = {};

  for (const task of tasks) {
    grouped[task.assigneeProfileUuid] = [...(grouped[task.assigneeProfileUuid] ?? []), task];
  }

  for (const profileUuid of Object.keys(grouped)) {
    grouped[profileUuid].sort((left, right) => {
      const leftBucket = resolveTaskBucket(left, routineSlotByUuid);
      const rightBucket = resolveTaskBucket(right, routineSlotByUuid);
      const leftOrder = SECTION_SORT_ORDER[leftBucket];
      const rightOrder = SECTION_SORT_ORDER[rightBucket];

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.title.localeCompare(right.title);
    });
  }

  return grouped;
}

export function calculateCompletedCount(tasks: TaskOccurrenceDto[]) {
  return tasks.filter((task) => task.status === FamilyTaskOccurrenceStatus.COMPLETED).length;
}

export function calculateEarnedStars(tasks: TaskOccurrenceDto[]) {
  return tasks.reduce((sum, task) => {
    if (task.status !== FamilyTaskOccurrenceStatus.COMPLETED) {
      return sum;
    }

    return sum + (task.starsAwarded > 0 ? task.starsAwarded : task.starsReward);
  }, 0);
}
