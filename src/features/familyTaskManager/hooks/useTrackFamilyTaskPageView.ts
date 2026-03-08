import { useEffect } from "react";
import { FamilyTaskAnalyticsEvent } from "../constants/events";
import { useFamilyTaskAnalytics } from "./useFamilyTaskAnalytics";

export function useTrackFamilyTaskPageView(screen: string) {
  const { track, trackPageViewed } = useFamilyTaskAnalytics();

  useEffect(() => {
    track(FamilyTaskAnalyticsEvent.MINI_APP_VIEWED, { screen });
    trackPageViewed(screen);
  }, [screen, track, trackPageViewed]);
}
