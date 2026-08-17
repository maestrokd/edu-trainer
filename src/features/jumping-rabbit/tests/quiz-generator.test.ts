import { describe, expect, it } from "vitest";
import { generateRabbitQuiz } from "../lib/quiz-generator";

describe("jumping rabbit quiz generator", () => {
  it("builds the requested number of unique questions from the selected factor range", () => {
    const quiz = generateRabbitQuiz({ count: 5, minVal: 4, maxVal: 6 });

    expect(quiz).toHaveLength(5);
    expect(new Set(quiz.map((question) => `${question.a}-${question.b}`)).size).toBe(5);
    quiz.forEach((question) => {
      expect(question.a).toBeGreaterThanOrEqual(4);
      expect(question.a).toBeLessThanOrEqual(6);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeLessThanOrEqual(12);
    });
  });

  it("creates four unique options containing the correct answer", () => {
    const quiz = generateRabbitQuiz({ count: 5, minVal: 4, maxVal: 9 });

    quiz.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.a * question.b);
    });
  });

  it("normalizes reversed ranges and clamps unsupported values", () => {
    const reversed = generateRabbitQuiz({ count: 5, minVal: 12, maxVal: 10 });
    expect(reversed.every((question) => question.a >= 10 && question.a <= 12)).toBe(true);

    expect(generateRabbitQuiz({ count: 0, minVal: 1, maxVal: 1 })).toHaveLength(1);
    expect(generateRabbitQuiz({ count: 20, minVal: 20, maxVal: 20 })).toHaveLength(5);
  });
});
