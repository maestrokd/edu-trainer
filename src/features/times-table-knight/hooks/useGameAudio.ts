import { useMemo, useRef } from "react";

export interface GameAudio {
  correct(): void;
  wrong(): void;
  coin(): void;
  hit(): void;
  forgeUp(): void;
  forgeDown(): void;
  checkpoint(): void;
  fanfare(): void;
  buzz(): void;
}

/**
 * Tiny WebAudio blips — multi-channel feedback (§6.4) without asset loading.
 * Deliberately a React hook outside game/: the engine stays I/O-free.
 */
export function useGameAudio(soundOn: boolean, hapticsOn: boolean): GameAudio {
  const ctxRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(soundOn);
  const hapticsRef = useRef(hapticsOn);
  soundRef.current = soundOn;
  hapticsRef.current = hapticsOn;

  return useMemo<GameAudio>(() => {
    function audioCtx(): AudioContext | null {
      if (!soundRef.current) return null;
      if (!ctxRef.current) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
      }
      if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
      return ctxRef.current;
    }

    function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
      const ctx = audioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + dur + 0.02);
    }

    function vibrate(pattern: number | number[]) {
      if (hapticsRef.current && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    }

    return {
      correct() {
        tone(660, 0, 0.12);
        tone(880, 0.1, 0.16);
        vibrate(30);
      },
      wrong() {
        tone(196, 0, 0.28, "square", 0.05);
        vibrate([60, 40, 60]);
      },
      coin() {
        tone(1320, 0, 0.09, "triangle", 0.06);
      },
      hit() {
        tone(110, 0, 0.2, "sawtooth", 0.07);
        vibrate(80);
      },
      forgeUp() {
        tone(523, 0, 0.1, "triangle");
        tone(784, 0.09, 0.18, "triangle");
      },
      forgeDown() {
        tone(392, 0, 0.12, "triangle", 0.06);
        tone(262, 0.11, 0.2, "triangle", 0.06);
      },
      checkpoint() {
        tone(523, 0, 0.1);
        tone(659, 0.09, 0.1);
        tone(784, 0.18, 0.2);
      },
      fanfare() {
        tone(523, 0, 0.14);
        tone(659, 0.12, 0.14);
        tone(784, 0.24, 0.14);
        tone(1047, 0.36, 0.4);
        vibrate([50, 40, 50, 40, 120]);
      },
      buzz() {
        tone(150, 0, 0.15, "square", 0.04);
      },
    };
  }, []);
}
