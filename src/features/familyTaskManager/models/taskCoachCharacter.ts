export const TASK_COACH_CHARACTER_IDS = ["simple-cat", "cute-character-cat"] as const;

export type TaskCoachCharacterId = (typeof TASK_COACH_CHARACTER_IDS)[number];

export const DEFAULT_TASK_COACH_CHARACTER_ID: TaskCoachCharacterId = "simple-cat";

export function isTaskCoachCharacterId(value: string | null): value is TaskCoachCharacterId {
  return TASK_COACH_CHARACTER_IDS.some((characterId) => characterId === value);
}
