import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const CELL = 16; // size of one cloud block
const DOT = 4; // size of a dither dot inside a block
const STEP_MS = 140; // stepped redraw for a chunky, 8-bit drift
const TINT = "0, 0, 0"; // black — clouds read darker than the #171717 background

// ── Small seeded value-noise ─────────────────────────────────────
const PERM = new Uint8Array(512);
{
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 256; i++) PERM[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [PERM[i], PERM[j]] = [PERM[j], PERM[i]];
  }
  for (let i = 0; i < 256; i++) PERM[i + 256] = PERM[i];
}
const hash = (x: number, y: number) => PERM[PERM[x & 255] + (y & 255)] / 255;
function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Dithered pixel clouds that drift slowly around the edges of the hero,
 * leaving the centre clear for the headline. Black tints, darker than the background.
 */
export default function PixelSky() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let cols = 0, rows = 0, timer = 0, visible = true;
    const t0 = performance.now();

    // Fixed to the viewport, so it sizes to the window rather than a section
    const resize = () => {
      cols = Math.ceil(window.innerWidth / CELL);
      rows = Math.ceil(window.innerHeight / CELL);
      canvas.width = cols * CELL;
      canvas.height = rows * CELL;
      draw();
    };

    const dither = (x: number, y: number, alpha: number) => {
      ctx.fillStyle = `rgba(${TINT}, ${alpha})`;
      for (let dy = 0; dy < CELL; dy += DOT) {
        for (let dx = (dy / DOT) % 2 === 0 ? 0 : DOT; dx < CELL; dx += DOT * 2) {
          ctx.fillRect(x + dx, y + dy, DOT, DOT);
        }
      }
    };

    function draw() {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let r = 0; r < rows; r++) {
        const ny = ((r + 0.5) / rows) * 2 - 1;
        for (let c = 0; c < cols; c++) {
          const nx = ((c + 0.5) / cols) * 2 - 1;
          // Keep an oval in the middle clear for the text.
          const edge = smooth(0.7, 1.25, Math.sqrt((nx / 0.66) ** 2 + (ny / 0.78) ** 2));
          if (edge <= 0) continue;
          const v = fbm(c * 0.07 + t * 0.05, r * 0.09 - t * 0.015) * edge * 1.55;
          if (v < 0.42) continue;
          const x = c * CELL, y = r * CELL;
          if (v < 0.52) dither(x, y, 0.55);
          else {
            const a = v < 0.62 ? 0.3 : v < 0.74 ? 0.55 : 0.8;
            ctx.fillStyle = `rgba(${TINT}, ${a})`;
            ctx.fillRect(x, y, CELL, CELL);
            if (v >= 0.62 && v < 0.68) dither(x, y, 0.45); // textured transition band
          }
        }
      }
    }

    const tick = () => {
      if (visible) draw();
      timer = window.setTimeout(tick, STEP_MS);
    };

    window.addEventListener("resize", resize);
    resize();
    // Pause redraws while the tab is hidden
    const onVis = () => (visible = !document.hidden);
    document.addEventListener("visibilitychange", onVis);
    if (!reduce) timer = window.setTimeout(tick, STEP_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce]);

  return <canvas ref={ref} className="pixel-sky" aria-hidden="true" />;
}
