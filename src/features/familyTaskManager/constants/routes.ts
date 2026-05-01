export const FAMILY_TASK_ROUTES = {
  root: "/family-tasks",
  today: "/family-tasks/today",
  chores: "/family-tasks/chores",
  choresNew: "/family-tasks/chores/new",
  routines: "/family-tasks/routines",
  routinesNew: "/family-tasks/routines/new",
  routineExceptions: "/family-tasks/routines/:routineUuid/exceptions",
  routineExceptionsNew: "/family-tasks/routines/:routineUuid/exceptions/new",
  routineExceptionsForRoutine: (routineUuid: string) =>
    `/family-tasks/routines/${encodeURIComponent(routineUuid)}/exceptions`,
  routineExceptionsNewForRoutine: (routineUuid: string) =>
    `/family-tasks/routines/${encodeURIComponent(routineUuid)}/exceptions/new`,
  routineExceptionDetailsForRoutine: (routineUuid: string, exceptionUuid: string) =>
    `/family-tasks/routines/${encodeURIComponent(routineUuid)}/exceptions/${encodeURIComponent(exceptionUuid)}`,
  rewards: "/family-tasks/rewards",
  rewardsNew: "/family-tasks/rewards/new",
  rewardsStars: "/family-tasks/rewards/stars",
  rewardsRedemptions: "/family-tasks/rewards/redemptions",
  lists: "/family-tasks/lists",
  profiles: "/family-tasks/profiles",
  templateCollections: "/family-tasks/template-collections",
  display: "/family-tasks/display",
  approvals: "/family-tasks/approvals",
  settings: "/family-tasks/settings",
} as const;
