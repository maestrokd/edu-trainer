import { lazy, Suspense } from "react";
import { NotoEmoji } from "../shared/NotoEmoji";
import type { AssistantCharacterState } from "./TaskCoachCharacter";

const RiveTaskCoachCharacter = lazy(() =>
  import("./TaskCoachCharacter").then((module) => ({ default: module.TaskCoachCharacter }))
);

export function TaskCoachCharacterLoader({ state }: { state: AssistantCharacterState }) {
  return (
    <Suspense
      fallback={
        <span
          className="flex size-28 items-center justify-center rounded-full bg-amber-50 shadow-inner dark:bg-amber-950 sm:size-32"
          aria-hidden="true"
        >
          <NotoEmoji emoji="🐱" size={82} fallback="🐱" />
        </span>
      }
    >
      <RiveTaskCoachCharacter state={state} />
    </Suspense>
  );
}
