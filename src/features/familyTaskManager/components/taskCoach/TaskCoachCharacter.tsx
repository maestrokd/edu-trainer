import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alignment, Fit, Layout, RuntimeLoader, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import type { TaskCoachCharacterId } from "../../models/taskCoachCharacter";
import {
  characterActionAtPoint,
  getTaskCoachCharacter,
  type CharacterAction,
  type AssistantCharacterState,
} from "./taskCoachCharacters";

export type { AssistantCharacterState } from "./taskCoachCharacters";
export interface TaskCoachCharacterProps {
  state: AssistantCharacterState;
  characterId: TaskCoachCharacterId;
  visible?: boolean;
  onActivate?: () => void;
  actionLabel?: string;
}
const ASSET_PATH = `${import.meta.env.BASE_URL}assets/task-coach`;
RuntimeLoader.setWasmUrl(`${ASSET_PATH}/rive.wasm`);
RuntimeLoader.setWasmFallbackUrl(null);

const BADGES: Partial<Record<AssistantCharacterState, { key: string; fallback: string; icon: string }>> = {
  THINKING: { key: "thinkingBadge", fallback: "Thinking", icon: "•••" },
  SPEAKING: { key: "speakingBadge", fallback: "Speaking", icon: "♫" },
  SUCCESS: { key: "successBadge", fallback: "Well done!", icon: "★" },
  ERROR: { key: "errorBadge", fallback: "Try again", icon: "!" },
  SLEEPING: { key: "sleepingBadge", fallback: "Resting", icon: "Zzz" },
};

export function TaskCoachCharacter({
  state,
  characterId,
  visible = true,
  onActivate,
  actionLabel,
}: TaskCoachCharacterProps) {
  const { t } = useTranslation();
  const character = getTaskCoachCharacter(characterId);
  const capabilities = character.capabilities;
  const frame = useRef<number | null>(null);
  const entered = useRef(false);
  const appliedState = useRef<AssistantCharacterState | null>(null);
  const reaction = useRef<{ action: CharacterAction; elapsed: number; started: boolean } | null>(null);
  const callbacks = useRef<{ advance: (seconds: number) => void; transition: (names: string[]) => void }>({
    advance: () => {},
    transition: () => {},
  });
  const [ready, setReady] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(media?.matches ?? false);
    media?.addEventListener("change", change);
    return () => media?.removeEventListener("change", change);
  }, []);
  const { rive, RiveComponent } = useRive({
    src: `${ASSET_PATH}/${character.assetFileName}`,
    artboard: character.artboard,
    stateMachines: character.stateMachine,
    autoplay: false,
    enableRiveAssetCDN: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    shouldDisableRiveListeners: !capabilities.nativePointer,
    isTouchScrollEnabled: true,
    dispatchPointerExit: true,
    automaticallyHandleEvents: false,
    onAdvance: (event) => callbacks.current.advance(Number(event.data) || 0),
    onStateChange: (event) => callbacks.current.transition(Array.isArray(event.data) ? event.data : []),
    onLoadError: () => setFailed(true),
  });
  const input = useStateMachineInput(rive, character.stateMachine, capabilities.idle.inputName ?? "", 0);
  const running = visible && !reducedMotion && !failed && state !== "SLEEPING";
  const animated = ready && running;
  const optionalAllowed = animated && (state === "IDLE" || state === "ERROR" || state === "LISTENING");
  const startReaction = (action: CharacterAction) => {
    const mapping = capabilities.reactions[action];
    if (!mapping || !input) return;
    // Re-selecting an active action must not keep it alive indefinitely.
    if (reaction.current?.action === action) return;
    reaction.current = { action, elapsed: 0, started: false };
    input.value = mapping.value;
  };
  const finishReaction = () => {
    reaction.current = null;
    setEntranceComplete(true);
    if (input && capabilities.idle.inputName) input.value = capabilities.idle.value;
  };
  callbacks.current = {
    advance: (seconds) => {
      if (!running) return;
      if (!ready && frame.current === null) {
        // The runtime draws after onAdvance; reveal on the following browser frame.
        frame.current = requestAnimationFrame(() => setReady(true));
      }
      const current = reaction.current;
      if (current) {
        current.elapsed += seconds;
        if (current.elapsed >= capabilities.reactions[current.action]!.maxSeconds) finishReaction();
      }
    },
    transition: (names) => {
      const current = reaction.current;
      if (!current) return;
      const prefix = capabilities.reactions[current.action]!.statePrefix;
      if (names.some((name) => name.toLowerCase().startsWith(prefix))) current.started = true;
      else if (current.started && names.some((name) => name.toLowerCase() === "idle")) finishReaction();
    },
  };
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );
  useEffect(() => {
    if (!rive) return;
    if (running) rive.play(character.stateMachine);
    else rive.pause(character.stateMachine);
  }, [rive, character.stateMachine, running]);
  useEffect(() => {
    // Native pointer motion remains enabled even during semantic statuses. Orange
    // action pointer events are intercepted below so they cannot change priority.
    if (!ready || !running || (capabilities.idle.inputName && !input) || appliedState.current === state) return;
    appliedState.current = state;
    const firstAppearance = !entered.current;
    entered.current = true;
    const action = capabilities.semantic[state];
    if (action) {
      setEntranceComplete(true);
      startReaction(action);
    } else {
      finishReaction();
      if (firstAppearance && capabilities.startup === "greeting" && state === "IDLE") {
        setEntranceComplete(false);
        startReaction("wave");
      }
    }
    // Reactions are imperative Rive commands, not render dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, running, state, input, capabilities]);
  const hitAction = (event: { currentTarget: HTMLElement; clientX: number; clientY: number }) =>
    characterActionAtPoint(character, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
  const badge = BADGES[state];
  return (
    <div
      className="task-coach-character relative"
      data-character-state={state}
      data-character-phase={!visible ? "hidden" : !ready ? "loading" : entranceComplete ? "active" : "entering"}
    >
      <button
        type="button"
        aria-label={actionLabel ?? t("familyTask.taskCoach.askCoach", "Ask coach")}
        aria-busy={state === "THINKING"}
        className="relative block size-full rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onMouseDownCapture={(event) => {
          if (hitAction(event)) event.stopPropagation();
        }}
        onMouseUpCapture={(event) => {
          if (hitAction(event)) event.stopPropagation();
        }}
        onTouchStartCapture={(event) => {
          const touch = event.changedTouches[0];
          if (
            touch &&
            hitAction({ currentTarget: event.currentTarget, clientX: touch.clientX, clientY: touch.clientY })
          )
            event.stopPropagation();
        }}
        onTouchEndCapture={(event) => {
          const touch = event.changedTouches[0];
          if (
            touch &&
            hitAction({ currentTarget: event.currentTarget, clientX: touch.clientX, clientY: touch.clientY })
          )
            event.stopPropagation();
        }}
        onPointerDownCapture={(event) => {
          if (hitAction(event)) event.stopPropagation();
        }}
        onPointerUpCapture={(event) => {
          if (hitAction(event)) event.stopPropagation();
        }}
        onClickCapture={(event) => {
          const action = event.detail === 0 ? undefined : hitAction(event);
          if (action) {
            event.stopPropagation();
            if (optionalAllowed) startReaction(action);
          }
        }}
        onClick={() => onActivate?.()}
      >
        {!failed ? (
          <RiveComponent
            className={`${animated ? "pointer-events-auto" : "pointer-events-none"} absolute inset-0 size-full bg-transparent motion-safe:transition-opacity motion-safe:duration-200 ${animated ? "opacity-100" : "opacity-0"}`}
          />
        ) : null}
        <img
          src={`${ASSET_PATH}/${character.posterFileName}`}
          alt=""
          className={`pointer-events-none absolute inset-0 size-full object-contain motion-safe:transition-opacity motion-safe:duration-200 ${animated ? "opacity-0" : "opacity-100"}`}
        />
      </button>
      {badge ? (
        <span className="pointer-events-none absolute inset-x-0 -top-1 mx-auto flex w-max max-w-40 items-center gap-1 rounded-full border bg-background/95 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
          <span>{badge.icon}</span>
          {t(`familyTask.taskCoach.${badge.key}`, badge.fallback)}
        </span>
      ) : null}
      {Object.keys(capabilities.reactions).length > 0 ? (
        <div
          className="task-coach-play-actions absolute bottom-full right-0 mb-2 flex gap-1"
          aria-label={t("familyTask.taskCoach.characterActions", "Character actions")}
        >
          {(["wave", "play"] as const).map((action) => (
            <button
              key={action}
              type="button"
              disabled={!optionalAllowed}
              className="min-h-11 min-w-11 rounded-full border bg-background/95 px-3 text-xs font-medium shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => startReaction(action)}
            >
              {t(`familyTask.taskCoach.${action}Action`, action === "wave" ? "Wave" : "Play")}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
