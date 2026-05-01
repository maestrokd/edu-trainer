import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosResponse } from "axios";
import { apiClient, get, post } from "@/services/ApiService";
import { familyTemplateCollectionsApi } from "../api/familyTemplateCollectionsApi";
import type { TemplateExportRequest } from "../models/dto";

vi.mock("@/services/ApiService", () => ({
  get: vi.fn(),
  post: vi.fn(),
  apiClient: {
    post: vi.fn(),
  },
}));

describe("familyTemplateCollectionsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists routine candidates when backend returns array", async () => {
    vi.mocked(get).mockResolvedValueOnce([
      {
        uuid: "routine-1",
        title: "Morning reading",
        emoji: "BOOK",
        recurrenceType: "WEEKLY",
        routineSlot: "MORNING",
        starsReward: 5,
        active: true,
        createdDate: "2026-04-10T12:02:18.402Z",
        lastUpdatedDate: "2026-04-10T12:02:18.402Z",
      },
    ]);

    const result = await familyTemplateCollectionsApi.listRoutineCandidates();

    expect(get).toHaveBeenCalledWith("/private/family/template-collections/routines");
    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe("routine-1");
  });

  it("lists reward candidates when backend returns items wrapper", async () => {
    vi.mocked(get).mockResolvedValueOnce({
      items: [
        {
          uuid: "reward-1",
          title: "Movie night",
          emoji: "MOVIE",
          starsCost: 30,
          availableQuantity: null,
          active: true,
          createdDate: "2026-04-10T16:20:00.000Z",
          lastUpdatedDate: "2026-04-10T16:20:00.000Z",
        },
      ],
    });

    const result = await familyTemplateCollectionsApi.listRewardCandidates();

    expect(get).toHaveBeenCalledWith("/private/family/template-collections/rewards");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ uuid: "reward-1", starsCost: 30 });
  });

  it("requests JSON export preview via post()", async () => {
    const request: TemplateExportRequest = {
      stateFilter: "ACTIVE",
      selectionMode: "ALL_FILTERED",
      selectedUuids: [],
    };
    const payload = {
      schemaVersion: "1.0",
      items: [{ title: "Read", starsReward: 3 }],
    };
    vi.mocked(post).mockResolvedValueOnce(payload);

    const result = await familyTemplateCollectionsApi.exportRoutines(request, false);

    expect(post).toHaveBeenCalledWith("/private/family/template-collections/routines/export", request);
    expect(result).toEqual(payload);
  });

  it("requests downloadable export with blob response", async () => {
    const request: TemplateExportRequest = {
      stateFilter: "INACTIVE",
      selectionMode: "SELECTED",
      selectedUuids: ["uuid-1"],
    };
    const response = {
      data: new Blob(["{}"], { type: "application/json" }),
      headers: { "content-disposition": 'attachment; filename="templates.json"' },
    } as unknown as AxiosResponse<Blob>;
    vi.mocked(apiClient.post).mockResolvedValueOnce(response);

    const result = await familyTemplateCollectionsApi.exportChores(request, true);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/private/family/template-collections/chores/export",
      request,
      expect.objectContaining({
        params: { download: true },
        responseType: "blob",
      })
    );
    expect(result).toBe(response);
  });

  it("sends file preview request as multipart form-data", async () => {
    const file = new File(['{"schemaVersion":"1.0","items":[]}'], "templates.json", {
      type: "application/json",
    });
    vi.mocked(post).mockResolvedValueOnce({
      totalItemCount: 0,
      validItemCount: 0,
      invalidItemCount: 0,
      wouldCreateCount: 0,
      warnings: [],
      errors: [],
    });

    await familyTemplateCollectionsApi.previewRoutineImportFile(file);

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = vi.mocked(post).mock.calls[0];
    expect(url).toBe("/private/family/template-collections/routines/import-file/preview");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(file);
    expect(config).toEqual(
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  });

  it("propagates API errors", async () => {
    vi.mocked(get).mockRejectedValueOnce(new Error("boom"));

    await expect(familyTemplateCollectionsApi.listRoutineCandidates()).rejects.toThrow("boom");
  });
});
