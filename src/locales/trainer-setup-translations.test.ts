import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG as ADD_SUB_DEFAULT_CONFIG } from "@/features/add-sub-trainer/model/trainer.constants";
import { DEFAULT_CONFIG as MULTIPLICATION_DEFAULT_CONFIG } from "@/features/multiplication-trainer/model/trainer.constants";
import { DEFAULT_CONFIG as ROUNDING_DEFAULT_CONFIG } from "@/features/rounding-trainer/model/trainer.constants";
import en from "./en/translation.json";
import ru from "./ru/translation.json";
import uk from "./uk/translation.json";

describe("trainer setup translations", () => {
  it.each([
    [en, "Quiz", "Main Menu", "Sound feedback"],
    [uk, "Квіз", "Головне меню", "Звуковий відгук"],
    [ru, "Викторина", "Главное меню", "Звуковая обратная связь"],
  ])("uses canonical shared trainer labels", (translations, quiz, mainMenu, soundFeedback) => {
    expect(translations.addSubT.mode.quiz).toBe(quiz);
    expect(translations.multiT.mode.quiz).toBe(quiz);
    expect(translations.roundT.mode.quiz).toBe(quiz);
    expect(translations.menu.mainMenuLabel).toBe(mainMenu);
    expect(translations.addSubT.setup.sounds).toBe(soundFeedback);
    expect(translations.cmpNmbrGm.feedback.sound).toBe(soundFeedback);
    expect(translations.roundT.setup.sounds).toBe(soundFeedback);
  });

  it("defaults every configurable trainer mode to quiz", () => {
    expect(ADD_SUB_DEFAULT_CONFIG.playMode).toBe("quiz");
    expect(MULTIPLICATION_DEFAULT_CONFIG.mode).toBe("quiz");
    expect(ROUNDING_DEFAULT_CONFIG.mode).toBe("quiz");
  });
});
