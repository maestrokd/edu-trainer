import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTaskCoachController, type TaskCoachWidgetProps } from "../components/taskCoach/useTaskCoachController";
import { taskCoachApi } from "../api/taskCoachApi";
import type { ChildProfileDto, TaskCoachAdviceDto } from "../models/dto";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));
vi.mock("../api/taskCoachApi", () => ({ taskCoachApi: { getAdvice: vi.fn(), synthesizeSpeech: vi.fn() } }));
const child: ChildProfileDto = {
  profileUuid: "one",
  memberUuid: "m1",
  username: "one",
  firstName: "One",
  lastName: null,
  locale: "en",
  displayName: "One",
  avatarEmoji: "🦊",
  color: null,
  active: true,
};
const advice: TaskCoachAdviceDto = {
  profileUuid: "one",
  responseLocale: "en",
  state: "RECOMMENDATION",
  mascotCue: "ENCOURAGING",
  recommendedTaskUuids: ["task"],
  appreciationText: "Well done",
  planItems: [{ taskUuid: "task", title: "Read", guidanceText: "Read a page" }],
  displayText: "Read a page",
  speechText: "Read a page",
};
const props = (): TaskCoachWidgetProps => ({
  isToday: true,
  activeProfiles: [child],
  profileFilter: [],
  isSecondary: false,
  ownProfileUuid: null,
  onRecommendation: vi.fn(),
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem("family-task-coach:preferences:autoplay", "false");
  localStorage.setItem("family-task-coach:preferences:auto-request", "false");
  localStorage.setItem("family-task-coach:preferences:completion-refresh", "MANUAL");
  vi.mocked(taskCoachApi.getAdvice).mockResolvedValue(advice);
});
afterEach(() => vi.useRealTimers());

describe("Task Coach freshness and timing", () => {
  it("toggles current advice without a request and refreshes after local completion", async () => {
    const initial = props();
    const { result, rerender } = renderHook(useTaskCoachController, { initialProps: initial });
    await act(async () => result.current.handleCharacterClick());
    expect(result.current.responseOpen).toBe(true);
    act(() => result.current.handleCharacterClick());
    expect(result.current.responseOpen).toBe(false);
    act(() => result.current.handleCharacterClick());
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1);
    // A failed operation emits no success event: ordinary rerenders remain current.
    rerender({ ...initial, profileFilter: ["one"] });
    expect(result.current.stale).toBe(false);
    rerender({ ...initial, successEvent: { id: 1, profileUuid: "one", starsAwarded: 2 } });
    expect(result.current.stale).toBe(true);
    await act(async () => result.current.handleCharacterClick());
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.stale).toBe(false);
  });

  it("does not invalidate or celebrate a different child's completion", async () => {
    const initial = props();
    const { result, rerender } = renderHook(useTaskCoachController, { initialProps: initial });
    await act(async () => result.current.handleCharacterClick());
    rerender({ ...initial, successEvent: { id: 1, profileUuid: "two", starsAwarded: 2 } });
    expect(result.current.characterState).toBe("IDLE");
    expect(result.current.stale).toBe(false);
    act(() => result.current.handleCharacterClick());
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1);
  });

  it("keeps an in-flight response stale when completion changes its snapshot, without duplicate taps", async () => {
    const pending = deferred<TaskCoachAdviceDto>();
    vi.mocked(taskCoachApi.getAdvice).mockReturnValueOnce(pending.promise);
    const initial = props();
    const { result, rerender } = renderHook(useTaskCoachController, { initialProps: initial });
    act(() => result.current.handleCharacterClick());
    act(() => result.current.handleCharacterClick());
    rerender({ ...initial, successEvent: { id: 1, profileUuid: "one", starsAwarded: 2 } });
    await act(async () => pending.resolve(advice));
    expect(result.current.advice).toBeNull();
    expect(result.current.characterState).toBe("SUCCESS");
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.stale).toBe(true);
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1);
    await act(async () => result.current.handleCharacterClick());
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(2);
    expect(result.current.stale).toBe(false);
  });

  it("coalesces AUTO completions, preserves the old plan during celebration, and catches up once", async () => {
    localStorage.setItem("family-task-coach:preferences:completion-refresh", "AUTO");
    const initial = props();
    const { result, rerender } = renderHook(useTaskCoachController, { initialProps: initial });
    await act(async () => result.current.handleCharacterClick());
    const pending = deferred<TaskCoachAdviceDto>();
    vi.mocked(taskCoachApi.getAdvice).mockReturnValueOnce(pending.promise);
    rerender({ ...initial, successEvent: { id: 1, profileUuid: "one", starsAwarded: 2 } });
    act(() => vi.advanceTimersByTime(1000));
    rerender({ ...initial, successEvent: { id: 2, profileUuid: "one", starsAwarded: 2 } });
    await act(async () => pending.resolve({ ...advice, appreciationText: "Updated" }));
    expect(result.current.advice?.appreciationText).toBe("Well done");
    expect(result.current.characterState).toBe("SUCCESS");
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(1500));
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(3);
    expect(result.current.characterState).toBe("IDLE");
    expect(result.current.stale).toBe(false);
  });

  it("handles batched completions even when the final event belongs to another child", async () => {
    const initial = props();
    const { result, rerender } = renderHook(useTaskCoachController, { initialProps: initial });
    await act(async () => result.current.handleCharacterClick());
    rerender({
      ...initial,
      successEvent: { id: 2, profileUuid: "two", starsAwarded: 2, revisions: { one: 1, two: 1 } },
    });
    expect(result.current.stale).toBe(true);
    expect(result.current.characterState).toBe("SUCCESS");
  });

  it("preserves settled advice and allows retry after a refresh failure", async () => {
    const { result } = renderHook(useTaskCoachController, { initialProps: props() });
    await act(async () => result.current.handleCharacterClick());
    vi.mocked(taskCoachApi.getAdvice).mockRejectedValueOnce(new Error("unavailable"));
    await act(async () => result.current.requestAdvice("one"));
    expect(result.current.advice).toEqual(advice);
    expect(result.current.error).toBe(true);
    expect(result.current.stale).toBe(true);
    await act(async () => result.current.handleCharacterClick());
    expect(result.current.error).toBe(false);
    expect(result.current.stale).toBe(false);
  });
  it("honors autoplay being disabled while advice is still pending", async () => {
    localStorage.setItem("family-task-coach:preferences:autoplay", "true");
    const pending = deferred<TaskCoachAdviceDto>();
    vi.mocked(taskCoachApi.getAdvice).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(useTaskCoachController, { initialProps: props() });
    act(() => result.current.handleCharacterClick());
    act(() => result.current.handleAutoplayChange(false));
    await act(async () => pending.resolve(advice));
    expect(result.current.advice).toEqual(advice);
    expect(taskCoachApi.synthesizeSpeech).not.toHaveBeenCalled();
  });
});
