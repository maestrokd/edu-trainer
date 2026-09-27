import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("BibleBookshelfGame", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the guided Law round with Genesis anchored", () => {
    renderGame();

    expect(screen.getByRole("heading", { name: "Bible Bookshelf", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Shelf position 1, Genesis, correct and locked")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^book-card-/)).toHaveLength(4);
    expect(screen.getByText("1 of 5 correct")).toBeInTheDocument();
  });

  it("places a selected book through the tap and keyboard-compatible path", () => {
    renderGame();

    fireEvent.click(screen.getByRole("button", { name: "Exodus" }));
    expect(screen.getByRole("button", { name: "Exodus, selected" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Empty shelf position 2" }));

    expect(screen.getByLabelText("Shelf position 2, Exodus, correct and locked")).toBeInTheDocument();
    expect(screen.getByText("Exodus is in the right place.")).toBeInTheDocument();
    expect(screen.getByText("2 of 5 correct")).toBeInTheDocument();
  });

  it("uses the same placement behavior for a drag-end event", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Simulate drag placement" }));

    expect(screen.getByLabelText("Shelf position 2, Exodus, correct and locked")).toBeInTheDocument();
    expect(screen.getByText("2 of 5 correct")).toBeInTheDocument();
  });

  it("keeps an incorrectly placed book in the tray and announces gentle feedback", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Leviticus" }));
    fireEvent.click(screen.getByRole("button", { name: "Empty shelf position 5" }));

    expect(screen.getByTestId("book-card-leviticus")).toBeInTheDocument();
    expect(screen.getByText("Almost!")).toBeInTheDocument();
    expect(screen.getByText("Try another spot.")).toBeInTheDocument();
  });

  it("moves focus to the instructions after changing learning groups", async () => {
    renderGame();

    fireEvent.click(screen.getByRole("combobox", { name: "Choose a learning group" }));
    fireEvent.click(screen.getByRole("option", { name: "Old Testament History" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Put the books in the correct order." })).toHaveFocus();
    });
    expect(screen.getByLabelText("Shelf position 1, Joshua, correct and locked")).toBeInTheDocument();
  });
});
