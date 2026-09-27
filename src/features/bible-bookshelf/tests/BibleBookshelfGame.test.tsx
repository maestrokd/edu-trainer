import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BIBLE_BOOKS_BY_LANGUAGE } from "@/features/bible-books/data/bibleBooks.registry";
import i18n from "@/i18n";

import { BibleBookshelfGame } from "../components/BibleBookshelfGame";

vi.mock("@dnd-kit/react", () => ({
  DragDropProvider: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd: (event: { canceled: boolean; operation: { source: { id: string }; target: { id: string } } }) => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: { source: { id: "book:exodus" }, target: { id: "slot:1" } },
          })
        }
      >
        Simulate drag placement
      </button>
      {children}
    </>
  ),
  useDraggable: () => ({ ref: vi.fn(), isDragging: false }),
  useDroppable: () => ({ ref: vi.fn(), isDropTarget: false }),
}));

function renderGame() {
  render(
    <MemoryRouter>
      <BibleBookshelfGame />
    </MemoryRouter>
  );
}

function startDefaultGame() {
  fireEvent.click(screen.getByRole("button", { name: "Start building" }));
}

describe("BibleBookshelfGame", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("opens on setup and starts the guided Law round", async () => {
    renderGame();

    expect(screen.getByRole("heading", { name: "Set up your bookshelf" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Bible book language" })).toHaveTextContent("English");
    expect(screen.getByRole("button", { name: /Learning groups/ })).toHaveAttribute("aria-pressed", "true");

    startDefaultGame();

    expect(screen.getByLabelText("Shelf position 1, Genesis, correct and locked")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^book-card-/)).toHaveLength(4);
    expect(screen.getByText("1 of 5 correct")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Put the books in the correct order." })).toHaveFocus();
    });
  });

  it("keeps Bible language local while application copy follows the global locale", async () => {
    renderGame();
    const changeLanguageSpy = vi.spyOn(i18n, "changeLanguage");
    const languageSelect = screen.getByRole("combobox", { name: "Bible book language" });

    fireEvent.keyDown(languageSelect, { key: "р" });
    await waitFor(() => expect(languageSelect).toHaveTextContent("Русский"));
    expect(changeLanguageSpy).not.toHaveBeenCalled();
    expect(i18n.resolvedLanguage).toBe("en");

    startDefaultGame();
    const russianGenesis = BIBLE_BOOKS_BY_LANGUAGE.ru.find((book) => book.id === "genesis")?.name ?? "";
    const russianDeuteronomy = BIBLE_BOOKS_BY_LANGUAGE.ru.find((book) => book.id === "deuteronomy")?.name ?? "";
    expect(screen.getByLabelText(`Shelf position 1, ${russianGenesis}, correct and locked`)).toBeInTheDocument();
    expect(screen.getAllByText(`${russianGenesis} through ${russianDeuteronomy}`)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Change setup" })).toBeInTheDocument();

    changeLanguageSpy.mockRestore();
  });

  it("does not replace the local book language when the application locale changes during play", async () => {
    renderGame();
    startDefaultGame();

    await act(async () => {
      await i18n.changeLanguage("uk");
    });

    expect(screen.getByLabelText("Місце 1, Genesis, правильно й зафіксовано")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Змінити налаштування" })).toBeInTheDocument();
  });

  it("renders all Old Testament slots and cards in horizontally scrollable regions", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: /Whole testament/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));

    expect(screen.getAllByRole("button", { name: /^Empty shelf position/ })).toHaveLength(39);
    expect(screen.getAllByTestId(/^book-card-/)).toHaveLength(39);
    expect(screen.getByText("0 of 39 correct")).toBeInTheDocument();
    expect(screen.getByTestId("bookshelf-scroll")).toHaveClass("overflow-x-auto");
    expect(screen.getByTestId("bookshelf-tray-scroll")).toHaveClass("overflow-x-auto");
    expect(screen.getByTestId("bookshelf-tray-scroll").firstElementChild).toHaveClass("bible-bookshelf-full-tray-grid");
  });

  it("supports the 27-book New Testament configuration", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: /Whole testament/ }));
    fireEvent.click(screen.getByRole("button", { name: /^New Testament/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));

    expect(screen.getAllByRole("button", { name: /^Empty shelf position/ })).toHaveLength(27);
    expect(screen.getAllByTestId(/^book-card-/)).toHaveLength(27);
    expect(screen.getByText("0 of 27 correct")).toBeInTheDocument();
  });

  it("places books through both tap and drag paths", () => {
    renderGame();
    startDefaultGame();

    fireEvent.click(screen.getByRole("button", { name: "Exodus" }));
    expect(screen.getByRole("button", { name: "Exodus, selected" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Empty shelf position 2" }));
    expect(screen.getByLabelText("Shelf position 2, Exodus, correct and locked")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate drag placement" }));
    expect(screen.getByLabelText("Shelf position 2, Exodus, correct and locked")).toBeInTheDocument();
  });

  it("returns to setup immediately without progress and confirms after progress", async () => {
    renderGame();
    startDefaultGame();
    fireEvent.click(screen.getByRole("button", { name: "Change setup" }));
    expect(screen.getByRole("heading", { name: "Set up your bookshelf" })).toBeInTheDocument();

    startDefaultGame();
    fireEvent.click(screen.getByRole("button", { name: "Exodus" }));
    fireEvent.click(screen.getByRole("button", { name: "Empty shelf position 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Change setup" }));

    expect(screen.getByRole("dialog", { name: "Change setup?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep playing" }));
    expect(screen.queryByRole("dialog", { name: "Change setup?" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change setup" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave round" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Set up your bookshelf" })).toHaveFocus());
  });
});
