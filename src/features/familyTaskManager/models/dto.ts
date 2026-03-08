import type {
  FamilyEventFrequency,
  FamilyInvitationStatus,
  FamilyMemberRole,
  FamilyRewardRedemptionStatus,
  FamilyRoutineRecurrenceType,
  FamilyRoutineSlot,
  FamilyTaskCompletionEventType,
  FamilyTaskOccurrenceStatus,
  FamilyTaskSourceType,
} from "./enums";

export interface ApiItemsResponse<T> {
  items: T[];
}

/* Household */
export interface FamilyInfoDto {
  uuid: string;
  name: string;
  timezone: string;
  ownerProfileUuid: string;
  createdDate: string;
}

export interface HouseholdMemberDto {
  memberUuid: string;
  profileUuid: string;
  role: FamilyMemberRole;
  displayName: string;
  avatarEmoji: string | null;
  color: string | null;
  active: boolean;
}

/* Child profiles */
export interface ChildProfileDto {
  profileUuid: string;
  memberUuid: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  locale: string;
  displayName: string;
  avatarEmoji: string | null;
  color: string | null;
  active: boolean;
}

export interface CreateChildProfileRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  locale: string;
  displayName: string;
  avatarEmoji?: string;
  color?: string;
}

export interface PatchChildProfileRequest {
  firstName?: string;
  lastName?: string;
  password?: string;
  locale?: string;
  displayName?: string;
  avatarEmoji?: string;
  color?: string;
  active?: boolean;
}

/* Chores */
export interface ChoreDto {
  uuid: string;
  assigneeProfileUuids: string[];
  title: string;
  emoji: string | null;
  description: string | null;
  dueDate: string | null;
  requiresApproval: boolean;
  starsReward: number;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface CreateChoreRequest {
  assigneeProfileUuids: string[];
  title: string;
  emoji?: string;
  description?: string;
  dueDate?: string;
  requiresApproval: boolean;
  starsReward: number;
}

export interface PatchChoreRequest {
  assigneeProfileUuids?: string[];
  title?: string;
  emoji?: string;
  description?: string;
  dueDate?: string;
  requiresApproval?: boolean;
  starsReward?: number;
  active?: boolean;
}

/* Routines */
export interface RoutineDto {
  uuid: string;
  assigneeProfileUuids: string[];
  title: string;
  emoji: string | null;
  description: string | null;
  recurrenceType: FamilyRoutineRecurrenceType;
  recurrenceInterval: number;
  weekdays: string | null;
  routineSlot: FamilyRoutineSlot;
  startDate: string;
  endDate: string | null;
  requiresApproval: boolean;
  starsReward: number;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface CreateRoutineRequest {
  assigneeProfileUuids: string[];
  title: string;
  emoji?: string;
  description?: string;
  recurrenceType: FamilyRoutineRecurrenceType;
  recurrenceInterval: number;
  weekdays?: string | null;
  routineSlot: FamilyRoutineSlot;
  startDate: string;
  endDate?: string | null;
  requiresApproval: boolean;
  starsReward: number;
}

export interface PatchRoutineRequest {
  assigneeProfileUuids?: string[];
  title?: string;
  emoji?: string;
  description?: string;
  recurrenceType?: FamilyRoutineRecurrenceType;
  recurrenceInterval?: number;
  weekdays?: string | null;
  routineSlot?: FamilyRoutineSlot;
  startDate?: string;
  endDate?: string | null;
  requiresApproval?: boolean;
  starsReward?: number;
  active?: boolean;
}

/* Task occurrences */
export interface TaskOccurrenceDto {
  uuid: string;
  sourceType: FamilyTaskSourceType;
  sourceUuid: string;
  assigneeProfileUuid: string;
  title: string;
  emoji: string | null;
  description: string | null;
  scheduledFor: string;
  dueAt: string | null;
  timezone?: string;
  status: FamilyTaskOccurrenceStatus;
  requiresApproval: boolean;
  starsReward: number;
  starsAwarded: number;
}

export interface SubmitTaskCompletionRequest {
  note?: string;
}

export interface ReviewTaskCompletionRequest {
  note?: string;
}

export interface TaskCompletionEventDto {
  uuid: string;
  actorProfileUuid: string;
  eventType: FamilyTaskCompletionEventType;
  note: string | null;
  createdDate: string;
}

/* Rewards */
export interface RewardDto {
  uuid: string;
  title: string;
  description: string | null;
  starsCost: number;
  availableQuantity: number | null;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface CreateRewardRequest {
  title: string;
  description?: string;
  starsCost: number;
  availableQuantity?: number;
}

export interface PatchRewardRequest {
  title?: string;
  description?: string;
  starsCost?: number;
  availableQuantity?: number;
  active?: boolean;
}

export interface StarsBalanceDto {
  secondaryProfileUuid: string;
  balance: number;
}

export interface StarLedgerEntryDto {
  uuid: string;
  occurrenceUuid: string;
  secondaryProfileUuid: string;
  deltaStars: number;
  reason: string;
  createdDate: string;
}

export interface RewardRedemptionDto {
  uuid: string;
  rewardUuid: string;
  requesterProfileUuid: string;
  status: FamilyRewardRedemptionStatus;
  note: string | null;
  reviewedByProfileUuid: string | null;
  reviewedNote: string | null;
  createdDate: string;
  reviewedDate: string | null;
}

export interface CreateRedemptionRequest {
  rewardUuid: string;
  note?: string;
}

export interface ReviewRewardRedemptionRequest {
  reviewedNote?: string;
}

/* Lists */
export interface FamilyListDto {
  uuid: string;
  title: string;
  description: string | null;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface CreateListRequest {
  title: string;
  description?: string;
}

export interface PatchListRequest {
  title?: string;
  description?: string;
  active?: boolean;
}

export interface ListSectionDto {
  uuid: string;
  listUuid: string;
  title: string;
  sortOrder: number;
}

export interface CreateListSectionRequest {
  listUuid: string;
  title: string;
  sortOrder?: number;
}

export interface PatchListSectionRequest {
  title?: string;
  sortOrder?: number;
}

export interface ListItemDto {
  uuid: string;
  listUuid: string;
  sectionUuid: string | null;
  assigneeProfileUuid: string | null;
  title: string;
  notes: string | null;
  completed: boolean;
  completedByProfileUuid: string | null;
  completedAt: string | null;
  sortOrder: number;
}

export interface CreateListItemRequest {
  listUuid: string;
  sectionUuid?: string;
  assigneeProfileUuid?: string;
  title: string;
  notes?: string;
  sortOrder?: number;
}

export interface PatchListItemRequest {
  sectionUuid?: string;
  assigneeProfileUuid?: string;
  title?: string;
  notes?: string;
  completed?: boolean;
  sortOrder?: number;
}

/* Events */
export interface FamilyEventDto {
  uuid: string;
  recurrenceRuleUuid: string | null;
  assigneeProfileUuid: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  active: boolean;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  allDay?: boolean;
  assigneeProfileUuid?: string;
  recurrenceRuleUuid?: string | null;
}

export interface PatchEventRequest {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  assigneeProfileUuid?: string;
  recurrenceRuleUuid?: string | null;
  active?: boolean;
}

export interface EventRecurrenceRuleDto {
  uuid: string;
  frequency: FamilyEventFrequency;
  intervalValue: number;
  weekdays: string | null;
  untilDate: string | null;
  active: boolean;
}

export interface CreateEventRecurrenceRuleRequest {
  frequency: FamilyEventFrequency;
  intervalValue: number;
  weekdays?: string | null;
  untilDate?: string | null;
}

export interface PatchEventRecurrenceRuleRequest {
  frequency?: FamilyEventFrequency;
  intervalValue?: number;
  weekdays?: string | null;
  untilDate?: string | null;
  active?: boolean;
}

/* Invitations */
export interface InvitationDto {
  uuid: string;
  createdByProfileUuid: string;
  invitedEmail: string;
  message: string | null;
  status: FamilyInvitationStatus;
  createdDate: string;
  lastSentDate: string;
}

export interface CreateInvitationRequest {
  invitedEmail: string;
  message?: string;
}

/* Devices & display */
export interface DeviceDto {
  uuid: string;
  name: string;
  deviceType: string;
  readOnlyMode: boolean;
  active: boolean;
}

export interface CreateDeviceRequest {
  name: string;
  deviceType: string;
  readOnlyMode: boolean;
}

export interface PatchDeviceRequest {
  name?: string;
  deviceType?: string;
  readOnlyMode?: boolean;
  active?: boolean;
}

export interface DisplaySettingsDto {
  uuid: string;
  showCompletedTasks: boolean;
  calendarStartOfWeek: string;
  theme: string;
  lastUpdatedDate: string;
}

export interface PatchDisplaySettingsRequest {
  showCompletedTasks?: boolean;
  calendarStartOfWeek?: string;
  theme?: string;
}

export interface DeviceLinkDto {
  uuid: string;
  deviceUuid: string;
  memberUuid: string;
  createdDate: string;
}

export interface CreateDeviceLinkRequest {
  deviceUuid: string;
  memberUuid: string;
}
