import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  TaskCoachCharacterLoader: ({ state, characterId }: { state: string; characterId: string }) => (
    <div data-testid="task-coach-character" data-character-id={characterId}>
      {state}
    </div>
  ),
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
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
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
    expect(screen.getByTestId("task-coach-character")).toHaveAttribute("data-character-id", "simple-cat");
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

  it("shows a long child picker as a bounded vertical list and closes it after selection", () => {
    localStorage.setItem("family-task-coach:preferences:auto-request", "false");
    const children = Array.from({ length: 12 }, (_, index) => ({
      ...child,
      profileUuid: `child-${index + 1}`,
      memberUuid: `member-${index + 1}`,
      displayName: `Kid ${index + 1}`,
    }));

    render(
      <TaskCoachWidget
        isToday
        activeProfiles={children}
        profileFilter={children.map((profile) => profile.profileUuid)}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
      />
    );

    const selector = screen.getByRole("radiogroup", { name: "Choose a child for Task Coach" });
    const choices = within(selector).getAllByRole("radio");
    expect(choices).toHaveLength(12);
    expect(choices[0]).toHaveClass("w-full", "justify-start");
    expect(choices[0].parentElement).toHaveClass("max-h-[min(18rem,40vh)]", "overflow-y-auto", "overscroll-contain");

    fireEvent.click(within(selector).getByRole("radio", { name: /Kid 12/ }));
    expect(screen.queryByRole("radiogroup", { name: "Choose a child for Task Coach" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose or change child" })).toHaveTextContent("🧒");
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

  it("switches characters without resetting or re-requesting advice and shows matching attribution", async () => {
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

    fireEvent.click(await screen.findByRole("button", { name: "Ask the cat for fresh advice" }));
    expect(await screen.findByText("Start with your book.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Task Coach settings" }));
    expect(screen.getByRole("combobox", { name: "Character" })).toHaveTextContent("Simple Cat (transparent)");
    expect(screen.getByText("Created by nvr")).toBeVisible();
    expect(screen.getByText("Remix of Cat following the mouse by Pedro Alpera")).toBeVisible();
    expect(screen.getByRole("link", { name: "Character listing on the Rive Marketplace" })).toHaveAttribute(
      "href",
      "https://rive.app/marketplace/8999-17412-cat-simple-edit/"
    );
    expect(screen.getByRole("link", { name: "Original character source" })).toHaveAttribute(
      "href",
      "https://rive.app/marketplace/3920-8202-cat-following-the-mouse/"
    );
    expect(
      screen.getByRole("link", {
        name: "Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)",
      })
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");

    fireEvent.click(screen.getByRole("combobox", { name: "Character" }));
    fireEvent.click(await screen.findByRole("option", { name: "Cute Character Cat" }));

    expect(screen.getByTestId("task-coach-character")).toHaveAttribute("data-character-id", "cute-character-cat");
    expect(localStorage.getItem("family-task-coach:preferences:character")).toBe("cute-character-cat");
    expect(screen.getByText("Created by kikkojinji1")).toBeVisible();
    expect(screen.queryByText("Remix of Cat following the mouse by Pedro Alpera")).not.toBeInTheDocument();
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Show latest response" }));
    expect(screen.getByText("Start with your book.")).toBeVisible();
  });

  it("minimizes to a restore button, preserves settled advice, and defaults to visible after remount", async () => {
    localStorage.setItem("family-task-coach:preferences:auto-request", "false");
    localStorage.setItem("family-task-coach:preferences:autoplay", "false");
    const onVisibilityChange = vi.fn();
    vi.mocked(taskCoachApi.getAdvice).mockResolvedValue(advice);
    const { unmount } = render(
      <TaskCoachWidget
        isToday
        activeProfiles={[child]}
        profileFilter={[]}
        isSecondary={false}
        ownProfileUuid={null}
        onRecommendation={vi.fn()}
        onVisibilityChange={onVisibilityChange}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "Ask the cat for fresh advice" }));
    expect(await screen.findByText("Start with your book.")).toBeVisible();

    const actionRail = document.querySelector('[data-slot="task-coach-actions"]');
    expect(actionRail).toHaveClass("bottom-0", "right-0", "flex-col");
    expect(
      within(actionRail as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Hide latest response", "Choose or change child", "Task Coach settings", "Hide Task Coach"]);
    expect(document.querySelectorAll('[data-slot="task-coach-actions"]')).toHaveLength(1);

    const visibilityToggle = screen.getByRole("button", { name: "Hide Task Coach" });
    fireEvent.click(visibilityToggle);
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByTestId("task-coach-character")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Task Coach settings" })).not.toBeInTheDocument();
    const restoreToggle = screen.getByRole("button", { name: "Show Task Coach" });
    expect(restoreToggle).toBeVisible();
    expect(restoreToggle).toBe(visibilityToggle);
    expect(document.querySelector('[data-slot="task-coach-actions"]')).toBe(actionRail);
    expect(within(actionRail as HTMLElement).getAllByRole("button")).toEqual([restoreToggle]);

    fireEvent.click(restoreToggle);
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByTestId("task-coach-character")).toBeVisible();
    expect(screen.queryByText("Start with your book.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show latest response" }));
    expect(screen.getByText("Start with your book.")).toBeVisible();
    expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Hide Task Coach" }));
    unmount();
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
    expect(screen.getByTestId("task-coach-character")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Show Task Coach" })).not.toBeInTheDocument();
  });

  it("discards in-flight advice while hidden and retries only after the coach is restored", async () => {
    localStorage.setItem("family-task-coach:preferences:autoplay", "false");
    const firstRequest = deferred<TaskCoachAdviceDto>();
    const retryRequest = deferred<TaskCoachAdviceDto>();
    vi.mocked(taskCoachApi.getAdvice)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(retryRequest.promise);

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

    await waitFor(() => expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Hide Task Coach" }));
    await act(async () => {
      firstRequest.resolve({ ...advice, displayText: "Hidden stale advice." });
    });
    expect(screen.queryByText("Hidden stale advice.")).not.toBeInTheDocument();
    expect(taskCoachApi.synthesizeSpeech).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Show Task Coach" }));
    await waitFor(() => expect(taskCoachApi.getAdvice).toHaveBeenCalledTimes(2));
    await act(async () => {
      retryRequest.resolve({ ...advice, displayText: "Fresh restored advice." });
    });
    expect(await screen.findByText("Fresh restored advice.")).toBeVisible();
    expect(taskCoachApi.synthesizeSpeech).not.toHaveBeenCalled();
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
