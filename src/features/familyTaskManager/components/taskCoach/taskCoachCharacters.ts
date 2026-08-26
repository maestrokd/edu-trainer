import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";

export type AssistantCharacterState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "SUCCESS" | "ERROR" | "SLEEPING";

interface TaskCoachCharacterInput {
  name: string;
  valueByState: Record<AssistantCharacterState, number>;
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
  artboard: string;
  stateMachine: string;
  stateInput?: TaskCoachCharacterInput;
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
    artboard: "Cat",
    stateMachine: "State Machine 1",
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
    artboard: "Artboard",
    stateMachine: "State Machine 1",
    stateInput: {
      name: "Number 1",
      valueByState: {
        IDLE: 0,
        LISTENING: 1,
        THINKING: 0,
        SPEAKING: 1,
        SUCCESS: 2,
        ERROR: 0,
        SLEEPING: 0,
      },
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
