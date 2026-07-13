import { useEffect, type RefObject } from "react";

/**
 * Keeps the canvas backing store in sync with its CSS size × devicePixelRatio.
 * The engine derives its world scale from canvas.height each frame, so no
 * engine notification is needed on resize.
 */
export function useResponsiveCanvas(
  containerRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const sync = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { clientWidth, clientHeight } = container;
      const width = Math.max(1, Math.round(clientWidth * dpr));
      const height = Math.max(1, Math.round(clientHeight * dpr));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, canvasRef]);
}
