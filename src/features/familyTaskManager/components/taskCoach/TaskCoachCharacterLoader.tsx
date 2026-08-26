import { lazy, Suspense } from "react";
import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import type { AssistantCharacterState } from "./TaskCoachCharacter";
import { getTaskCoachCharacter } from "./taskCoachCharacters";

const RiveTaskCoachCharacter = lazy(() =>
  import("./TaskCoachCharacter").then((module) => ({ default: module.TaskCoachCharacter }))
);

interface TaskCoachCharacterLoaderProps {
  state: AssistantCharacterState;
  characterId: TaskCoachCharacterId;
  visible?: boolean;
  onActivate?: () => void;
  actionLabel?: string;
}

export function TaskCoachCharacterLoader({
  state,
  characterId,
  visible = true,
  onActivate,
  actionLabel,
}: TaskCoachCharacterLoaderProps) {
  const character = getTaskCoachCharacter(characterId);
  return (
    <Suspense
      fallback={
        <button
          type="button"
          onClick={onActivate}
          aria-label={actionLabel}
          className="block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            className="task-coach-character block object-contain"
            src={`${import.meta.env.BASE_URL}assets/task-coach/${character.posterFileName}`}
            alt=""
            aria-hidden="true"
          />
        </button>
      }
    >
      <RiveTaskCoachCharacter
        key={characterId}
        state={state}
        characterId={characterId}
        visible={visible}
        onActivate={onActivate}
        actionLabel={actionLabel}
      />
    </Suspense>
  );
}
