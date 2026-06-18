import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StarsAdjustmentsPage } from "../pages/StarsAdjustmentsPage";
import type { ChildProfileDto, StarsBalanceDto, StarLedgerEntryDto } from "../models/dto";
import type { PageableResponse } from "@/types/api";

const mocks = vi.hoisted(() => ({
  createAdjustment: vi.fn(),
  getErrorMessage: vi.fn((_error: unknown, options: { fallbackMessage?: string; fallbackKey?: string }) => {
    return options.fallbackMessage ?? options.fallbackKey ?? "Error";
  }),
  getBalances: vi.fn(),
  getEntries: vi.fn(),
  refetchFamilyContext: vi.fn(),
  useFamilyContext: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en-US" },
    t: (_key: string, fallback?: string, params?: Record<string, unknown>) => {
      let value = fallback ?? _key;
      for (const [paramKey, paramValue] of Object.entries(params ?? {})) {
        value = value.replace(`{{${paramKey}}}`, String(paramValue));
      }
      return value;
    },
  }),
}));

vi.mock("@/contexts/InsetHeaderContext", () => ({
  useInsetHeader: vi.fn(),
}));

vi.mock("@/hooks/use-api-error-handler", () => ({
  useApiErrorHandler: () => ({
    getErrorMessage: mocks.getErrorMessage,
  }),
}));

vi.mock("../api/rewardsApi", () => ({
  starsApi: {
    createAdjustment: mocks.createAdjustment,
    getBalances: mocks.getBalances,
    getEntries: mocks.getEntries,
  },
}));

vi.mock("../components/gates/ParentFeatureGate", () => ({
  ParentFeatureGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/layout/FamilyTaskPageShell", () => ({
  FamilyTaskPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/shared/NotoEmoji", () => ({
  NotoEmoji: ({ emoji }: { emoji: string }) => <span>{emoji}</span>,
}));

vi.mock("../hooks/useFamilyContext", () => ({
  useFamilyContext: mocks.useFamilyContext,
}));

vi.mock("../hooks/useTrackFamilyTaskPageView", () => ({
  useTrackFamilyTaskPageView: vi.fn(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function buildProfile(profile: Partial<ChildProfileDto>): ChildProfileDto {
  return {
    profileUuid: profile.profileUuid ?? "profile-1",
    memberUuid: profile.memberUuid ?? "member-1",
    username: profile.username ?? "kid-one",
    firstName: profile.firstName ?? "Kid",
    lastName: profile.lastName ?? "One",
    locale: profile.locale ?? "en-US",
    displayName: profile.displayName ?? "Kid One",
    avatarEmoji: profile.avatarEmoji ?? "🧒",
    color: profile.color ?? "#60a5fa",
    active: profile.active ?? true,
  };
}

function buildEntriesPage(
  entries: StarLedgerEntryDto[] = [
    {
      uuid: "entry-1",
      occurrenceUuid: null,
      secondaryProfileUuid: "profile-1",
      deltaStars: 3,
      reason: "TASK_APPROVED",
      createdDate: "2026-06-17T12:00:00Z",
    },
  ]
): PageableResponse<StarLedgerEntryDto> {
  return {
    page: 0,
    requestedSize: 20,
    actualPageSize: entries.length,
    totalItems: entries.length,
    totalPages: 1,
    items: entries,
  };
}

function mockFamilyContext(profiles: ChildProfileDto[], loading = false) {
  mocks.useFamilyContext.mockReturnValue({
    error: null,
    family: null,
    loading,
    members: [],
    profiles,
    refetch: mocks.refetchFamilyContext,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StarsAdjustmentsPage />
    </MemoryRouter>
  );
}

describe("StarsAdjustmentsPage profile initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFamilyContext([buildProfile({ profileUuid: "profile-1", displayName: "Kid One" })]);
    mocks.getBalances.mockResolvedValue([{ secondaryProfileUuid: "profile-1", balance: 7 }]);
    mocks.getEntries.mockResolvedValue(buildEntriesPage());
  });

  it("selects the first active child profile and loads stars data for it", async () => {
    renderPage();

    await waitFor(() => {
      expect(mocks.getEntries).toHaveBeenCalledWith({
        secondaryProfileUuid: "profile-1",
        page: 0,
        size: 20,
        sort: "createdDate,desc",
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Child Profile" })).toHaveTextContent("Kid One");
    });
    expect(mocks.getBalances).toHaveBeenCalledWith({ secondaryProfileUuids: ["profile-1"] });
    expect(screen.getByText("7")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Child Profile" })).toBeEnabled();
      expect(screen.getByLabelText("Stars Amount")).toBeEnabled();
    });
  });

  it("keeps stars controls disabled while the initial selected-profile data is loading", async () => {
    const balances = createDeferred<StarsBalanceDto[]>();
    const entries = createDeferred<PageableResponse<StarLedgerEntryDto>>();
    mocks.getBalances.mockReturnValue(balances.promise);
    mocks.getEntries.mockReturnValue(entries.promise);

    renderPage();

    await waitFor(() => {
      expect(mocks.getEntries).toHaveBeenCalled();
    });

    expect(screen.getByRole("combobox", { name: "Child Profile" })).toBeDisabled();
    expect(screen.getByLabelText("Stars Amount")).toBeDisabled();
    expect(screen.getByPlaceholderText("MANUAL_BONUS_WEEKEND_HELP or MANUAL_CORRECTION")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Subtract" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add Stars" })).toBeDisabled();
  });

  it("does not load stars data when there are no active child profiles", () => {
    mockFamilyContext([]);

    renderPage();

    expect(screen.getByText("No child profiles yet.")).toBeInTheDocument();
    expect(mocks.getBalances).not.toHaveBeenCalled();
    expect(mocks.getEntries).not.toHaveBeenCalled();
  });
});
