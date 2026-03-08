export const FamilyMemberRole = {
  PARENT: "PARENT",
  CHILD: "CHILD",
} as const;

export type FamilyMemberRole = (typeof FamilyMemberRole)[keyof typeof FamilyMemberRole];

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

export const FamilyInvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  CANCELED: "CANCELED",
} as const;

export type FamilyInvitationStatus = (typeof FamilyInvitationStatus)[keyof typeof FamilyInvitationStatus];

export const FamilyEventFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export type FamilyEventFrequency = (typeof FamilyEventFrequency)[keyof typeof FamilyEventFrequency];
