import { useEffect, useRef } from "react";
import type { Hero, SkinId } from "../../model/game.types";
import type { Knight } from "../../game/entities";
import { drawKnight } from "../../game/render";
import { KNIGHT_HEIGHT, KNIGHT_WIDTH } from "../../model/game.constants";

interface KnightPreviewProps {
  hero: Hero;
  skin: SkinId;
  size?: number;
}

/** static render of the hero with the chosen armor color, straight from the engine art */
export function KnightPreview({ hero, skin, size = 72 }: KnightPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const knight: Knight = {
      rect: { x: -KNIGHT_WIDTH / 2, y: 0, w: KNIGHT_WIDTH, h: KNIGHT_HEIGHT },
      vel: { x: 0, y: 0 },
      facing: 1,
      onGround: true,
      attackTimer: 0,
      attackCooldown: 0,
      invulnTimer: 0,
      bootsTimer: 0,
      magnetTimer: 0,
      walkPhase: 0,
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = (size / (KNIGHT_HEIGHT + 14)) * dpr;
    ctx.setTransform(scale, 0, 0, scale, (size * dpr) / 2, 8 * (scale / dpr));
    drawKnight(ctx, knight, hero, skin, 1, 1, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [hero, skin, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} aria-hidden />;
}
