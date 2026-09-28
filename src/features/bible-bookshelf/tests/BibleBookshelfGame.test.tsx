import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BIBLE_BOOKS_BY_LANGUAGE } from "@/features/bible-books/data/bibleBooks.registry";
import i18n from "@/i18n";

import { BibleBookshelfGame } from "../components/BibleBookshelfGame";

const scrollToMock = vi.fn();
const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

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

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
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
    scrollToMock.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalScrollTo) {
      Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
    }
  });

  it("opens on setup and starts the guided Law round", async () => {
    renderGame();

    expect(screen.getByRole("heading", { name: "Set up your bookshelf" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Bible book language" })).toHaveTextContent("English");
    expect(screen.getByRole("button", { name: /Learning groups/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Game information" })).toBeInTheDocument();
    expect(within(screen.getByRole("menu")).getByText(/Choose the Bible-book language/)).toBeInTheDocument();

    startDefaultGame();

    const anchoredSlot = screen.getByLabelText("Shelf position 1, Genesis, correct and locked");
    const bookCards = screen.getAllByTestId(/^book-card-/);
    expect(anchoredSlot).toHaveClass("min-h-36", "sm:min-h-44");
    expect(anchoredSlot).toHaveClass("border-l-sky-500", "bg-card", "text-card-foreground");
    expect(anchoredSlot).toHaveAttribute("aria-description", "Book group: The Law");
    expect(bookCards).toHaveLength(4);
    expect(bookCards[0]).toHaveClass("min-h-20", "sm:min-h-28");
    bookCards.forEach((bookCard) => {
      expect(bookCard).toHaveClass("border-l-sky-500", "bg-card", "text-card-foreground");
      expect(bookCard).toHaveAttribute("aria-description", "Book group: The Law");
    });
    expect(screen.getByTestId("bookshelf-scroll")).toHaveClass("overflow-x-auto");
    expect(screen.getByTestId("bookshelf-tray-scroll")).toHaveClass("overflow-x-auto", "sm:overflow-x-visible");
    expect(screen.getByTestId("bookshelf-tray-scroll").firstElementChild).toHaveClass(
      "bible-bookshelf-group-tray-grid"
    );
    expect(screen.getByText("1 of 5 correct")).toBeInTheDocument();
    expect(screen.getByText("1/5")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Books placed correctly: 1 of 5" })).toHaveAttribute(
      "aria-valuenow",
      "1"
    );
    expect(screen.getByRole("button", { name: "Change setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hint" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    const groupLegend = screen.getByRole("list", { name: "Book group colors" });
    expect(within(groupLegend).getAllByRole("listitem")).toHaveLength(1);
    expect(within(groupLegend).getByText("The Law")).toBeInTheDocument();
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
    const infoMenu = screen.getByRole("menu");
    expect(within(infoMenu).getByText(`${russianGenesis} through ${russianDeuteronomy}`)).toBeInTheDocument();
    expect(within(infoMenu).getByText("Русский")).toBeInTheDocument();
    expect(screen.getAllByText(`${russianGenesis} through ${russianDeuteronomy}`)).toHaveLength(1);
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
    expect(screen.getByLabelText("Місце 1, Genesis, правильно й зафіксовано")).toHaveAttribute(
      "aria-description",
      "Група книг: Закон"
    );
    expect(screen.getByRole("button", { name: "Змінити налаштування" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Кольори груп книг" })).toBeInTheDocument();
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
    expect(screen.getAllByRole("button", { name: /^Empty shelf position/ })[0]).not.toHaveClass("sm:min-h-44");
    expect(screen.getAllByTestId(/^book-card-/)[0]).not.toHaveClass("sm:min-h-28");
    expect(screen.getByTestId("book-card-genesis")).toHaveClass("border-l-sky-500");
    expect(screen.getByTestId("book-card-joshua")).toHaveClass("border-l-amber-500");
    const groupLegend = screen.getByRole("list", { name: "Book group colors" });
    expect(
      within(groupLegend)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(["The Law", "Old Testament History", "Poetry & Wisdom", "Major Prophets", "Minor Prophets"]);
    expect(within(groupLegend).queryByText("Gospels & Acts")).not.toBeInTheDocument();
  });

  it("scrolls both group-mode regions to the hinted book without motion", async () => {
    renderGame();
    startDefaultGame();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));

    await waitFor(() => expect(scrollToMock).toHaveBeenCalledTimes(2));
    expect(scrollToMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ behavior: "auto" }));
    expect(scrollToMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ behavior: "auto" }));
  });

  it("supports the 27-book New Testament configuration", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: /Whole testament/ }));
    fireEvent.click(screen.getByRole("button", { name: /^New Testament/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));

    expect(screen.getAllByRole("button", { name: /^Empty shelf position/ })).toHaveLength(27);
    expect(screen.getAllByTestId(/^book-card-/)).toHaveLength(27);
    expect(screen.getByText("0 of 27 correct")).toBeInTheDocument();
    const groupLegend = screen.getByRole("list", { name: "Book group colors" });
    expect(within(groupLegend).getAllByRole("listitem")).toHaveLength(3);
    expect(within(groupLegend).getByText("Gospels & Acts")).toBeInTheDocument();
    expect(within(groupLegend).getByText("Paul’s Letters")).toBeInTheDocument();
    expect(within(groupLegend).getByText("General Letters & Revelation")).toBeInTheDocument();
  });

  it("places books through both tap and drag paths", () => {
    renderGame();
    startDefaultGame();

    fireEvent.click(screen.getByRole("button", { name: "Exodus" }));
    expect(screen.getByRole("button", { name: "Exodus, selected" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Empty shelf position 2" }));
    const placedExodus = screen.getByLabelText("Shelf position 2, Exodus, correct and locked");
    expect(placedExodus).toHaveClass("border-l-sky-500");
    expect(placedExodus).toHaveAttribute("aria-description", "Book group: The Law");

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
