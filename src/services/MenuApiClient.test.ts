import { beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "@/services/ApiService";
import MenuApiClient, { MenuCategory, MenuType } from "./MenuApiClient";

vi.mock("@/services/ApiService", () => ({
  post: vi.fn(),
}));

describe("MenuApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves filtered menu items through pageable response envelope", async () => {
    vi.mocked(post).mockResolvedValueOnce({
      page: 2,
      requestedSize: 30,
      actualPageSize: 1,
      totalItems: 61,
      totalPages: 3,
      items: [
        {
          id: "menu-1",
          type: MenuType.GAME,
          path: "/multiplication-trainer",
          name: "multiplication",
          title: "Multiplication",
          description: "Practice multiplication",
          category: MenuCategory.MATH,
          iconKey: "Calculator",
          badge: null,
          tags: ["math"],
        },
      ],
    });

    const filters = {
      searchString: "multiply",
      category: MenuCategory.MATH,
      type: MenuType.GAME,
    };

    const result = await MenuApiClient.retrieveMenu(filters, 2, 30, "en-US");

    expect(post).toHaveBeenCalledWith("/api/v1/menu/filters?page=2&size=30&locale=en-US", filters);
    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(61);
  });
});
