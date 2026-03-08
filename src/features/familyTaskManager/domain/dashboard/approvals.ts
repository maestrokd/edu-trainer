import type { TaskOccurrenceDto } from "../../models/dto";
import type { FamilyRoutineSlot } from "../../models/enums";
import { resolveTaskBucket } from "./tasks";
import type { SlotBucket } from "./types";

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T/;
const UNKNOWN_DATE_KEY = "unknown";

export interface ApprovalDateGroup {
  dateKey: string;
  tasksBySection: Partial<Record<SlotBucket, TaskOccurrenceDto[]>>;
}

function normalizeDateKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return UNKNOWN_DATE_KEY;
  }

  const localDateMatch = LOCAL_DATE_PATTERN.exec(trimmed);
  if (localDateMatch) {
    return trimmed;
  }

  const isoDateMatch = ISO_DATE_PREFIX_PATTERN.exec(trimmed);
  if (isoDateMatch) {
    return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return UNKNOWN_DATE_KEY;
  }

  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateSortValue(dateKey: string): number {
  const localDateMatch = LOCAL_DATE_PATTERN.exec(dateKey);
  if (!localDateMatch) {
    return Number.POSITIVE_INFINITY;
  }

  const [, year, month, day] = localDateMatch;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function sortTasks(left: TaskOccurrenceDto, right: TaskOccurrenceDto): number {
  return (
    left.title.localeCompare(right.title) ||
    left.scheduledFor.localeCompare(right.scheduledFor) ||
    left.uuid.localeCompare(right.uuid)
  );
}

export function isKnownApprovalDateKey(dateKey: string): boolean {
  return LOCAL_DATE_PATTERN.test(dateKey);
}

export function groupApprovalsByProfileDateAndSlot(
  tasks: TaskOccurrenceDto[],
  routineSlotByUuid: Record<string, FamilyRoutineSlot>,
  sectionOrder: SlotBucket[]
): Record<string, ApprovalDateGroup[]> {
  const groupedByProfile: Record<string, Record<string, Partial<Record<SlotBucket, TaskOccurrenceDto[]>>>> = {};

  for (const task of tasks) {
    const profileUuid = task.assigneeProfileUuid;
    const dateKey = normalizeDateKey(task.scheduledFor);
    const bucket = resolveTaskBucket(task, routineSlotByUuid);

    const profileGroups = groupedByProfile[profileUuid] ?? {};
    const dateGroups = profileGroups[dateKey] ?? {};
    const sectionTasks = dateGroups[bucket] ?? [];

    groupedByProfile[profileUuid] = profileGroups;
    profileGroups[dateKey] = dateGroups;
    dateGroups[bucket] = [...sectionTasks, task];
  }

  const result: Record<string, ApprovalDateGroup[]> = {};

  for (const profileUuid of Object.keys(groupedByProfile)) {
    const dateGroups = groupedByProfile[profileUuid];
    const profileSections = Object.entries(dateGroups).map(([dateKey, tasksBySection]) => {
      const sortedTasksBySection: Partial<Record<SlotBucket, TaskOccurrenceDto[]>> = {};

      for (const section of sectionOrder) {
        const sectionTasks = tasksBySection[section];
        if (!sectionTasks?.length) {
          continue;
        }

        sortedTasksBySection[section] = [...sectionTasks].sort(sortTasks);
      }

      return {
        dateKey,
        tasksBySection: sortedTasksBySection,
      };
    });

    profileSections.sort((left, right) => {
      const leftSortValue = toDateSortValue(left.dateKey);
      const rightSortValue = toDateSortValue(right.dateKey);

      if (leftSortValue !== rightSortValue) {
        return leftSortValue - rightSortValue;
      }

      return left.dateKey.localeCompare(right.dateKey);
    });

    result[profileUuid] = profileSections;
  }

  return result;
}
