import { useCallback } from "react";
import { FamilyTaskAnalyticsEvent } from "../constants/events";
import { trackFamilyTaskEvent } from "../services/analytics";
import type { FamilyTaskAnalyticsEvent as FamilyTaskAnalyticsEventName } from "../constants/events";
import type { FamilyTaskAnalyticsPayload } from "../types/analytics";
import { useFamilyTaskCapabilities } from "./useFamilyTaskCapabilities";

type FamilyTaskTrackPayload = Omit<FamilyTaskAnalyticsPayload, "miniApp" | "authenticated" | "accessLevel">;

export function useFamilyTaskAnalytics() {
  const capabilities = useFamilyTaskCapabilities();

  const track = useCallback(
    (event: FamilyTaskAnalyticsEventName, payload?: FamilyTaskTrackPayload) => {
      trackFamilyTaskEvent({
        event,
        payload: {
          miniApp: "family_task_manager",
          authenticated: capabilities.accessLevel !== "guest",
          accessLevel: capabilities.accessLevel,
          ...payload,
        },
      });
    },
    [capabilities.accessLevel]
  );

  const trackPageViewed = useCallback(
    (screen: string) => {
      track(FamilyTaskAnalyticsEvent.SCREEN_VIEWED, { screen });
    },
    [track]
  );

  const trackFeatureLockedViewed = useCallback(
    (featureId: string, source?: string) => {
      track(FamilyTaskAnalyticsEvent.FEATURE_LOCKED_VIEWED, { featureId, source });
    },
    [track]
  );

  const trackLoginSuggestionViewed = useCallback(
    (source?: string) => {
      track(FamilyTaskAnalyticsEvent.LOGIN_PROMPT_VIEWED, { source });
    },
    [track]
  );

  const trackUpgradeSuggestionViewed = useCallback(
    (source?: string) => {
      track(FamilyTaskAnalyticsEvent.UPGRADE_PROMPT_VIEWED, { source });
    },
    [track]
  );

  const trackLoginSuggestionClicked = useCallback(
    (source?: string) => {
      track(FamilyTaskAnalyticsEvent.LOGIN_PROMPT_CLICKED, { source });
    },
    [track]
  );

  const trackUpgradeSuggestionClicked = useCallback(
    (source?: string) => {
      track(FamilyTaskAnalyticsEvent.UPGRADE_PROMPT_CLICKED, { source });
    },
    [track]
  );

  return {
    track,
    trackPageViewed,
    trackFeatureLockedViewed,
    trackLoginSuggestionViewed,
    trackUpgradeSuggestionViewed,
    trackLoginSuggestionClicked,
    trackUpgradeSuggestionClicked,
  };
}
