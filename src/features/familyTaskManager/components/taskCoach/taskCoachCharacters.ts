import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";

export type AssistantCharacterState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "SUCCESS" | "ERROR" | "SLEEPING";

export type CharacterAction = "wave" | "play";
export interface CharacterReaction {
  value: number;
  statePrefix: string;
  maxSeconds: number;
}

interface CharacterCapabilities {
  nativePointer: boolean;
  startup: "native" | "greeting";
  idle: { inputName?: string; value: number };
  reactions: Partial<Record<CharacterAction, CharacterReaction>>;
  semantic: Partial<Record<AssistantCharacterState, CharacterAction>>;
  // Normalized coordinates in the original square artboard (Fit.Contain).
  hitAreas: Array<{ action: CharacterAction; x: number; y: number; radius: number }>;
}

interface TaskCoachCharacterAttribution {
  title: string;
  creator: string;
  sourceUrl: string;
  remix?: {
    title: string;
    creator: string;
    sourceUrl: string;
  };
}

export interface TaskCoachCharacterDefinition {
  id: TaskCoachCharacterId;
  nameTranslationKey: string;
  nameFallback: string;
  assetFileName: string;
  posterFileName: string;
  artboard: string;
  stateMachine: string;
  capabilities: CharacterCapabilities;
  transparent: boolean;
  fallbackEmoji: string;
  attribution: TaskCoachCharacterAttribution;
}

const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

export const TASK_COACH_CHARACTER_LICENSE_URL = LICENSE_URL;

export const TASK_COACH_CHARACTERS: Record<TaskCoachCharacterId, TaskCoachCharacterDefinition> = {
  "simple-cat": {
    id: "simple-cat",
    nameTranslationKey: "familyTask.taskCoach.simpleCat",
    nameFallback: "Simple Cat (transparent)",
    assetFileName: "cat-simple-edit.riv",
    posterFileName: "cat-simple-edit.png",
    artboard: "Cat",
    stateMachine: "State Machine 1",
    capabilities: {
      nativePointer: true,
      startup: "native",
      idle: { value: 0 },
      reactions: {},
      semantic: {},
      hitAreas: [],
    },
    transparent: true,
    fallbackEmoji: "🐈‍⬛",
    attribution: {
      title: "Cat Simple Edit",
      creator: "nvr",
      sourceUrl: "https://rive.app/marketplace/8999-17412-cat-simple-edit/",
      remix: {
        title: "Cat following the mouse",
        creator: "Pedro Alpera",
        sourceUrl: "https://rive.app/marketplace/3920-8202-cat-following-the-mouse/",
      },
    },
  },
  "cute-character-cat": {
    id: "cute-character-cat",
    nameTranslationKey: "familyTask.taskCoach.cuteCharacterCat",
    nameFallback: "Cute Character Cat",
    assetFileName: "cute-character-cat.riv",
    posterFileName: "cute-character-cat.png",
    artboard: "Artboard",
    stateMachine: "State Machine 1",
    capabilities: {
      nativePointer: true,
      startup: "greeting",
      idle: { inputName: "Number 1", value: 0 },
      reactions: {
        wave: { value: 1, statePrefix: "hi", maxSeconds: 8 },
        play: { value: 2, statePrefix: "fish", maxSeconds: 12 },
      },
      semantic: { SUCCESS: "wave" },
      hitAreas: [
        { action: "play", x: 0.815, y: 0.467, radius: 0.07 },
        { action: "wave", x: 0.815, y: 0.638, radius: 0.07 },
      ],
    },
    transparent: false,
    fallbackEmoji: "🐱",
    attribution: {
      title: "Cute Character Cat",
      creator: "kikkojinji1",
      sourceUrl: "https://rive.app/marketplace/27883-52700-cute-character-cat/",
    },
  },
};

export function getTaskCoachCharacter(characterId: TaskCoachCharacterId): TaskCoachCharacterDefinition {
  return TASK_COACH_CHARACTERS[characterId];
}

export function characterActionAtPoint(
  character: TaskCoachCharacterDefinition,
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number
): CharacterAction | undefined {
  const size = Math.min(rect.width, rect.height);
  if (!size) return undefined;
  const x = (clientX - rect.left - (rect.width - size) / 2) / size;
  const y = (clientY - rect.top - (rect.height - size) / 2) / size;
  return character.capabilities.hitAreas.find((area) => Math.hypot(x - area.x, y - area.y) <= area.radius)?.action;
}
