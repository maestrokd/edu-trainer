import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCoachWidget } from "../components/taskCoach/TaskCoachWidget";
import { taskCoachApi } from "../api/taskCoachApi";
import { TaskCoachMascotCue, TaskCoachState } from "../models/enums";
import type { ChildProfileDto, TaskCoachAdviceDto } from "../models/dto";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock("../api/taskCoachApi", () => ({
  taskCoachApi: { getAdvice: vi.fn(), synthesizeSpeech: vi.fn() },
}));
vi.mock("@/components/english-coach/AudioPlayerBubble", () => ({ default: () => <div>audio player</div> }));
vi.mock("../components/taskCoach/TaskCoachCharacterLoader", () => ({
  TaskCoachCharacterLoader: ({ state }: { state: string }) => <div data-testid="task-coach-character">{state}</div>,
}));

const child: ChildProfileDto = {
  profileUuid: "child-1",
  memberUuid: "member-1",
  username: "kid",
  firstName: "Kid",
  lastName: null,
  locale: "en-US",
  displayName: "Kid",
  avatarEmoji: "🧒",
  color: null,
  active: true,
};

const advice: TaskCoachAdviceDto = {
  profileUuid: "child-1",
  responseLocale: "en-US",
  state: TaskCoachState.RECOMMENDATION,
  recommendedTaskUuids: ["task-1"],
  displayText: "Start with your book.",
  speechText: "Start with your book.",
  mascotCue: TaskCoachMascotCue.ENCOURAGING,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("TaskCoachWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:task-coach-audio"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the sleeping character and settings visible away from today without requesting advice", () => {
    render(
      <TaskCoachWidget
        isToday={false}
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    expect(screen.getByTestId("task-coach-character")).toHaveTextContent("SLEEPING");
    expect(screen.getByRole("button", { name: "Task Coach settings" })).toBeVisible();
    expect(taskCoachApi.getAdvice).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Task Coach is available while viewing today’s tasks." }));
    expect(screen.getByText("Task Coach is available while viewing today’s tasks.")).toBeVisible();
  });

  it("auto-loads once and lets the response and child selector be collapsed and reopened", async () => {
    const onRecommendation = vi.fn();
    vi.mocked(taskCoachApi.getAdvice).mockResolvedValueOnce(advice);
    vi.mocked(taskCoachApi.synthesizeSpeech).mockImplementation(() => new Promise(() => undefined));

    render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={onRecommendation}
      />
    );

    expect(await screen.findByText("Start with your book.")).toBeInTheDocument();
    expect(screen.getByText("Preparing voice...")).toBeInTheDocument();
    expect(screen.getByText("Voice audio is AI-generated.")).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Kid/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose or change child" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Hide latest response" }));
    expect(screen.queryByText("Start with your book.")).not.toBeInTheDocument();
    expect(screen.queryByText("Preparing voice...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show latest response" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Show latest response" }));
    expect(screen.getByText("Start with your book.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Choose or change child" }));
    expect(screen.getByRole("radio", { name: /Kid/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Start with your book.")).not.toBeInTheDocument();
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onRecommendation).toHaveBeenCalledWith("task-1"));
  });

  it("keeps localized advice visible when speech generation fails", async () => {
    vi.mocked(taskCoachApi.getAdvice).mockResolvedValueOnce(advice);
    vi.mocked(taskCoachApi.synthesizeSpeech).mockRejectedValueOnce(new Error("tts unavailable"));

    render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    expect(await screen.findByText("Start with your book.")).toBeInTheDocument();
    expect(await screen.findByText("Voice playback is unavailable.")).toBeInTheDocument();
  });

  it("keeps generated audio reachable after the response panel is hidden", async () => {
    vi.mocked(taskCoachApi.getAdvice).mockResolvedValueOnce(advice);
    vi.mocked(taskCoachApi.synthesizeSpeech).mockResolvedValueOnce(new Blob(["audio"], { type: "audio/mpeg" }));

    render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    expect(await screen.findByText("audio player")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Hide latest response" }));
    expect(screen.queryByText("audio player")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show latest response" }));
    expect(screen.getByText("audio player")).toBeVisible();
  });

  it("lets children be changed after advice and ignores a late response for the previous child", async () => {
    localStorage.setItem("family-task-coach:preferences:autoplay", "false");
    const secondChild = { ...child, profileUuid: "child-2", memberUuid: "member-2", displayName: "Second Kid" };
    const firstRequest = deferred<TaskCoachAdviceDto>();
    const secondRequest = deferred<TaskCoachAdviceDto>();
    vi.mocked(taskCoachApi.getAdvice)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child, secondChild]}
        profileFilter={["child-1", "child-2"]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("radio", { name: /^Kid$/ }));
    await waitFor(() => expect(taskCoachApi.getAdvice).toHaveBeenCalledWith("child-1"));
    expect(screen.queryByRole("radio", { name: /Second Kid/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Choose or change child" }));
    fireEvent.click(screen.getByRole("radio", { name: /Second Kid/ }));
    await waitFor(() => expect(taskCoachApi.getAdvice).toHaveBeenCalledWith("child-2"));
    expect(screen.queryByRole("radio", { name: /Second Kid/ })).not.toBeInTheDocument();

    await act(async () => {
      secondRequest.resolve({ ...advice, profileUuid: "child-2", displayText: "Second child advice." });
    });
    expect(await screen.findByText("Second child advice.")).toBeVisible();

    await act(async () => {
      firstRequest.resolve({ ...advice, displayText: "Stale first child advice." });
    });
    expect(screen.queryByText("Stale first child advice.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose or change child" }));
    expect(screen.getByRole("radio", { name: /Second Kid/ })).toHaveAttribute("aria-checked", "true");
  });

  it("can disable automatic calls while preserving explicit cat refresh", async () => {
    localStorage.setItem("family-task-coach:preferences:auto-request", "false");
    localStorage.setItem("family-task-coach:preferences:autoplay", "false");
    vi.mocked(taskCoachApi.getAdvice).mockResolvedValueOnce(advice);

    render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose or change child" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: /Kid/ })).toHaveAttribute("aria-checked", "true"));
    expect(taskCoachApi.getAdvice).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Task Coach settings" }));
    const autoRequestSwitch = screen.getByRole("switch", { name: "Automatically get advice" });
    fireEvent.click(autoRequestSwitch);
    expect(taskCoachApi.getAdvice).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Ask the cat for fresh advice" }));
    await waitFor(() => expect(taskCoachApi.getAdvice).toHaveBeenCalledOnce());
  });

  it("shows required character attribution in settings", () => {
    localStorage.setItem("family-task-coach:preferences:auto-request", "false");
    render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Task Coach settings" }));
    expect(screen.getByText("Created by kikkojinji1")).toBeVisible();
    expect(screen.getByRole("link", { name: "Original asset from the Rive Marketplace" })).toHaveAttribute(
      "href",
      "https://rive.app/marketplace/27883-52700-cute-character-cat/"
    );
    expect(
      screen.getByRole("link", {
        name: "Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)",
      })
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  });

  it("turns a successful task event into a transient character celebration", () => {
    vi.useFakeTimers();
    localStorage.setItem("family-task-coach:preferences:auto-request", "false");
    const { rerender } = render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    rerender(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        successEvent={{ id: 1, profileUuid: "child-1", starsAwarded: 2 }}
        onRecommendation={vi.fn()}
      />
    );
    expect(screen.getByTestId("task-coach-character")).toHaveTextContent("SUCCESS");

    act(() => vi.advanceTimersByTime(2_500));
    expect(screen.getByTestId("task-coach-character")).toHaveTextContent("IDLE");
  });
});
