import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import type { ChildProfileDto } from "../models/dto";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: unknown }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: unknown }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: unknown }) => <>{children}</>,
}));

function buildProfiles(): ChildProfileDto[] {
  return [
    {
      profileUuid: "profile-1",
      memberUuid: "member-1",
      username: "kid-one",
      firstName: "Kid",
      lastName: "One",
      locale: "en",
      displayName: "Kid One",
      avatarEmoji: "🧒",
      color: "#60a5fa",
      active: true,
    },
    {
      profileUuid: "profile-2",
      memberUuid: "member-2",
      username: "kid-two",
      firstName: "Kid",
      lastName: "Two",
      locale: "en",
      displayName: "Kid Two",
      avatarEmoji: "👧",
      color: "#f59e0b",
      active: true,
    },
  ];
}

describe("DashboardHeader profile filter", () => {
  it("selects a kid profile from all-kids mode", () => {
    const onProfileFilterChange = vi.fn();

    render(
      <DashboardHeader
        isToday
        activeProfiles={buildProfiles()}
        profileFilter={[]}
        showProfileFilter
        onProfileFilterChange={onProfileFilterChange}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        onToday={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /filter kids/i }));
    expect(screen.getByRole("button", { name: "All kids" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /Kid One/i }));
    expect(onProfileFilterChange).toHaveBeenCalledWith(["profile-1"]);
  });

  it("returns to all-kids mode when a selected kid is toggled off", () => {
    const onProfileFilterChange = vi.fn();

    render(
      <DashboardHeader
        isToday
        activeProfiles={buildProfiles()}
        profileFilter={["profile-1"]}
        showProfileFilter
        onProfileFilterChange={onProfileFilterChange}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        onToday={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /filter kids/i }));
    fireEvent.click(screen.getByRole("button", { name: /Kid One/i }));
    expect(onProfileFilterChange).toHaveBeenCalledWith([]);
  });
});
