import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeDay, toLocalDateParam } from "../domain/dashboard/date";
import { useFamilyTaskDashboardController } from "../hooks/useFamilyTaskDashboardController";

const trackMock = vi.fn();
type DashboardOccurrenceFilters = {
  from?: string;
  to?: string;
  profileUuid?: string;
};

const useTaskOccurrencesMock = vi.fn((_filters?: DashboardOccurrenceFilters) => ({
  tasks: [],
  loading: false,
  error: null,
  refetch: vi.fn(),
  submit: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    principal: {
      activeTenantRole: "OWNER",
      profileType: "PRIMARY",
      username: "parent",
    },
  }),
}));

vi.mock("../hooks/useFamilyContext", () => ({
  useFamilyContext: () => ({
    family: { name: "Test Family" },
    profiles: [
      {
        profileUuid: "profile-1",
        username: "kid-one",
        displayName: "Kid One",
        active: true,
      },
    ],
    error: null,
  }),
}));

vi.mock("../hooks/useRoutines", () => ({
  useRoutines: () => ({
    routines: [],
  }),
}));

vi.mock("../hooks/useFamilyTaskAnalytics", () => ({
  useFamilyTaskAnalytics: () => ({
    track: trackMock,
  }),
}));

vi.mock("../hooks/useTaskOccurrences", () => ({
  useTaskOccurrences: (filters?: DashboardOccurrenceFilters) => useTaskOccurrencesMock(filters),
}));

describe("useFamilyTaskDashboardController date navigation", () => {
  function getLastOccurrenceFilters(): DashboardOccurrenceFilters {
    const filters = useTaskOccurrencesMock.mock.calls.at(-1)?.[0];
    if (!filters) {
      throw new Error("Expected useTaskOccurrences to be called with filters");
    }

    return filters;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces task filters when rapidly changing date", () => {
    const { result } = renderHook(() => useFamilyTaskDashboardController());

    const initialFilters = getLastOccurrenceFilters();

    act(() => {
      for (let index = 0; index < 10; index += 1) {
        result.current.shiftDate("next");
      }
    });

    const beforeDebounceFilters = getLastOccurrenceFilters();
    expect(beforeDebounceFilters.from).toBe(initialFilters.from);
    expect(beforeDebounceFilters.to).toBe(initialFilters.to);

    act(() => {
      vi.advanceTimersByTime(499);
    });

    const stillBeforeDebounceFilters = getLastOccurrenceFilters();
    expect(stillBeforeDebounceFilters.from).toBe(initialFilters.from);
    expect(stillBeforeDebounceFilters.to).toBe(initialFilters.to);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    const afterDebounceFilters = getLastOccurrenceFilters();
    const expectedDate = toLocalDateParam(normalizeDay(result.current.selectedDate));

    expect(afterDebounceFilters.from).toBe(expectedDate);
    expect(afterDebounceFilters.to).toBe(expectedDate);
    expect(afterDebounceFilters.from).not.toBe(initialFilters.from);
  });
});
