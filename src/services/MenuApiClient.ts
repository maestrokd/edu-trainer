import { post } from "@/services/ApiService";
import { type Locale5 } from "@/services/SettingsApiClient";
import type { PageableResponse } from "@/types/api";

export const MenuCategory = {
  MATH: "MATH",
  ARCADE: "ARCADE",
  INFO: "INFO",
  COACH: "COACH",
} as const;
export type MenuCategory = (typeof MenuCategory)[keyof typeof MenuCategory];

export const MenuType = {
  GAME: "GAME",
  COACH: "COACH",
  // Add other types as they become known
} as const;
export type MenuType = (typeof MenuType)[keyof typeof MenuType];

export interface ApiMenuItem {
  id: string;
  type?: string | MenuType | null;
  path?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | MenuCategory | null;
  iconKey?: string | null;
  badge?: string | null;
  tags?: string[] | null;
}

export interface MenuItemsFiltersRequest {
  searchString: string;
  category: string | MenuCategory;
  type: string | MenuType;
}

class MenuApiClient {
  /**
   * Fetches menu items with optional filters and pagination.
   * @param filters - Search criteria (searchString, category, type)
   * @param page - Page number (starting from 0)
   * @param size - Page size
   * @param locale - 5-character locale string (e.g., "en-US")
   */
  static async retrieveMenu(
    filters: MenuItemsFiltersRequest,
    page: number = 0,
    size: number = 20,
    locale?: Locale5
  ): Promise<PageableResponse<ApiMenuItem>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (locale) {
      params.append("locale", locale);
    }

    const url = `/api/v1/menu/filters?${params.toString()}`;
    return post<PageableResponse<ApiMenuItem>>(url, filters);
  }
}

export default MenuApiClient;
