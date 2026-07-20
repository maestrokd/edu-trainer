import type { TouchControl } from "./events";

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  /** edge-triggered: consumed by the engine on read */
  jumpPressed: boolean;
  attackPressed: boolean;
}

export interface InputController {
  state: InputState;
  attach(): void;
  detach(): void;
  set(control: TouchControl, pressed: boolean): void;
  /** while frozen/paused the keyboard is released to the question panel */
  setEnabled(enabled: boolean): void;
}

const KEY_MAP: Record<string, TouchControl> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  KeyF: "attack",
  Enter: "attack",
};

export function createInput(): InputController {
  const state: InputState = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    jumpPressed: false,
    attackPressed: false,
  };
  let enabled = true;

  function apply(control: TouchControl, pressed: boolean) {
    if (control === "jump" && pressed && !state.jump) state.jumpPressed = true;
    if (control === "attack" && pressed && !state.attack) state.attackPressed = true;
    state[control] = pressed;
  }

  function onKeyDown(e: KeyboardEvent) {
    const control = KEY_MAP[e.code];
    if (!control || !enabled) return;
    e.preventDefault();
    apply(control, true);
  }

  function onKeyUp(e: KeyboardEvent) {
    const control = KEY_MAP[e.code];
    if (!control) return;
    apply(control, false);
  }

  return {
    state,
    attach() {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
    },
    detach() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
    set(control, pressed) {
      if (!enabled && pressed) return;
      apply(control, pressed);
    },
    setEnabled(value) {
      enabled = value;
      if (!value) {
        state.left = state.right = state.jump = state.attack = false;
        state.jumpPressed = state.attackPressed = false;
      }
    },
  };
}
