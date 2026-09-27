import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";

import { useBibleBookshelfGame } from "../hooks/useBibleBookshelfGame";

describe("useBibleBookshelfGame language ownership", () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("initializes from the application locale once and then remains independent", async () => {
    await i18n.changeLanguage("uk-UA");
    const { result } = renderHook(() => useBibleBookshelfGame());

    expect(result.current.state.config.bibleLanguage).toBe("uk");

    act(() => result.current.actions.setBibleLanguage("en"));
    await act(async () => {
      await i18n.changeLanguage("ru");
    });

    expect(result.current.state.config.bibleLanguage).toBe("en");
    expect(result.current.state.phase).toBe("setup");
  });
});
