import type {
  FamilyRewardLabelKind,
  FamilyRewardLabelMatchMode,
  FamilyRewardRedemptionStatus,
  FamilyRoutineRecurrenceType,
  FamilyRoutineExceptionType,
  FamilyRoutineSlot,
  FamilyTaskCompletionEventType,
  FamilyTaskOccurrenceStatus,
  FamilyTaskSourceType,
} from "./enums";
import type { TenantMembershipRole } from "@/services/AuthService";

export interface ApiItemsResponse<T> {
  items: T[];
}

export interface ApiPagedItemsResponse<T> {
  page: number;
  requestedSize: number;
  actualPageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

/* Household */
export interface FamilyInfoDto {
  uuid: string;
  name: string;
  timezone: string;
  ownerProfileUuid: string;
  createdDate: string;
  householdMembers?: HouseholdMemberDto[];
  childProfiles?: ChildProfileDto[];
}

export interface HouseholdMemberDto {
  memberUuid: string;
  profileUuid: string;
  role: TenantMembershipRole;
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

/* Routine exceptions */
export interface RoutineExceptionRoutineSummaryDto {
  uuid: string;
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
}

export interface RoutineExceptionDto {
  uuid: string;
  routineUuid: string;
  routine: RoutineExceptionRoutineSummaryDto | null;
  assigneeProfileUuid: string;
  exceptionDate: string;
  exceptionType: FamilyRoutineExceptionType;
  note: string | null;
  createdByProfileUuid: string;
  createdDate: string;
}

export interface RoutineExceptionsQuery {
  assigneeProfileUuid?: string;
  createdByProfileUuid?: string;
  exceptionType?: FamilyRoutineExceptionType;
  fromDate?: string;
  toDate?: string;
  searchString?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface CreateRoutineExceptionsRequest {
  fromDate: string;
  toDate: string;
  assigneeProfileUuids: string[];
  exceptionType: FamilyRoutineExceptionType;
  note?: string;
}

export interface ReopenRoutineExceptionsRequest {
  fromDate: string;
  toDate: string;
  assigneeProfileUuids: string[];
}

export interface RoutineExceptionsMutationSummaryDto {
  routineUuid: string;
  fromDate: string;
  toDate: string;
  requestedAssigneeCount: number;
  createdExceptionsCount: number;
  alreadyExistingCount: number;
  removedExceptionsCount: number;
  deletedOpenOccurrencesCount: number;
  conflictSubmittedCount: number;
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
  assigneeProfileUuids: string[];
  redeemableAssigneeProfileUuids: string[];
  labels: RewardLabelDto[];
  primaryLabelUuid: string | null;
  title: string;
  emoji: string | null;
  description: string | null;
  starsCost: number;
  availableQuantity: number | null;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface CreateRewardRequest {
  assigneeProfileUuids: string[];
  title: string;
  emoji?: string;
  description?: string;
  starsCost: number;
  availableQuantity?: number;
  labelUuids?: string[];
  primaryLabelUuid?: string;
}

export interface PatchRewardRequest {
  assigneeProfileUuids?: string[];
  title?: string;
  emoji?: string;
  description?: string;
  starsCost?: number;
  availableQuantity?: number;
  labelUuids?: string[];
  primaryLabelUuid?: string;
  active?: boolean;
}

export interface RewardLabelDto {
  uuid: string;
  kind: FamilyRewardLabelKind;
  name: string;
  active: boolean;
}

export interface RewardsQuery {
  active?: boolean;
  primaryLabelUuid?: string;
  labelUuids?: string[];
  labelMatchMode?: FamilyRewardLabelMatchMode;
  searchString?: string;
}

export interface RewardLabelsQuery {
  kind?: FamilyRewardLabelKind;
  includeInactive?: boolean;
  searchString?: string;
}

export interface CreateRewardLabelRequest {
  kind: FamilyRewardLabelKind;
  name: string;
}

export interface StarsBalanceDto {
  secondaryProfileUuid: string;
  balance: number;
}

export interface StarsBalancesQuery {
  secondaryProfileUuids?: string[];
}

export interface CreateStarAdjustmentRequest {
  secondaryProfileUuid: string;
  deltaStars: number;
  reason: string;
}

export interface StarLedgerEntryDto {
  uuid: string;
  occurrenceUuid: string | null;
  secondaryProfileUuid: string;
  deltaStars: number;
  reason: string;
  createdDate: string;
}

export interface StarLedgerEntriesQuery {
  entryUuid?: string;
  secondaryProfileUuid?: string;
  occurrenceUuid?: string;
  reason?: string;
  minDeltaStars?: number;
  maxDeltaStars?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ApiPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface RewardRedemptionDto {
  uuid: string;
  rewardUuid: string;
  requesterProfileUuid: string;
  assigneeProfileUuid: string;
  status: FamilyRewardRedemptionStatus;
  note: string | null;
  reviewedByProfileUuid: string | null;
  reviewedNote: string | null;
  redeemedDate: string | null;
  effectiveRedeemedDate?: string | null;
  effectiveRedeemedLocalDate?: string | null;
  createdDate: string;
  reviewedDate: string | null;
  reward?: RewardRedemptionRewardSummaryDto | null;
}

export interface RewardRedemptionRewardSummaryDto {
  uuid: string;
  title: string;
  emoji: string | null;
  starsCost: number;
  active: boolean;
  primaryLabelUuid: string | null;
}

export interface RewardRedemptionsQuery {
  status?: FamilyRewardRedemptionStatus;
  active?: boolean;
  primaryLabelUuid?: string;
  labelUuids?: string[];
  labelMatchMode?: FamilyRewardLabelMatchMode;
  searchString?: string;
  redeemedFrom?: string;
  redeemedTo?: string;
  page?: number;
  size?: number;
  sort?: string[];
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

/* Template collections */
export const TemplateCollectionType = {
  ROUTINES: "ROUTINES",
  CHORES: "CHORES",
  REWARDS: "REWARDS",
} as const;

export type TemplateCollectionType = (typeof TemplateCollectionType)[keyof typeof TemplateCollectionType];

export const TemplateStateFilter = {
  ALL: "ALL",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type TemplateStateFilter = (typeof TemplateStateFilter)[keyof typeof TemplateStateFilter];

export const TemplateSelectionMode = {
  ALL_FILTERED: "ALL_FILTERED",
  SELECTED: "SELECTED",
} as const;

export type TemplateSelectionMode = (typeof TemplateSelectionMode)[keyof typeof TemplateSelectionMode];

export interface TemplateExportRequest {
  stateFilter: TemplateStateFilter;
  selectionMode: TemplateSelectionMode;
  selectedUuids?: string[];
}

export interface RoutineTemplateCandidateDto {
  uuid: string;
  title: string;
  emoji: string | null;
  recurrenceType: FamilyRoutineRecurrenceType;
  routineSlot: FamilyRoutineSlot;
  starsReward: number;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface ChoreTemplateCandidateDto {
  uuid: string;
  title: string;
  emoji: string | null;
  dueDate: string | null;
  starsReward: number;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface RewardTemplateCandidateDto {
  uuid: string;
  title: string;
  emoji: string | null;
  starsCost: number;
  availableQuantity: number | null;
  active: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface RoutineTemplateItemDto {
  title: string;
  emoji: string | null;
  description: string | null;
  recurrenceType: FamilyRoutineRecurrenceType;
  recurrenceInterval: number;
  weekdays: string | null;
  routineSlot: FamilyRoutineSlot;
  requiresApproval: boolean;
  starsReward: number;
}

export interface ChoreTemplateItemDto {
  title: string;
  emoji: string | null;
  description: string | null;
  requiresApproval: boolean;
  starsReward: number;
}

export interface RewardTemplateItemDto {
  title: string;
  emoji: string | null;
  description: string | null;
  starsCost: number;
  availableQuantity: number | null;
}

export interface TemplateCollectionPayload<TItem extends object> {
  schemaVersion: string;
  items: TItem[];
}

export type RoutineTemplateCollectionPayload = TemplateCollectionPayload<RoutineTemplateItemDto>;
export type ChoreTemplateCollectionPayload = TemplateCollectionPayload<ChoreTemplateItemDto>;
export type RewardTemplateCollectionPayload = TemplateCollectionPayload<RewardTemplateItemDto>;

export interface TemplateImportIssueDto {
  itemIndex: number;
  field: string;
  message: string;
}

export interface TemplateImportPreviewResponseDto {
  totalItemCount: number;
  validItemCount: number;
  invalidItemCount: number;
  wouldCreateCount: number;
  warnings: TemplateImportIssueDto[];
  errors: TemplateImportIssueDto[];
}

export interface TemplateImportExecuteResponseDto {
  requestedItemCount: number;
  createdItemCount: number;
  createdUuids: string[];
}
