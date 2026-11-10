import { useEffect, useRef } from "react";

/**
 * Backdrop shown behind the page card while it changes pages: black, with a
 * faint red glitch (20–30% opacity) — horizontal tear bands, a few stray
 * pixel blocks and thin scanlines, redrawn at 24fps so it flickers.
 */
const FPS = 24;
const RED = "239, 68, 68";
const alpha = () => (0.2 + Math.random() * 0.1).toFixed(3); // 20–30%

export default function SkyBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // Tear bands: a few horizontal slices, offset sideways
      const bands = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < bands; i++) {
        const y = Math.random() * h, bh = 2 + Math.random() * Math.random() * 36;
        const bw = w * (0.2 + Math.random() * 0.8), x = Math.random() * (w - bw);
        ctx.fillStyle = `rgba(${RED}, ${alpha()})`;
        ctx.fillRect(x, y, bw, bh);
      }

      // Stray pixel blocks on a coarse grid
      const cell = 22, blocks = 10 + Math.floor(Math.random() * 14);
      for (let i = 0; i < blocks; i++) {
        const x = Math.floor((Math.random() * w) / cell) * cell, y = Math.floor((Math.random() * h) / cell) * cell;
        const span = 1 + Math.floor(Math.random() * 4);
        ctx.fillStyle = `rgba(${RED}, ${alpha()})`;
        ctx.fillRect(x, y, cell * span, cell);
      }

      // Hairline scanlines
      ctx.fillStyle = `rgba(${RED}, 0.2)`;
      for (let i = 0; i < 2; i++) ctx.fillRect(0, Math.random() * h, w, 1);
    };

    let raf = 0, last = -Infinity;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      draw();
    };
    draw();
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="sky-backdrop" aria-hidden="true" />;
}
