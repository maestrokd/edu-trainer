import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { ProfileForm, type ProfileFormData } from "./ProfileForm";

const renderForm = (locale: ProfileFormData["locale"], onSubmit = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <ProfileForm
      mode="edit"
      initialData={{
        username: "kid.user",
        firstName: "Kid",
        lastName: "User",
        locale,
      }}
      onSubmit={onSubmit}
      isLoading={false}
      onCancel={vi.fn()}
    />
  );

  return onSubmit;
};

describe("ProfileForm locale", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it.each([
    ["en-US", "English (US)"],
    ["uk-UA", "Ukrainian"],
    ["ru-RU", "Russian"],
  ] as const)("renders the selected %s language title", async (locale, label) => {
    renderForm(locale);

    expect(await screen.findByRole("combobox", { name: "Locale" })).toHaveTextContent(label);
  });

  it("submits the newly selected canonical language tag", async () => {
    const onSubmit = renderForm("en-US");
    const languageSelect = screen.getByRole("combobox", { name: "Locale" });

    fireEvent.keyDown(languageSelect, { key: "r" });

    await waitFor(() => {
      expect(languageSelect).toHaveTextContent("Russian");
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ locale: "ru-RU" }));
    });
  });
});
