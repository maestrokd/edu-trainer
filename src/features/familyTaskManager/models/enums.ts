export const FamilyRoutineRecurrenceType = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
} as const;

export type FamilyRoutineRecurrenceType =
  (typeof FamilyRoutineRecurrenceType)[keyof typeof FamilyRoutineRecurrenceType];

export const FamilyRoutineSlot = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
  ANYTIME: "ANYTIME",
} as const;

export type FamilyRoutineSlot = (typeof FamilyRoutineSlot)[keyof typeof FamilyRoutineSlot];

export const FamilyRoutineExceptionType = {
  SKIP: "SKIP",
} as const;

export type FamilyRoutineExceptionType = (typeof FamilyRoutineExceptionType)[keyof typeof FamilyRoutineExceptionType];

export const FamilyTaskSourceType = {
  CHORE: "CHORE",
  ROUTINE: "ROUTINE",
} as const;

export type FamilyTaskSourceType = (typeof FamilyTaskSourceType)[keyof typeof FamilyTaskSourceType];

export const FamilyTaskOccurrenceStatus = {
  OPEN: "OPEN",
  SUBMITTED: "SUBMITTED",
  COMPLETED: "COMPLETED",
} as const;

export type FamilyTaskOccurrenceStatus = (typeof FamilyTaskOccurrenceStatus)[keyof typeof FamilyTaskOccurrenceStatus];

export const FamilyTaskCompletionEventType = {
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type FamilyTaskCompletionEventType =
  (typeof FamilyTaskCompletionEventType)[keyof typeof FamilyTaskCompletionEventType];

export const FamilyRewardRedemptionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type FamilyRewardRedemptionStatus =
  (typeof FamilyRewardRedemptionStatus)[keyof typeof FamilyRewardRedemptionStatus];

export const FamilyRewardLabelKind = {
  CATEGORY: "CATEGORY",
  TAG: "TAG",
} as const;

export type FamilyRewardLabelKind = (typeof FamilyRewardLabelKind)[keyof typeof FamilyRewardLabelKind];

export const FamilyRewardLabelMatchMode = {
  ANY: "ANY",
  ALL: "ALL",
} as const;

export type FamilyRewardLabelMatchMode = (typeof FamilyRewardLabelMatchMode)[keyof typeof FamilyRewardLabelMatchMode];
