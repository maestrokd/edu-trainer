import type { FamilyTaskAnalyticsEvent } from "../constants/events";
import type { UserAccessLevel } from "./capabilities";

export interface FamilyTaskAnalyticsPayload {
  miniApp: "family_task_manager";
  screen?: string;
  sessionId?: string;
  featureId?: string;
  accessLevel: UserAccessLevel;
  authenticated: boolean;
  source?: string;
  status?: string;
  [key: string]: unknown;
}

export interface FamilyTaskAnalyticsTrackEvent {
  event: FamilyTaskAnalyticsEvent;
  payload: FamilyTaskAnalyticsPayload;
}
