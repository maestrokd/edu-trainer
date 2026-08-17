import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { RabbitSettingsMenu } from "../components/RabbitSettingsMenu";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "rabbitGame.aria.menu": "Open game menu",
        "rabbitGame.menu.title": "Game menu",
        "rabbitGame.menu.resume": "Resume game",
        "rabbitGame.menu.newGame": "New game",
        "rabbitGame.menu.changeSettings": "Change settings",
        "menu.mainMenuLabel": "Main Menu",
      })[key] ?? key,
  }),
}));
vi.mock("@/components/theme/mode-toggle", () => ({ ModeToggle: () => <span>Theme</span> }));
vi.mock("@/components/lang/LanguageSelector", () => ({
  default: () => <span>Language</span>,
  LanguageSelectorMode: { ICON: "ICON" },
}));

function MenuHarness({ onRestart, onChangeSettings }: { onRestart: () => void; onChangeSettings: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <RabbitSettingsMenu
      phase="playing"
      open={open}
      onOpenChange={setOpen}
      onRestart={onRestart}
      onChangeSettings={onChangeSettings}
    />
  );
}

describe("RabbitSettingsMenu", () => {
  it("offers resume, restart, settings, and main-menu actions during a run", () => {
    const onRestart = vi.fn();
    const onChangeSettings = vi.fn();
    render(
      <MemoryRouter>
        <MenuHarness onRestart={onRestart} onChangeSettings={onChangeSettings} />
      </MemoryRouter>
    );

    expect(screen.getByRole("menuitem", { name: "Resume game" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Main Menu" })).toHaveAttribute("href", "/");

    fireEvent.click(screen.getByRole("menuitem", { name: "New game" }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("returns to setup from the active-game menu", () => {
    const onChangeSettings = vi.fn();
    render(
      <MemoryRouter>
        <MenuHarness onRestart={vi.fn()} onChangeSettings={onChangeSettings} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Change settings" }));
    expect(onChangeSettings).toHaveBeenCalledOnce();
  });
});
