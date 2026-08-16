import { clampQuizCount } from "../model/rabbit.constants";
import type { RabbitQuizQuestion } from "../model/rabbit.types";

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function generateQuizOptions(correct: number, random: () => number = Math.random): number[] {
  const offsets = shuffled([-9, 9, -3, 3, -6, 6, -12, 12, -1, 1], random);
  const distractors: number[] = [];

  for (const offset of offsets) {
    const candidate = Math.max(2, correct + offset);
    if (candidate !== correct && !distractors.includes(candidate)) distractors.push(candidate);
    if (distractors.length === 3) break;
  }

  return shuffled([correct, ...distractors], random);
}

export function generateRabbitQuiz(count: number, random: () => number = Math.random): RabbitQuizQuestion[] {
  const factors = shuffled(
    Array.from({ length: 11 }, (_, index) => index + 2),
    random
  ).slice(0, clampQuizCount(count));

  return factors.map((b) => ({
    a: 9,
    b,
    options: generateQuizOptions(9 * b, random),
  }));
}
