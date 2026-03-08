# Family Task Manager

Internal sub-application for household task planning, approvals, rewards, lists, profiles, invitations, and shared display workflows.

## Architecture highlights

- `pages/`: route-level screens.
- `components/layout`: shared page shell.
- `components/dashboard`: dashboard-focused presentational components.
- `components/gates`: parent/login/upgrade/feature-lock insertion points.
- `domain/dashboard`: pure helper logic for grouping, time, and color derivation.
- `hooks/useFamilyTaskDashboardController`: dashboard state orchestration.
- `hooks/useFamilyTaskCapabilities`: centralized guest/free/paid capability resolution.
- `hooks/useFamilyTaskAnalytics`: typed analytics contract with adapter-based tracking.
- `services/capabilityResolver.ts`: capability model resolution.
- `services/analytics.ts`: analytics adapter boundary.
- `constants/events.ts`: centralized analytics event names.
- `constants/routes.ts`: centralized route paths used by feature navigation.

## Extension points

- Replace the default analytics fallback by calling `registerFamilyTaskAnalyticsAdapter`.
- Adjust premium rules in `resolveFamilyTaskCapabilities`.
- Show login/upgrade prompts by enabling `CapabilitySuggestions` where needed.
- Reuse `ParentFeatureGate` for new parent-only pages.
