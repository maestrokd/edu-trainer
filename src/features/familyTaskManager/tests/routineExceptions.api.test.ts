import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "@/services/ApiService";
import { routineExceptionsApi } from "../api/routineExceptionsApi";
import { FamilyRoutineExceptionType } from "../models/enums";

vi.mock("@/services/ApiService", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

describe("routineExceptionsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests routine exceptions with normalized pageable filters", async () => {
    vi.mocked(get).mockResolvedValueOnce({
      page: 0,
      requestedSize: 25,
      actualPageSize: 0,
      totalItems: 0,
      totalPages: 0,
      items: [],
    });

    await routineExceptionsApi.getAll(" routine-1 ", {
      assigneeProfileUuid: " assignee-1 ",
      createdByProfileUuid: " creator-1 ",
      exceptionType: FamilyRoutineExceptionType.SKIP,
      fromDate: "2026-07-01",
      toDate: "2026-07-31",
      searchString: "  camp  ",
      page: 3.9,
      size: 50.2,
      sort: ["exceptionDate,asc", " createdDate,asc "],
    });

    expect(get).toHaveBeenCalledTimes(1);
    const [url, config] = vi.mocked(get).mock.calls[0];
    expect(url).toBe("/private/family/routines/routine-1/exceptions");

    const params = (config as { params?: URLSearchParams } | undefined)?.params;
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params?.get("assigneeProfileUuid")).toBe("assignee-1");
    expect(params?.get("createdByProfileUuid")).toBe("creator-1");
    expect(params?.get("exceptionType")).toBe(FamilyRoutineExceptionType.SKIP);
    expect(params?.get("fromDate")).toBe("2026-07-01");
    expect(params?.get("toDate")).toBe("2026-07-31");
    expect(params?.get("searchString")).toBe("camp");
    expect(params?.get("page")).toBe("3");
    expect(params?.get("size")).toBe("50");
    expect(params?.getAll("sort")).toEqual(["exceptionDate,asc", "createdDate,asc"]);
  });

  it("creates exceptions for routine range", async () => {
    const payload = {
      fromDate: "2026-07-10",
      toDate: "2026-07-12",
      assigneeProfileUuids: ["profile-1"],
      exceptionType: FamilyRoutineExceptionType.SKIP,
      note: "Camp",
    };

    vi.mocked(post).mockResolvedValueOnce({
      routineUuid: "routine-1",
      fromDate: "2026-07-10",
      toDate: "2026-07-12",
      requestedAssigneeCount: 1,
      createdExceptionsCount: 3,
      alreadyExistingCount: 0,
      removedExceptionsCount: 0,
      deletedOpenOccurrencesCount: 0,
      conflictSubmittedCount: 0,
    });

    await routineExceptionsApi.create("routine-1", payload);

    expect(post).toHaveBeenCalledWith("/private/family/routines/routine-1/exceptions", payload);
  });

  it("reopens routine exceptions in range", async () => {
    const payload = {
      fromDate: "2026-07-10",
      toDate: "2026-07-12",
      assigneeProfileUuids: ["profile-1"],
    };

    vi.mocked(post).mockResolvedValueOnce({
      routineUuid: "routine-1",
      fromDate: "2026-07-10",
      toDate: "2026-07-12",
      requestedAssigneeCount: 1,
      createdExceptionsCount: 0,
      alreadyExistingCount: 0,
      removedExceptionsCount: 3,
      deletedOpenOccurrencesCount: 0,
      conflictSubmittedCount: 0,
    });

    await routineExceptionsApi.reopen("routine-1", payload);

    expect(post).toHaveBeenCalledWith("/private/family/routines/routine-1/exceptions/reopen", payload);
  });
});
