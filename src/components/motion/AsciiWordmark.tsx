import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion, useSpring, type AnimationPlaybackControls } from "motion/react";

const FONT_FAMILY = '"Space Grotesk Variable", system-ui, sans-serif';
const INK = "#ffffff";
const ACCENT = "#ef4444";
const RADIUS = 130; // px radius of the round lens under the pointer

type Cell = { x: number; y: number; k: 0 | 1 | 2 }; // 0 = "-", 1 = "|", 2 = "="

/**
 * Big wordmark woven from tiny "-", "|" and "=" marks laid on a grid inside
 * the letter shapes. Hovering puts a round fisheye lens under the cursor:
 * marks are only pushed outward (never resized). On leave the lens snaps back
 * on an underdamped spring, so the marks wobble in and out before settling.
 */
export default function AsciiWordmark({ text }: { text: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(-9999);
  const py = useMotionValue(-9999);
  const power = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 20 });
  const sy = useSpring(py, { stiffness: 140, damping: 20 });

  useEffect(() => {
    const box = wrap.current!;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cells: Cell[] = [];
    let w = 0, h = 0, cw = 8, ch = 10;
    let raf = 0, inside = false, visible = true, alive = true;

    const glyph = (k: number, x: number, y: number) => {
      const t = Math.max(1.5, cw * 0.24);
      if (k === 1) ctx.fillRect(x - t / 2, y - ch * 0.36, t, ch * 0.72);
      else if (k === 2) {
        ctx.fillRect(x - cw * 0.39, y - t * 1.1, cw * 0.78, t);
        ctx.fillRect(x - cw * 0.39, y + t * 0.1, cw * 0.78, t);
      } else ctx.fillRect(x - cw * 0.39, y - t / 2, cw * 0.78, t);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // s is 1 while hovering; after leaving it oscillates around 0 (negative = pulled inward).
      const mx = sx.get(), my = sy.get(), s = power.get();
      const R2 = RADIUS * RADIUS;
      const active = Math.abs(s) > 0.002;

      // Untouched marks
      ctx.fillStyle = INK;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (active) {
          const dx = c.x - mx, dy = c.y - my;
          if (dx * dx + dy * dy < R2) continue;
        }
        glyph(c.k, c.x, c.y);
      }
      if (!active) return;

      // Marks under the lens: a round fisheye bulge — positions shift outward
      // from the pointer, sizes stay the same.
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const dx = c.x - mx, dy = c.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 >= R2) continue;
        const d = Math.sqrt(d2) || 0.001;
        const t = d / RADIUS; // 0 at centre → 1 at rim
        const bulged = RADIUS * Math.pow(t, 0.62);
        const nd = d + (bulged - d) * s;
        ctx.fillStyle = (1 - t) * s > 0.35 ? ACCENT : INK;
        glyph(c.k, mx + (dx / d) * nd, my + (dy / d) * nd);
      }
    };

    const build = () => {
      if (!alive) return;
      w = box.clientWidth;
      if (w === 0) return;

      // Fit the word to the full width using its real ink bounds.
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.font = `700 100px ${FONT_FAMILY}`;
      const m = probe.measureText(text);
      const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const scale = w / inkW;
      h = Math.ceil((m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * scale);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.height = `${h}px`;

      // Rasterise the word once and sample it on a grid.
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const mc = mask.getContext("2d", { willReadFrequently: true })!;
      mc.setTransform(scale, 0, 0, scale, m.actualBoundingBoxLeft * scale, m.actualBoundingBoxAscent * scale);
      mc.font = `700 100px ${FONT_FAMILY}`;
      mc.fillText(text, 0, 0);
      const data = mc.getImageData(0, 0, w, h).data;

      cw = Math.max(6, Math.round(w / 150));
      ch = Math.round(cw * 1.3);
      cells = [];
      let r = 0;
      for (let y = ch / 2; y < h; y += ch, r++) {
        let c = 0;
        for (let x = cw / 2; x < w; x += cw, c++) {
          if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] < 128) continue;
          const k = (r + c) % 2 === 1 ? 1 : c % 6 === 0 ? 2 : 0;
          cells.push({ x, y, k: k as Cell["k"] });
        }
      }
      draw();
    };

    const loop = () => {
      raf = 0;
      if (!alive) return;
      draw();
      if (visible && (inside || power.isAnimating() || Math.abs(power.get()) > 0.002)) {
        raf = requestAnimationFrame(loop);
      }
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    let lens: AnimationPlaybackControls | null = null;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!inside) {
        inside = true;
        sx.jump(x);
        sy.jump(y);
        // Lens opens smoothly, no overshoot.
        lens?.stop();
        lens = animate(power, 1, { type: "spring", bounce: 0, visualDuration: 0.35 });
      }
      px.set(x);
      py.set(y);
      wake();
    };
    const onLeave = () => {
      inside = false;
      // Release: an underdamped spring makes the marks bounce in/out and settle.
      lens?.stop();
      lens = animate(power, 0, { type: "spring", stiffness: 320, damping: 7, mass: 1 });
      wake();
    };

    const ro = new ResizeObserver(build);
    ro.observe(box);
    document.fonts.ready.then(build);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);
    if (!reduce) {
      box.addEventListener("pointermove", onMove);
      box.addEventListener("pointerleave", onLeave);
    }

    return () => {
      alive = false;
      lens?.stop();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
    };
  }, [text, reduce, px, py, power, sx, sy]);

  return (
    <div className="wordmark" ref={wrap} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
