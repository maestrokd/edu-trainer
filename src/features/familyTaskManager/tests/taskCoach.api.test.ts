import { beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "@/services/ApiService";
import { taskCoachApi } from "../api/taskCoachApi";

vi.mock("@/services/ApiService", () => ({ post: vi.fn() }));
vi.mock("../api/timezone", () => ({ getTimezoneHeader: () => ({ "X-Timezone": "Europe/Kyiv" }) }));

describe("taskCoachApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests localized advice for the selected child", async () => {
    vi.mocked(post).mockResolvedValueOnce({ displayText: "Start reading" });

    await taskCoachApi.getAdvice("child-1");

    expect(post).toHaveBeenCalledWith(
      "/private/family/task-coach/advice",
      { profileUuid: "child-1", coachStyle: "CHEERFUL" },
      { headers: { "X-Timezone": "Europe/Kyiv" } }
    );
  });

  it("requests speech as a blob", async () => {
    vi.mocked(post).mockResolvedValueOnce(new Blob());

    await taskCoachApi.synthesizeSpeech("child-1", "Почнімо");

    expect(post).toHaveBeenCalledWith(
      "/private/family/task-coach/speech",
      { profileUuid: "child-1", speechText: "Почнімо" },
      { responseType: "blob" }
    );
  });
});
