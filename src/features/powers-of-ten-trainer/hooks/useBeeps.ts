import React from "react";

export function useBeeps(enabled: boolean) {
  const contextRef = React.useRef<AudioContext | null>(null);

  const beep = React.useCallback(
    async (frequency: number, durationMs = 110) => {
      if (!enabled) return;
      const AudioContextCtor = globalThis.AudioContext;
      if (!AudioContextCtor) return;
      const context = contextRef.current ?? new AudioContextCtor();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.05;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + durationMs / 1000);
    },
    [enabled]
  );

  React.useEffect(
    () => () => {
      void contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    },
    []
  );

  return { beep };
}
