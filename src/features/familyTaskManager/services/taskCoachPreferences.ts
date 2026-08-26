import {
  DEFAULT_TASK_COACH_CHARACTER_ID,
  isTaskCoachCharacterId,
  type TaskCoachCharacterId,
} from "../models/taskCoachCharacter";

const AUTOPLAY_STORAGE_KEY = "family-task-coach:preferences:autoplay";
const AUTO_REQUEST_STORAGE_KEY = "family-task-coach:preferences:auto-request";
const CHARACTER_STORAGE_KEY = "family-task-coach:preferences:character";

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
