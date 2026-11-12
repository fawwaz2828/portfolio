import { useEffect, useRef } from "react";

/**
 * ASCII lens over a photo, in the same glyph style as the Contact hands
 * (handsField.ts): every cell is a random A–Z/0–9 character coloured from a
 * dark → deep red → accent → pale ramp of its brightness, ~9% of them keep
 * re-rolling, and the ones right under the pointer flash pale.
 *
 * Drop it inside a positioned element that also holds the <img>; it listens
 * to that parent. Only a soft circle around the cursor turns into glyphs, the
 * rest of the photo stays normal. The lens grows in on enter, trails the
 * pointer and shrinks away on leave. Fine pointers only; skipped for reduced
 * motion.
 */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const STEP_X = 5;                    // cell width (px)
const FONT = STEP_X / 1.25 / 0.6;    // same proportions as the hands field
const LINE_H = FONT * 1.3;
const FPS = 60;

type RGB = [number, number, number];
const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const hexToRgb = (s: string): RGB => {
  const m = s.trim().match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [239, 68, 68];
};

type Cell = { cx: number; cy: number; col: string; seed: number; live: boolean; tw: number };

export default function AsciiOverlay({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!, host = canvas.parentElement!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(any-pointer: fine)").matches) return;
    const ctx = canvas.getContext("2d")!;
    const A = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#ef4444");
    // the hands' colour ramp
    const dark: RGB = [30, 22, 22];
    const deep: RGB = [mix(0, A[0], 0.6), mix(0, A[1], 0.6), mix(0, A[2], 0.6)];
    const light: RGB = [mix(A[0], 255, 0.55), mix(A[1], 255, 0.55), mix(A[2], 255, 0.55)];
    const ramp: [number, ...RGB][] = [[0, ...dark], [0.22, ...deep], [0.5, ...A], [1, ...light]];
    const at = (v: number): RGB => {
      for (let i = 1; i < ramp.length; i++) if (v <= ramp[i][0]) {
        const p = ramp[i - 1], q = ramp[i], k = (v - p[0]) / (q[0] - p[0]);
        return [mix(p[1], q[1], k), mix(p[2], q[2], k), mix(p[3], q[3], k)];
      }
      return ramp[ramp.length - 1].slice(1) as RGB;
    };
    const lightCol = `rgb(${light.join(",")})`;

    let grid: Cell[][] | null = null, cols = 0, rows = 0, w = 0, h = 0;
    let raf = 0, last = 0, hovering = false, running = false;
    // pointer target (tx, ty), smoothed lens centre (x, y), lens radius r
    const lens = { tx: 0, ty: 0, x: 0, y: 0, r: 0 };
    const img = new Image();
    img.decoding = "async";
    img.src = src;

    const build = () => {
      if (!img.naturalWidth) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = host.clientWidth; h = host.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / STEP_X); rows = Math.ceil(h / LINE_H);
      // cover-crop the image into a cols × rows grid
      const s = document.createElement("canvas");
      s.width = cols; s.height = rows;
      const g = s.getContext("2d", { willReadFrequently: true })!;
      const ir = img.naturalWidth / img.naturalHeight, br = w / h;
      let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
      if (ir > br) { sw = sh * br; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (img.naturalHeight - sh) / 2; }
      g.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      const d = g.getImageData(0, 0, cols, rows).data;
      const lum = new Float32Array(cols * rows);
      for (let i = 0; i < lum.length; i++) {
        const l = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        lum[i] = Math.max(0, Math.min(255, (l - 128) * 1.3 + 128)); // same contrast boost as the hands
      }
      // stretch between the 4th and 96th percentile, like the hands
      const sorted = Array.from(lum).sort((a, b) => a - b);
      const lo = sorted[Math.floor(sorted.length * 0.04)], hi = sorted[Math.floor(sorted.length * 0.96)];
      const span = Math.max(1, hi - lo);
      grid = [];
      for (let y = 0; y < rows; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < cols; x++) {
          const v = Math.max(0, Math.min(1, (lum[y * cols + x] - lo) / span));
          row.push({
            cx: x * STEP_X + STEP_X / 2, cy: y * LINE_H + LINE_H / 2,
            col: `rgb(${at(v).join(",")})`,
            seed: (Math.random() * 1000) | 0, live: Math.random() < 0.09, tw: 170 + Math.random() * 340,
          });
        }
        grid.push(row);
      }
    };

    const draw = (ms: number) => {
      ctx.clearRect(0, 0, w, h);
      const R = lens.r;
      if (!grid || R < 1) return;
      const { x: px, y: py } = lens;

      // dark disc behind the glyphs (the Contact background), soft rim into the photo
      const bg = ctx.createRadialGradient(px, py, 0, px, py, R);
      bg.addColorStop(0, "rgba(11, 11, 11, 1)");
      bg.addColorStop(0.72, "rgba(11, 11, 11, 0.95)");
      bg.addColorStop(1, "rgba(11, 11, 11, 0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();

      ctx.font = `700 ${FONT.toFixed(2)}px "Space Mono", ui-monospace, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const tick = Math.floor(ms / 42);
      const x0 = Math.max(0, Math.floor((px - R) / STEP_X)), x1 = Math.min(cols - 1, Math.ceil((px + R) / STEP_X));
      const y0 = Math.max(0, Math.floor((py - R) / LINE_H)), y1 = Math.min(rows - 1, Math.ceil((py + R) / LINE_H));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const c = grid[y][x];
        const k = Math.hypot(c.cx - px, c.cy - py) / R; // 0 centre → 1 rim
        if (k >= 1) continue;
        ctx.globalAlpha = k < 0.72 ? 1 : 1 - (k - 0.72) / 0.28;
        if (k < 0.18) { // right under the pointer: pale, fast-scrambling (as on the hands)
          ctx.fillStyle = lightCol;
          ctx.fillText(CHARS[(c.seed + tick) % 36], c.cx, c.cy);
          continue;
        }
        ctx.fillStyle = c.col;
        ctx.fillText(CHARS[(c.live ? c.seed + Math.floor(ms / c.tw) : c.seed) % 36], c.cx, c.cy);
      }
      ctx.globalAlpha = 1;
    };

    const target = () => (hovering ? Math.min(w, h) * 0.26 : 0);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS - 1) return;
      last = now;
      lens.x += (lens.tx - lens.x) * 0.25;
      lens.y += (lens.ty - lens.y) * 0.25;
      lens.r += (target() - lens.r) * 0.18;
      draw(now);
      if (!hovering && lens.r < 0.5) { lens.r = 0; ctx.clearRect(0, 0, w, h); cancelAnimationFrame(raf); running = false; }
    };
    const run = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };

    const local = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const enter = (e: PointerEvent) => {
      if (!grid) build();
      const p = local(e);
      lens.tx = p.x; lens.ty = p.y;
      if (lens.r < 1) { lens.x = p.x; lens.y = p.y; } // grow from where the cursor came in
      hovering = true;
      host.classList.add("is-ascii");
      run();
    };
    const move = (e: PointerEvent) => { const p = local(e); lens.tx = p.x; lens.ty = p.y; };
    const leave = () => { hovering = false; host.classList.remove("is-ascii"); };

    img.onload = () => { grid = null; };
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    const ro = new ResizeObserver(() => { grid = null; });
    ro.observe(host);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.classList.remove("is-ascii");
    };
  }, [src]);

  return <canvas ref={ref} className="ascii-overlay" aria-hidden="true" />;
}
