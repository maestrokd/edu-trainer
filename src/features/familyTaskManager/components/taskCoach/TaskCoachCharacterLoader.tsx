import { lazy, Suspense } from "react";
import { NotoEmoji } from "../shared/NotoEmoji";
import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import type { AssistantCharacterState } from "./TaskCoachCharacter";
import { getTaskCoachCharacter } from "./taskCoachCharacters";

const RiveTaskCoachCharacter = lazy(() =>
  import("./TaskCoachCharacter").then((module) => ({ default: module.TaskCoachCharacter }))
);

interface TaskCoachCharacterLoaderProps {
  state: AssistantCharacterState;
  characterId: TaskCoachCharacterId;
}

export function TaskCoachCharacterLoader({ state, characterId }: TaskCoachCharacterLoaderProps) {
  const character = getTaskCoachCharacter(characterId);

  return (
    <Suspense
      fallback={
        <span
          className={`flex size-28 items-center justify-center sm:size-32 ${
            character.transparent ? "bg-transparent" : "rounded-full bg-amber-50 shadow-inner dark:bg-amber-950"
          }`}
          aria-hidden="true"
        >
          <NotoEmoji emoji={character.fallbackEmoji} size={82} fallback={character.fallbackEmoji} />
        </span>
      }
    >
      <RiveTaskCoachCharacter key={characterId} state={state} characterId={characterId} />
    </Suspense>
  );
}
