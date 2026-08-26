import { useEffect, useState } from "react";
import { Alignment, Fit, Layout, RuntimeLoader, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { NotoEmoji } from "../shared/NotoEmoji";

export type AssistantCharacterState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "SUCCESS" | "ERROR" | "SLEEPING";

interface TaskCoachCharacterProps {
  state: AssistantCharacterState;
}

const TASK_COACH_ASSET_PATH = `${import.meta.env.BASE_URL}assets/task-coach`;
const CAT_ASSET_PATH = `${TASK_COACH_ASSET_PATH}/cute-character-cat.riv`;
const CAT_ARTBOARD = "Artboard";
const CAT_STATE_MACHINE = "State Machine 1";
const CAT_STATE_INPUT = "Number 1";

// Keep runtime and asset-specific details in this adapter. The Task Coach itself
// works only with semantic AssistantCharacterState values so the character can
// be replaced without changing advice, TTS, or task-selection flows.
const CAT_INPUT_BY_STATE: Record<AssistantCharacterState, number> = {
  IDLE: 0,
  LISTENING: 1,
  THINKING: 0,
  SPEAKING: 1,
  SUCCESS: 2,
  ERROR: 0,
  SLEEPING: 0,
};

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

export function TaskCoachCharacter({ state }: TaskCoachCharacterProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: CAT_ASSET_PATH,
    artboard: CAT_ARTBOARD,
    stateMachines: CAT_STATE_MACHINE,
    autoplay: true,
    enableRiveAssetCDN: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => setLoaded(true),
    onLoadError: () => setFailed(true),
  });
  const stateInput = useStateMachineInput(rive, CAT_STATE_MACHINE, CAT_STATE_INPUT, 0);

  useEffect(() => {
    if (stateInput) {
      stateInput.value = CAT_INPUT_BY_STATE[state];
    }
  }, [state, stateInput]);

  useEffect(() => {
    if (!rive) {
      return;
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion || state === "SLEEPING") {
      const frameId = requestAnimationFrame(() => rive.pause(CAT_STATE_MACHINE));
      return () => cancelAnimationFrame(frameId);
    }

    rive.play(CAT_STATE_MACHINE);
  }, [rive, state]);

  return (
    <div
      className={`relative size-28 transition duration-300 sm:size-32 ${PRESENTATION_BY_STATE[state]}`}
      aria-hidden="true"
      data-character-state={state}
    >
      {!failed ? (
        <RiveComponent className={`size-full transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} />
      ) : null}
      {!loaded || failed ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-amber-50 shadow-inner dark:bg-amber-950">
          <NotoEmoji emoji="🐱" size={82} fallback="🐱" />
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
