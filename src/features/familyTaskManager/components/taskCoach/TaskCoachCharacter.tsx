import { useEffect, useState } from "react";
import { Alignment, Fit, Layout, RuntimeLoader, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { NotoEmoji } from "../shared/NotoEmoji";
import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import { getTaskCoachCharacter, type AssistantCharacterState } from "./taskCoachCharacters";

export type { AssistantCharacterState } from "./taskCoachCharacters";

interface TaskCoachCharacterProps {
  state: AssistantCharacterState;
  characterId: TaskCoachCharacterId;
}

const TASK_COACH_ASSET_PATH = `${import.meta.env.BASE_URL}assets/task-coach`;

const PRESENTATION_BY_STATE: Record<AssistantCharacterState, string> = {
  IDLE: "",
  LISTENING: "motion-safe:animate-pulse",
  THINKING: "motion-safe:animate-pulse",
  SPEAKING: "motion-safe:animate-bounce",
  SUCCESS: "motion-safe:animate-bounce",
  ERROR: "-rotate-3 motion-safe:animate-pulse",
  SLEEPING: "scale-95 opacity-75 grayscale-[25%]",
};

RuntimeLoader.setWasmUrl(`${TASK_COACH_ASSET_PATH}/rive.wasm`);
RuntimeLoader.setWasmFallbackUrl(null);

export function TaskCoachCharacter({ state, characterId }: TaskCoachCharacterProps) {
  const character = getTaskCoachCharacter(characterId);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: `${TASK_COACH_ASSET_PATH}/${character.assetFileName}`,
    artboard: character.artboard,
    stateMachines: character.stateMachine,
    autoplay: true,
    enableRiveAssetCDN: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => setLoaded(true),
    onLoadError: () => setFailed(true),
  });
  const stateInput = useStateMachineInput(
    rive,
    character.stateMachine,
    character.stateInput?.name ?? "",
    character.stateInput?.valueByState.IDLE
  );

  useEffect(() => {
    if (stateInput && character.stateInput) {
      stateInput.value = character.stateInput.valueByState[state];
    }
  }, [character.stateInput, state, stateInput]);

  useEffect(() => {
    if (!rive) {
      return;
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion || state === "SLEEPING") {
      const frameId = requestAnimationFrame(() => rive.pause(character.stateMachine));
      return () => cancelAnimationFrame(frameId);
    }

    rive.play(character.stateMachine);
  }, [character.stateMachine, rive, state]);

  return (
    <div
      className={`relative size-28 transition duration-300 sm:size-32 ${PRESENTATION_BY_STATE[state]}`}
      aria-hidden="true"
      data-character-state={state}
    >
      {!failed ? (
        <RiveComponent
          className={`size-full bg-transparent transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
      {!loaded || failed ? (
        <span
          className={`absolute inset-0 flex items-center justify-center ${
            character.transparent ? "bg-transparent" : "rounded-full bg-amber-50 shadow-inner dark:bg-amber-950"
          }`}
        >
          <NotoEmoji emoji={character.fallbackEmoji} size={82} fallback={character.fallbackEmoji} />
        </span>
      ) : null}
      {state === "SLEEPING" ? (
        <span className="absolute right-0 top-1 rounded-full bg-background/85 px-1.5 py-0.5 text-xs font-bold text-indigo-500 shadow-sm">
          Zzz
        </span>
      ) : null}
    </div>
  );
}
