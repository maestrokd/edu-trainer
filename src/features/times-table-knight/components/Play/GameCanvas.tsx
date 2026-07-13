import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { GameConfig } from "../../model/game.types";
import type { Engine, GameEvents, TouchControl } from "../../game/events";
import { createEngine } from "../../game/engine";
import { useResponsiveCanvas } from "../../hooks/useResponsiveCanvas";

interface GameCanvasProps {
  config: GameConfig;
  /** Practice: creature count from the fact plan; ignored in Adventure */
  practiceCreatureCount?: number;
  seed?: number;
  events?: Partial<GameEvents>;
  /** hands the live engine to the controller; called with null on unmount */
  onEngineReady?: (engine: Engine | null) => void;
  className?: string;
}

const TOUCH_BUTTONS: { control: TouchControl; symbol: string; labelKey: string }[] = [
  { control: "left", symbol: "◀", labelKey: "timesTableKnight.play.touch.left" },
  { control: "right", symbol: "▶", labelKey: "timesTableKnight.play.touch.right" },
  { control: "jump", symbol: "⤒", labelKey: "timesTableKnight.play.touch.jump" },
  { control: "attack", symbol: "⚔", labelKey: "timesTableKnight.play.touch.attack" },
];

export function GameCanvas({
  config,
  practiceCreatureCount = 0,
  seed,
  events,
  onEngineReady,
  className,
}: GameCanvasProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  // latest events without re-creating the engine on every render
  const eventsRef = useRef<Partial<GameEvents> | undefined>(events);
  eventsRef.current = events;

  useResponsiveCanvas(containerRef, canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const proxyEvents = new Proxy({} as Partial<GameEvents>, {
      get(_target, prop: string) {
        return (...args: unknown[]) => {
          const handler = eventsRef.current?.[prop as keyof GameEvents] as ((...a: unknown[]) => void) | undefined;
          handler?.(...args);
        };
      },
    });

    const engine = createEngine(
      canvas,
      {
        mode: config.mode,
        level: config.level,
        hero: config.hero,
        skin: config.skin,
        reducedMotion: config.effects.reducedMotion,
        practiceCreatureCount,
        seed: seed ?? Date.now() % 2147483647,
      },
      proxyEvents
    );
    engineRef.current = engine;
    onEngineReady?.(engine);
    engine.start();
    canvas.focus();

    return () => {
      onEngineReady?.(null);
      engineRef.current = null;
      engine.destroy();
    };
    // the engine lives for the whole session; config is fixed once playing starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = (control: TouchControl, pressed: boolean) => () => {
    engineRef.current?.setTouchControl(control, pressed);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div ref={containerRef} className="w-full aspect-video max-h-[70dvh] rounded-xl overflow-hidden border bg-black">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label={t("timesTableKnight.play.canvasAria")}
          className="w-full h-full outline-none"
        />
      </div>

      <div className="mt-2 flex justify-between gap-2 sm:hidden" aria-hidden={false}>
        <div className="flex gap-2">
          {TOUCH_BUTTONS.slice(0, 2).map(({ control, symbol, labelKey }) => (
            <TouchButton key={control} symbol={symbol} label={t(labelKey)} press={press(control, true)} release={press(control, false)} />
          ))}
        </div>
        <div className="flex gap-2">
          {TOUCH_BUTTONS.slice(2).map(({ control, symbol, labelKey }) => (
            <TouchButton key={control} symbol={symbol} label={t(labelKey)} press={press(control, true)} release={press(control, false)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TouchButton({
  symbol,
  label,
  press,
  release,
}: {
  symbol: string;
  label: string;
  press: () => void;
  release: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="size-14 rounded-full border bg-muted/70 text-2xl font-bold active:bg-primary/30 select-none touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        press();
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {symbol}
    </button>
  );
}
