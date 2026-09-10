import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCoachCharacter } from "../components/taskCoach/TaskCoachCharacter";
import { characterActionAtPoint, getTaskCoachCharacter } from "../components/taskCoach/taskCoachCharacters";
const mocks = vi.hoisted(() => ({ input: { value: 0 }, play: vi.fn(), pause: vi.fn(), parameters: vi.fn() }));
vi.mock("@rive-app/react-canvas", () => {
  const rive = { play: mocks.play, pause: mocks.pause };
  const RiveComponent = ({ className }: { className: string }) => (
    <canvas data-testid="rive-cat" className={className} />
  );
  return {
    Alignment: { Center: "center" },
    Fit: { Contain: "contain" },
    Layout: class {},
    RuntimeLoader: { setWasmUrl: vi.fn(), setWasmFallbackUrl: vi.fn() },
    useRive: (parameters: unknown) => {
      mocks.parameters(parameters);
      return { rive, RiveComponent };
    },
    useStateMachineInput: () => mocks.input,
  };
});
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));
const advance = (seconds = 0.016) => act(() => mocks.parameters.mock.calls.at(-1)![0].onAdvance({ data: seconds }));
const transition = (...names: string[]) =>
  act(() => mocks.parameters.mock.calls.at(-1)![0].onStateChange({ data: names }));
const ready = () => {
  advance();
  act(() => vi.advanceTimersByTime(20));
};
describe("TaskCoachCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.input.value = 0;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it("reveals the black cat after a native frame and retains pointer motion during thinking", () => {
    const { container, rerender } = render(<TaskCoachCharacter state="IDLE" characterId="simple-cat" />);
    expect(container.querySelector("img")).toHaveClass("opacity-100");
    expect(mocks.parameters).toHaveBeenCalledWith(
      expect.objectContaining({
        artboard: "Cat",
        stateMachines: "State Machine 1",
        autoplay: false,
        shouldDisableRiveListeners: false,
        isTouchScrollEnabled: true,
        dispatchPointerExit: true,
      })
    );
    ready();
    expect(screen.getByTestId("rive-cat")).toHaveClass("pointer-events-auto", "opacity-100");
    rerender(<TaskCoachCharacter state="THINKING" characterId="simple-cat" />);
    fireEvent.mouseMove(screen.getByTestId("rive-cat"));
    expect(container).toHaveTextContent("Thinking");
    expect(mocks.input.value).toBe(0);
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });
  it("greets once and preserves the instance and action progress across hide/restore", () => {
    const { rerender } = render(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" />);
    ready();
    expect(mocks.input.value).toBe(1);
    const canvas = screen.getByTestId("rive-cat");
    transition("hi");
    transition("idle");
    expect(mocks.input.value).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(3);
    rerender(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" visible={false} />);
    advance(20);
    expect(mocks.input.value).toBe(2);
    expect(mocks.pause).toHaveBeenCalledWith("State Machine 1");
    rerender(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" />);
    expect(screen.getByTestId("rive-cat")).toBe(canvas);
    expect(mocks.input.value).toBe(2);
    advance(10);
    expect(mocks.input.value).toBe(0);
    rerender(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" visible={false} />);
    rerender(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" />);
    expect(mocks.input.value).toBe(0);
  });
  it("separates native and labelled actions from advice and gives celebration priority", () => {
    const activate = vi.fn();
    const { rerender } = render(
      <TaskCoachCharacter state="IDLE" characterId="cute-character-cat" onActivate={activate} />
    );
    ready();
    const button = screen.getByRole("button", { name: "Ask coach" });
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 400 } as DOMRect);
    fireEvent.click(screen.getByTestId("rive-cat"), { detail: 1, clientX: 326, clientY: 187 });
    expect(mocks.input.value).toBe(2);
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Wave" }));
    expect(mocks.input.value).toBe(1);
    fireEvent.click(button, { detail: 1, clientX: 150, clientY: 200 });
    expect(activate).toHaveBeenCalledTimes(1);
    fireEvent.click(button, { detail: 0 });
    expect(activate).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    rerender(<TaskCoachCharacter state="SUCCESS" characterId="cute-character-cat" onActivate={activate} />);
    expect(mocks.input.value).toBe(1);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    fireEvent.click(screen.getByTestId("rive-cat"), { detail: 1, clientX: 326, clientY: 187 });
    expect(mocks.input.value).toBe(1);
    expect(activate).toHaveBeenCalledTimes(2);
    rerender(<TaskCoachCharacter state="THINKING" characterId="cute-character-cat" />);
    expect(mocks.input.value).toBe(0);
    expect(screen.getByRole("button", { name: "Wave" })).toBeDisabled();
  });
  it("bounds repeated actions and requires a reaction before accepting idle as completion", () => {
    render(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" />);
    ready();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    transition("idle");
    expect(mocks.input.value).toBe(2);
    advance(7);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(6);
    expect(mocks.input.value).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    transition("fish");
    transition("idle");
    expect(mocks.input.value).toBe(0);
  });
  it("keeps matching posters on load failure and reduced motion without an entrance", () => {
    const { container, unmount } = render(<TaskCoachCharacter state="IDLE" characterId="simple-cat" />);
    act(() => mocks.parameters.mock.calls.at(-1)![0].onLoadError());
    expect(screen.queryByTestId("rive-cat")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toHaveClass("opacity-100");
    unmount();
    mocks.play.mockClear();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const reduced = render(<TaskCoachCharacter state="SUCCESS" characterId="cute-character-cat" />);
    ready();
    expect(reduced.container.querySelector("img")).toHaveClass("opacity-100");
    expect(reduced.container).toHaveTextContent("Well done!");
    expect(mocks.play).not.toHaveBeenCalled();
  });
  it("maps native buttons through the centered contain layout", () => {
    const cat = getTaskCoachCharacter("cute-character-cat");
    expect(characterActionAtPoint(cat, { left: 10, top: 20, width: 600, height: 400 }, 436, 207)).toBe("play");
    expect(characterActionAtPoint(cat, { left: 10, top: 20, width: 600, height: 400 }, 20, 207)).toBeUndefined();
  });
});
