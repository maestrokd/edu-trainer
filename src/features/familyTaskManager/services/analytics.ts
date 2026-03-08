import type { FamilyTaskAnalyticsTrackEvent } from "../types/analytics";

export type FamilyTaskAnalyticsAdapter = (entry: FamilyTaskAnalyticsTrackEvent) => void;

let analyticsAdapter: FamilyTaskAnalyticsAdapter | null = null;

export function registerFamilyTaskAnalyticsAdapter(adapter: FamilyTaskAnalyticsAdapter) {
  analyticsAdapter = adapter;
}

export function trackFamilyTaskEvent(entry: FamilyTaskAnalyticsTrackEvent) {
  if (analyticsAdapter) {
    analyticsAdapter(entry);
    return;
  }

  // Temporary fallback. Replace with a dedicated analytics provider integration.
  console.log(`[FamilyTaskAnalytics] ${entry.event}`, entry.payload);
}
