import { describe, expect, it } from "vitest";
import { generateRabbitQuiz } from "../lib/quiz-generator";

describe("jumping rabbit quiz generator", () => {
  it("builds the requested number of unique ×9 questions", () => {
    const quiz = generateRabbitQuiz(5);

    expect(quiz).toHaveLength(5);
    expect(new Set(quiz.map((question) => question.b)).size).toBe(5);
    quiz.forEach((question) => {
      expect(question.a).toBe(9);
      expect(question.b).toBeGreaterThanOrEqual(2);
      expect(question.b).toBeLessThanOrEqual(12);
    });
  });

  it("creates four unique options containing the correct answer", () => {
    const quiz = generateRabbitQuiz(5);

    quiz.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.a * question.b);
    });
  });

  it("clamps unsupported question counts to the configured limits", () => {
    expect(generateRabbitQuiz(0)).toHaveLength(1);
    expect(generateRabbitQuiz(20)).toHaveLength(5);
  });
});
