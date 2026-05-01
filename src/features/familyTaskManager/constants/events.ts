export const FamilyTaskAnalyticsEvent = {
  MINI_APP_VIEWED: "family_task_mini_app_viewed",
  SCREEN_VIEWED: "family_task_screen_viewed",
  SESSION_STARTED: "family_task_session_started",
  TASK_SUBMITTED: "family_task_task_submitted",
  TASK_APPROVED: "family_task_task_approved",
  TASK_REJECTED: "family_task_task_rejected",
  REDEMPTION_APPROVED: "family_task_redemption_approved",
  REDEMPTION_REJECTED: "family_task_redemption_rejected",
  FEATURE_LOCKED_VIEWED: "family_task_feature_locked_viewed",
  LOGIN_PROMPT_VIEWED: "family_task_login_prompt_viewed",
  UPGRADE_PROMPT_VIEWED: "family_task_upgrade_prompt_viewed",
  LOGIN_PROMPT_CLICKED: "family_task_login_prompt_clicked",
  UPGRADE_PROMPT_CLICKED: "family_task_upgrade_prompt_clicked",
} as const;

export type FamilyTaskAnalyticsEvent = (typeof FamilyTaskAnalyticsEvent)[keyof typeof FamilyTaskAnalyticsEvent];
