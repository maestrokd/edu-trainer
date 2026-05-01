import type { FamilyRoutineSlot } from "../../models/enums";

export type SlotBucket = "morning" | "afternoon" | "evening" | "anytime" | "chores";
export type TopSlot = SlotBucket;

export const TOP_SLOT_ORDER: TopSlot[] = ["morning", "afternoon", "evening", "anytime", "chores"];
export const SECTION_ORDER: SlotBucket[] = ["morning", "afternoon", "evening", "anytime", "chores"];

export const SECTION_SORT_ORDER: Record<SlotBucket, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
  anytime: 3,
  chores: 4,
};

export const SLOT_BY_ROUTINE_SLOT: Record<FamilyRoutineSlot, SlotBucket> = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
  ANYTIME: "anytime",
};
