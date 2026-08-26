import { beforeEach, describe, expect, it } from "vitest";
import {
  loadTaskCoachAutoplay,
  loadTaskCoachAutoRequest,
  saveTaskCoachAutoplay,
  saveTaskCoachAutoRequest,
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
});
