import {
  DEFAULT_TASK_COACH_CHARACTER_ID,
  isTaskCoachCharacterId,
  type TaskCoachCharacterId,
} from "../models/taskCoachCharacter";
import { TaskCoachStyle, type TaskCoachStyle as TaskCoachStyleValue } from "../models/enums";

const AUTOPLAY_STORAGE_KEY = "family-task-coach:preferences:autoplay";
const AUTO_REQUEST_STORAGE_KEY = "family-task-coach:preferences:auto-request";
const CHARACTER_STORAGE_KEY = "family-task-coach:preferences:character";
const COMPLETION_REFRESH_STORAGE_KEY = "family-task-coach:preferences:completion-refresh";
const COACH_STYLE_STORAGE_KEY = "family-task-coach:preferences:coach-style";

export const TASK_COACH_COMPLETION_REFRESH_MODES = ["AUTO", "PROMPT", "MANUAL"] as const;
export type TaskCoachCompletionRefreshMode = (typeof TASK_COACH_COMPLETION_REFRESH_MODES)[number];
export const DEFAULT_TASK_COACH_COMPLETION_REFRESH_MODE: TaskCoachCompletionRefreshMode = "PROMPT";
export const TASK_COACH_STYLES = [TaskCoachStyle.GENTLE, TaskCoachStyle.CHEERFUL, TaskCoachStyle.SILLY] as const;
export const DEFAULT_TASK_COACH_STYLE: TaskCoachStyleValue = TaskCoachStyle.CHEERFUL;

function isTaskCoachCompletionRefreshMode(value: string | null): value is TaskCoachCompletionRefreshMode {
  return TASK_COACH_COMPLETION_REFRESH_MODES.some((mode) => mode === value);
}

function isTaskCoachStyle(value: string | null): value is TaskCoachStyleValue {
  return TASK_COACH_STYLES.some((style) => style === value);
}

export function loadTaskCoachAutoplay(): boolean {
  try {
    const stored = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function saveTaskCoachAutoplay(enabled: boolean): void {
  try {
    localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(enabled));
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function loadTaskCoachAutoRequest(): boolean {
  try {
    const stored = localStorage.getItem(AUTO_REQUEST_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function saveTaskCoachAutoRequest(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_REQUEST_STORAGE_KEY, String(enabled));
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function loadTaskCoachCharacter(): TaskCoachCharacterId {
  try {
    const stored = localStorage.getItem(CHARACTER_STORAGE_KEY);
    return isTaskCoachCharacterId(stored) ? stored : DEFAULT_TASK_COACH_CHARACTER_ID;
  } catch {
    return DEFAULT_TASK_COACH_CHARACTER_ID;
  }
}

export function saveTaskCoachCharacter(characterId: TaskCoachCharacterId): void {
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, characterId);
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function loadTaskCoachCompletionRefreshMode(): TaskCoachCompletionRefreshMode {
  try {
    const stored = localStorage.getItem(COMPLETION_REFRESH_STORAGE_KEY);
    return isTaskCoachCompletionRefreshMode(stored) ? stored : DEFAULT_TASK_COACH_COMPLETION_REFRESH_MODE;
  } catch {
    return DEFAULT_TASK_COACH_COMPLETION_REFRESH_MODE;
  }
}

export function saveTaskCoachCompletionRefreshMode(mode: TaskCoachCompletionRefreshMode): void {
  try {
    localStorage.setItem(COMPLETION_REFRESH_STORAGE_KEY, mode);
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function loadTaskCoachStyle(): TaskCoachStyleValue {
  try {
    const stored = localStorage.getItem(COACH_STYLE_STORAGE_KEY);
    return isTaskCoachStyle(stored) ? stored : DEFAULT_TASK_COACH_STYLE;
  } catch {
    return DEFAULT_TASK_COACH_STYLE;
  }
}

export function saveTaskCoachStyle(style: TaskCoachStyleValue): void {
  try {
    localStorage.setItem(COACH_STYLE_STORAGE_KEY, style);
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}
