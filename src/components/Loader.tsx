import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";

/**
 * Loading screen after mariavasilyeva.com: three hairline-framed bands, each
 * with five serif lines that slide in from the left on a sharp in-out curve,
 * dragging a fading trail of repeated first and last letters behind them. Once
 * a line rests it leaves to the right and comes back in. A percentage counter
 * and two edge bars track the preload; when everything is in and every line
 * has landed once, the screen wipes away from the bottom up.
 *
 * The motion constants are theirs (D, HOLD, STEP, SEP, stamps, windows…).
 */

// ── Timing / trail constants (from their loader worker) ──
const D = 2150, HOLD = 780, STEP = 100, SEP = 200;
const STAMPS = 28, ESTAMPS = 44, PITCH = 0.66, TGAP = 1.1;
const TWINDOW = 670, EWINDOW = 1070, TALPHA = 0.5, TMERGE0 = 0.3, TMERGE1 = 0.97;
const REVEAL_MS = 1500;

const ease6 = (t: number) => (t < 0.5 ? 32 * t ** 6 : 1 - 32 * (1 - t) ** 6);
const easeO1 = (t: number) => Math.sin(t * Math.PI * 0.5);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const merge = (t: number) => clamp01((TMERGE1 - ease6(t)) / (TMERGE1 - TMERGE0));

// Left edge of each line as a share of the viewport width, per band (their staggered layout)
const BANDS = [
  [0.66, 0.45, 0.34, 0.47, 0.58],
  [0.62, 0.41, 0.31, 0.43, 0.52],
  [0.45, 0.24, 0.13, 0.26, 0.37],
];

/** Assets worth having before the page shows */
const PRELOAD = ["/images/background1.jpg", "/images/background2.jpg", "/images/me.png", "/images/fw-nav.png"];

type Line = {
  t: string; lead: string; end: string;
  tx: number; y: number; right: number; size: number;
  lw: number; ew: number; eo: number;
  phase: "wait" | "enter" | "rest"; until: number; t0: number;
  ta: number; landed: boolean; hist: number[];
};
type Ghost = Line & { from: number; travel: number };

// Position at a past time from the [t, x, t, x, …] history
function at(h: number[], time: number) {
  if (time <= h[0]) return h[1];
  for (let i = h.length - 2; i >= 2; i -= 2) {
    if (h[i] <= time) {
      const k = (time - h[i]) / ((h[i + 2] ?? h[i]) - h[i] || 1);
      return h[i + 1] + ((h[i + 3] ?? h[i + 1]) - h[i + 1]) * k;
    }
  }
  return h[1];
}

export default function Loader({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const { t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const [bands, setBands] = useState<number[]>([]); // hairline y positions
  const linesText = useRef(t.loader.lines);

  useEffect(() => {
    const root = rootRef.current!, canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ef4444";
    const isZh = document.documentElement.lang.startsWith("zh");
    const family = '"Instrument Serif", "Noto Sans SC", Georgia, serif';

    let W = 0, H = 0, lines: Line[] = [];
    const ghosts: Ghost[] = [];
    let raf = 0, alive = true, settled = false;

    // ── Layout: 3 bands × 5 lines, centred vertically ──
    const layout = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.fillStyle = accent;

      const size = Math.max(18, Math.min(34, W * 0.023));
      const lh = size * 0.88, band = lh * 5 + size * 0.5, gap = Math.max(18, size);
      const top0 = (H - (band * 3 + gap * 2)) / 2;
      const ls = isZh ? 0 : -0.04 * size;
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`;
      ctx.font = `${size}px ${family}`;

      const hair: number[] = [];
      const prev = lines;
      lines = [];
      BANDS.forEach((fr, b) => {
        const top = top0 + b * (band + gap);
        hair.push(top, top + band);
        fr.forEach((f, i) => {
          const raw = linesText.current[i];
          const text = isZh ? raw : raw.toUpperCase();
          const w = ctx.measureText(text).width;
          const tx = Math.max(16, Math.min(f * W, W - w - 16));
          const lead = text.charAt(0), end = text.charAt(text.length - 1);
          const ew = ctx.measureText(end).width;
          const old = prev[b * 5 + i];
          lines.push({
            t: text, lead, end, tx, y: top + size * 0.25 + i * lh, right: tx + w, size,
            lw: ctx.measureText(lead).width, ew, eo: w - ew,
            phase: old?.phase ?? "wait", until: old?.until ?? 0, t0: old?.t0 ?? 0,
            ta: old?.ta ?? 1, landed: old?.landed ?? false, hist: [],
          });
        });
      });
      setBands(hair);
    };

    // ── Trail of repeated letters behind a moving line ──
    const stamps = (l: Line, x: number, now: number, k: number, ch: string, off: number, cw: number, n: number, win: number) => {
      const from = k > 0 ? at(l.hist, now - win * k) : x;
      const span = x - from;
      if (span <= 1) return;
      const fade = l.size * PITCH * 2, minGap = Math.max(cw, l.size * 0.55) * TGAP;
      let last = x;
      for (let o = 1; o <= n; o++) {
        const p = Math.min(x - span * (1 - easeO1(1 - o / n)), last - minGap);
        if (p <= from) break;
        last = p;
        const a = l.ta * (1 - o / n) * Math.min(1, (p - from) / fade);
        if (a <= 0.01) continue;
        const px = p + off;
        if (px + cw < 0) break;
        if (px < W) { ctx.globalAlpha = a; ctx.fillText(ch, px, l.y); }
      }
    };
    const draw = (l: Line, x: number, now: number, k: number) => {
      l.hist.push(now, x);
      const cut = now - Math.max(TWINDOW, EWINDOW) - 100;
      while (l.hist.length > 4 && l.hist[2] < cut) l.hist.splice(0, 2);
      stamps(l, x, now, k, l.lead, 0, l.lw, STAMPS, TWINDOW);
      if (l.end) stamps(l, x, now, k, l.end, l.eo, l.ew, ESTAMPS, EWINDOW);
      ctx.globalAlpha = 1;
      ctx.fillText(l.t, x, l.y);
    };
    const travel = (l: Line) => l.tx + l.right + Math.max(0, SEP - 2 * l.tx);

    const frame = (now: number) => {
      if (!alive) return;
      ctx.clearRect(0, 0, W, H);
      let all = true;
      for (const l of lines) {
        let x = l.tx, k = 0;
        if (l.phase === "wait") {
          all = false;
          if (now < l.until) continue;
          l.phase = "enter"; l.t0 = now; l.hist.length = 0;
        }
        if (l.phase === "enter") {
          const p = Math.min((now - l.t0) / D, 1);
          x = l.tx - travel(l) * (1 - ease6(p));
          k = merge(p);
          if (p >= 1) { l.phase = "rest"; l.until = now + HOLD * (0.3 + Math.random() * 1.3); l.landed = true; }
        } else if (l.phase === "rest" && now >= l.until) {
          // leave to the right as a ghost, re-enter from the left
          ghosts.push({ ...l, hist: [], from: l.tx, travel: W - l.tx + 60, t0: now });
          l.phase = "enter"; l.t0 = now; l.hist.length = 0;
          l.ta = TALPHA + Math.random() * (1 - TALPHA);
          x = l.tx - travel(l);
        }
        draw(l, x, now, k);
        if (!l.landed) all = false;
      }
      for (let i = ghosts.length - 1; i >= 0; i--) {
        const g = ghosts[i];
        const p = Math.min((now - g.t0) / D, 1);
        draw(g, g.from + g.travel * ease6(p), now, merge(p));
        if (p >= 1) ghosts.splice(i, 1);
      }
      if (all) settled = true;
      raf = requestAnimationFrame(frame);
    };

    // ── Preload + percentage ──
    let loaded = 0, assetsDone = false, shown = 0, elapsed = 0, prevT = performance.now();
    const total = PRELOAD.length + 1;
    const bump = () => { loaded++; if (loaded >= total) assetsDone = true; };
    PRELOAD.forEach((src) => { const im = new Image(); im.onload = im.onerror = bump; im.src = src; });
    document.fonts.ready.then(bump);

    let finishing = false;
    const setPct = (v: number) => {
      const n = Math.round(v);
      if (pctRef.current && n > +(pctRef.current.textContent || 0)) pctRef.current.textContent = String(n);
      barsRef.current?.style.setProperty("--p", String(v / 100));
    };
    const tick = (now: number) => {
      if (!alive || finishing) return;
      elapsed += Math.min(now - prevT, 34); prevT = now;
      const timeCurve = 99 * (1 - Math.exp(-elapsed / 3600));
      const real = (loaded / total) * 92;
      shown += (Math.min(99, Math.max(timeCurve, real)) - shown) * 0.08;
      setPct(shown);
      if (assetsDone && (settled || reduce) && elapsed > 900) finish();
      else requestAnimationFrame(tick);
    };

    // Sweep to 100, mount the page underneath, then wipe the loader away bottom → top
    const finish = () => {
      finishing = true;
      const from = shown, t0 = performance.now();
      const sweep = (now: number) => {
        const p = clamp01((now - t0) / 300);
        setPct(from + (100 - from) * (1 - (1 - p) ** 2));
        if (p < 1) return requestAnimationFrame(sweep);
        onReveal();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const anim = root.animate(
            [{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
            { duration: reduce ? 400 : REVEAL_MS, easing: "cubic-bezier(.77, 0, .175, 1)", fill: "forwards" },
          );
          anim.onfinish = () => onDone();
        }));
      };
      requestAnimationFrame(sweep);
    };

    let started = false;
    const start = () => {
      if (started || !alive) return;
      started = true;
      layout();
      const t0 = performance.now();
      lines.forEach((l, i) => {
        l.until = t0 + i * STEP * (0.4 + Math.random());
        l.ta = TALPHA + Math.random() * (1 - TALPHA);
        if (reduce) { l.phase = "rest"; l.landed = true; l.until = Infinity; }
      });
      raf = requestAnimationFrame(frame);
    };
    // Lines use the serif, so wait for it (but never hang on a slow font)
    Promise.race([document.fonts.load(`32px ${family}`), new Promise((r) => setTimeout(r, 800))]).then(start);
    requestAnimationFrame(tick);

    const onResize = () => { if (started) layout(); };
    addEventListener("resize", onResize);
    document.documentElement.classList.add("is-loading");

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.documentElement.classList.remove("is-loading");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="loader" aria-busy="true" aria-label="Loading">
      {bands.map((y, i) => <span key={i} className="loader__hair" style={{ top: y }} aria-hidden="true" />)}
      <canvas ref={canvasRef} className="loader__canvas" aria-hidden="true" />
      <div ref={barsRef} className="loader__bars" aria-hidden="true"><span /><span /></div>
      <div className="loader__pct" aria-hidden="true">
        <span>▸</span> <span ref={pctRef}>0</span>%
      </div>
    </div>
  );
}
