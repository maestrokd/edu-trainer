import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
// the components link via react-router-dom — the router context must come from the same package
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TimesTableKnightPage } from "../routes/TimesTableKnightPage";
import { TimesTableKnightShell } from "../components/TimesTableKnightShell";

function wrap(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/times-table-knight"]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe("TimesTableKnightPage", () => {
  it("shows the premium gate to guests (gated feature, §11)", () => {
    wrap(<TimesTableKnightPage />);
    expect(screen.getByText("timesTableKnight.gate.premiumTitle")).toBeInTheDocument();
    expect(screen.getByText("timesTableKnight.gate.loginCta")).toBeInTheDocument();
  });
});

describe("TimesTableKnightShell", () => {
  it("renders the setup screen: mode, level, hero, options, start", () => {
    wrap(<TimesTableKnightShell />);
    expect(screen.getByText("timesTableKnight.mode.practice")).toBeInTheDocument();
    expect(screen.getByText("timesTableKnight.mode.adventure")).toBeInTheDocument();
    expect(screen.getAllByRole("radio", { name: "timesTableKnight.setup.levelLabel" })).toHaveLength(15);
    expect(screen.getByText("timesTableKnight.hero.dame")).toBeInTheDocument();
    expect(screen.getByText("timesTableKnight.hero.sir")).toBeInTheDocument();
    expect(screen.getByText(/timesTableKnight\.setup\.start/)).toBeInTheDocument();
  });

  it("switching to Adventure shows the world map with only stage 1 unlocked", () => {
    wrap(<TimesTableKnightShell />);
    fireEvent.click(screen.getByText("timesTableKnight.mode.adventure"));
    const stage1 = screen.getByRole("radio", { name: /worldMap\.stage.*starsAria/ });
    expect(stage1).toBeEnabled();
    const locked = screen.getAllByRole("radio", { name: /worldMap\.locked/ });
    expect(locked).toHaveLength(14);
  });
});
