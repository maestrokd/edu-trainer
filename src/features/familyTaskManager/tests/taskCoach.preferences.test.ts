import { beforeEach, describe, expect, it } from "vitest";
import {
  loadTaskCoachAutoplay,
  loadTaskCoachAutoRequest,
  loadTaskCoachCharacter,
  loadTaskCoachCompletionRefreshMode,
  loadTaskCoachStyle,
  saveTaskCoachAutoplay,
  saveTaskCoachAutoRequest,
  saveTaskCoachCharacter,
  saveTaskCoachCompletionRefreshMode,
  saveTaskCoachStyle,
} from "../services/taskCoachPreferences";

describe("Task Coach preferences", () => {
  beforeEach(() => localStorage.clear());

  it("defaults autoplay to on and persists changes separately", () => {
    expect(loadTaskCoachAutoplay()).toBe(true);

    saveTaskCoachAutoplay(false);

    expect(loadTaskCoachAutoplay()).toBe(false);
    expect(localStorage.getItem("family-task-coach:preferences:autoplay")).toBe("false");
  });

  it("defaults automatic advice to on and persists its own token-saving preference", () => {
    expect(loadTaskCoachAutoRequest()).toBe(true);

    saveTaskCoachAutoRequest(false);

    expect(loadTaskCoachAutoRequest()).toBe(false);
    expect(localStorage.getItem("family-task-coach:preferences:auto-request")).toBe("false");
  });

  it("defaults to Simple Cat and only restores recognized character ids", () => {
    expect(loadTaskCoachCharacter()).toBe("simple-cat");

    saveTaskCoachCharacter("cute-character-cat");
    expect(loadTaskCoachCharacter()).toBe("cute-character-cat");

    localStorage.setItem("family-task-coach:preferences:character", "unknown-character");
    expect(loadTaskCoachCharacter()).toBe("simple-cat");
  });

  it("defaults completion refresh to a prompt and restores only recognized modes", () => {
    expect(loadTaskCoachCompletionRefreshMode()).toBe("PROMPT");

    saveTaskCoachCompletionRefreshMode("AUTO");
    expect(loadTaskCoachCompletionRefreshMode()).toBe("AUTO");

    localStorage.setItem("family-task-coach:preferences:completion-refresh", "UNKNOWN");
    expect(loadTaskCoachCompletionRefreshMode()).toBe("PROMPT");
  });

  it("defaults coach style to cheerful and restores only recognized styles", () => {
    expect(loadTaskCoachStyle()).toBe("CHEERFUL");

    saveTaskCoachStyle("SILLY");
    expect(loadTaskCoachStyle()).toBe("SILLY");

    localStorage.setItem("family-task-coach:preferences:coach-style", "LOUD");
    expect(loadTaskCoachStyle()).toBe("CHEERFUL");
  });
});
