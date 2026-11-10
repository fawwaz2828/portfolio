/**
 * Two reaching hands rendered as a field of monospace glyphs, ported from
 * anthracitestudio.be's hands-field.js (re-coloured to the red accent).
 *
 * - The hands image is sampled into a grid; each cell becomes a character
 *   whose colour comes from a dark → accent → light ramp of its luminance.
 * - Cells scramble in from the centre outward on first view.
 * - `rise` lifts the hands to the middle, `open` spreads them apart,
 *   `contact` slides the halves together until the fingertips meet (with a
 *   flash), `part` pulls them apart again afterwards, `wave` sends a ring
 *   out from the touch point (revealing the logo in the gap).
 * - A faint field of flickering glyphs fills the background; the pointer
 *   lights up glyphs around it.
 */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MONO = `"Space Mono", ui-monospace, monospace`;
const LOOP = 12;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
type RGB = [number, number, number];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = { cx: number; cy: number; c: RGB; col: string; ch: string; thr: number; seed: number; live: boolean; tw: number };
type EmblemCell = { dx: number; dy: number; col: string; ch: string; seed: number; live: boolean; tw: number; jitter: number };
type FieldCell = { x: number; y: number; seed: number; a: number; rate: number; ph: number };

export class HandsField {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private img: HTMLImageElement;
  private accent: RGB;
  private bg: string;
  private crop: { sy: number; sh: number };
  private portrait = false;
  private hands!: {
    font: number; lt: RGB; w: number; h: number; stepX: number;
    tipL: { cx: number; cy: number }; tipR: { cx: number; cy: number };
    midCol: string; cells: Cell[];
  };
  private field!: { cells: FieldCell[]; font: number };
  private emblemImg: HTMLImageElement | null = null;
  private emblem: { cells: EmblemCell[]; font: number; lt: RGB } | null = null;
  private last = -1;
  private drawnPose = "";

  open = 0.22; rise = 0; contact = 0; part = 0; wave = 0;
  /** Where the hands settle vertically once fully risen (share of the height) */
  restY = 0.5;
  pointer = { x: 0.5, y: 0.5, on: 0 };

  constructor(img: HTMLImageElement, accent: RGB, bg: string) {
    this.img = img; this.accent = accent; this.bg = bg;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
    this.crop = this.computeCrop();
  }

  private lum(d: Uint8ClampedArray, i: number) {
    return Math.max(0, Math.min(255, (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] - 128) * 1.3 + 128));
  }

  /** Trim empty rows above/below the hands */
  private computeCrop() {
    const e = this.img, W = 400, H = Math.round((e.height * W) / e.width);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d")!; g.drawImage(e, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H).data;
    let top = H, bot = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < 16 || this.lum(d, i) > 250) continue;
      top = Math.min(top, y); bot = Math.max(bot, y);
    }
    if (bot < 0) return { sy: 0, sh: e.height };
    const s = e.height / H, pad = (bot - top + 1) * 0.08, sy = Math.max(0, (top - pad) * s);
    return { sy, sh: Math.min(e.height, (bot + 1 + pad) * s) - sy };
  }

  resize(w: number, h: number) {
    if (w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = w; this.canvas.height = h;
    this.portrait = h > w;
    this.buildHands();
    this.buildField();
    this.buildEmblem();
    this.last = -1;
  }

  private buildHands() {
    const { img, crop, canvas } = this;
    const W = canvas.width, rand = rng(7);
    const w = this.portrait ? W * 1.8 : W * 1.25;
    const cols = this.portrait ? 260 : 270;
    const stepX = w / cols, font = stepX / 1.25 / 0.6, lineH = font * 1.3;
    const rows = Math.round((crop.sh / img.width) * cols * 0.6 * 1.25 / 1.3);
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, crop.sy, img.width, crop.sh, 0, 0, cols, rows);
    const d = g.getImageData(0, 0, cols, rows).data;

    const A = this.accent;
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

    const px: { x: number; y: number; l: number }[] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      if (d[i + 3] < 16) continue;
      const l = this.lum(d, i);
      if (l <= 250) px.push({ x, y, l });
    }
    const sorted = px.map((p) => p.l).sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.04)] ?? 0, hi = sorted[Math.floor(sorted.length * 0.96)] ?? 255;
    const span = Math.max(1, hi - lo);

    // Fingertips: innermost cell of each half
    let L: { x: number; y: number } | null = null, R: { x: number; y: number } | null = null;
    for (const p of px) {
      if (p.x < cols / 2) { if (!L || p.x > L.x) L = p; }
      else if (!R || p.x < R.x) R = p;
    }
    const tip = (p: { x: number; y: number } | null) =>
      p ? { cx: p.x * stepX + stepX / 2, cy: p.y * lineH + lineH / 2 } : { cx: w / 2, cy: (rows * lineH) / 2 };

    this.hands = {
      font, lt: light, w, h: rows * lineH, stepX, tipL: tip(L), tipR: tip(R),
      midCol: `rgb(${at(0.62).join(",")})`,
      cells: px.map((p) => {
        const c = at(clamp01((p.l - lo) / span));
        return {
          cx: p.x * stepX + stepX / 2, cy: p.y * lineH + lineH / 2, c, col: `rgb(${c.join(",")})`,
          ch: CHARS[(rand() * 36) | 0],
          thr: 0.16 * rand() + 0.84 * Math.abs(p.x / cols - 0.5) * 2,
          seed: (rand() * 1000) | 0, live: rand() < 0.09, tw: 170 + rand() * 340,
        };
      }),
    };
  }

  /** Logo revealed by the shock ring after the touch (their "emblem") */
  setEmblem(img: HTMLImageElement) {
    this.emblemImg = img;
    if (this.canvas.width) this.buildEmblem();
    this.last = -1;
  }

  private buildEmblem() {
    const img = this.emblemImg;
    if (!img) { this.emblem = null; return; }
    const { width: W, height: H } = this.canvas, rand = rng(23);
    const ratio = img.height / img.width;
    const hgt = Math.min(H * 0.46, W * (this.portrait ? 0.6 : 0.4) * ratio), wid = hgt / ratio;
    // Finer grid than theirs (30/44) so the FW strokes read clearly
    const cols = this.portrait ? 64 : 96, cw = wid / cols, font = cw / 0.75, rows = Math.max(1, Math.round(hgt / (font * 1.3)));
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0, cols, rows);
    const d = g.getImageData(0, 0, cols, rows).data;
    const A = this.accent, lt: RGB = [mix(A[0], 255, 0.55), mix(A[1], 255, 0.55), mix(A[2], 255, 0.55)];
    const cells: EmblemCell[] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (d[(y * cols + x) * 4 + 3] < 128) continue;
      const k = rand();
      cells.push({
        dx: (x + 0.5) * cw - wid / 2, dy: (y + 0.5) * (hgt / rows) - hgt / 2,
        col: `rgb(${mix(A[0], lt[0], k)},${mix(A[1], lt[1], k)},${mix(A[2], lt[2], k)})`,
        ch: CHARS[(rand() * 36) | 0], seed: (rand() * 1000) | 0,
        live: rand() < 0.12, tw: 170 + rand() * 340, jitter: rand() * 0.03,
      });
    }
    this.emblem = { cells, font, lt };
  }

  private buildField() {
    const { width: W, height: H } = this.canvas, rand = rng(11);
    const step = this.portrait ? W / 32 : W / 64;
    const cols = Math.ceil(W / step), rows = Math.ceil(H / (step * 1.4));
    const cells: FieldCell[] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (rand() > 0.55) continue;
      cells.push({ x: x * step + step / 2, y: y * step * 1.4 + step * 0.7, seed: (rand() * 1000) | 0, a: 0.05 + rand() * 0.09, rate: 1 + ((rand() * 3) | 0), ph: rand() });
    }
    this.field = { cells, font: Math.round(step * 0.42) };
  }

  private get handsY() {
    const base = this.portrait ? 0.8 : 0.76;
    return this.canvas.height * (base + (this.restY - base) * this.rise);
  }
  private get halfPx() {
    const { tipL, tipR, stepX } = this.hands;
    const reach = Math.max(0, (tipR.cx - tipL.cx) / 2 - stepX * 0.6);
    // after touching, each hand draws back ~28% of the width to make room for the logo
    return (this.open * this.canvas.width) / 2 - reach * this.contact + this.part * this.canvas.width * 0.28;
  }
  private get touch() {
    const { width: W, height: H } = this.canvas, h = this.hands;
    const left = (W - h.w) / 2, top = this.handsY - h.h / 2;
    return { x: (left + (h.tipL.cx + h.tipR.cx) / 2) / W, y: (top + (h.tipL.cy + h.tipR.cy) / 2) / H };
  }

  /** t = seconds since the section first came into view. Returns false when nothing changed. */
  draw(t: number, force = false) {
    const loop = t % LOOP, frame = Math.floor(t * (t > 4 ? 15 : 30)), ptr = this.pointer;
    const pose = [this.open, this.rise, this.contact, this.part, this.wave, ptr.on.toFixed(3), ptr.x.toFixed(3), ptr.y.toFixed(3)].join();
    if (!force && frame === this.last && pose === this.drawnPose) return false;
    this.last = frame; this.drawnPose = pose;

    const { ctx, canvas } = this, W = canvas.width, H = canvas.height, A = this.accent, hd = this.hands;
    ctx.fillStyle = this.bg; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    const touch = this.touch, tx = touch.x * W, ty = touch.y * H;
    const waveR = this.wave * W, waveW = W * (this.portrait ? 0.06 : 0.035);
    const onWave = (x: number, y: number) => (this.wave > 0 ? 1 - Math.abs(Math.hypot(x - tx, y - ty) - waveR) / waveW : 0);
    const waveFade = 1 - 0.5 * clamp01(this.wave);
    const px = ptr.x * W, py = ptr.y * H, lens = W * (this.portrait ? 0.16 : 0.09);
    const nearPtr = (x: number, y: number) => (ptr.on > 0 ? ptr.on * clamp01(1 - Math.hypot(x - px, y - py) / lens) : 0);
    const lt = hd.lt.join(",");

    // Background field
    ctx.font = `700 ${this.field.font}px ${MONO}`;
    const fast = Math.floor(t * 24);
    for (const c of this.field.cells) {
      const step = Math.floor(loop * c.rate);
      const w = onWave(c.x, c.y);
      if (w > 0) { ctx.fillStyle = `rgba(${lt},${(w * 0.9 * waveFade).toFixed(3)})`; ctx.fillText(CHARS[(c.seed + fast) % 36], c.x, c.y); continue; }
      const p = nearPtr(c.x, c.y);
      if (p > 0) { ctx.fillStyle = `rgba(${lt},${(0.12 + 0.5 * p).toFixed(3)})`; ctx.fillText(CHARS[(c.seed + fast) % 36], c.x, c.y); continue; }
      ctx.fillStyle = `rgba(${A.join(",")},${(c.a * (0.55 + 0.45 * Math.sin((loop / LOOP + c.ph) * Math.PI * 2))).toFixed(3)})`;
      ctx.fillText(CHARS[(c.seed + step * 7) % 36], c.x, c.y);
    }

    // Hands
    const reveal = easeOut3(range(t, 0.2, 3.6)) * 1.35;
    const left = (W - hd.w) / 2, top = this.handsY - hd.h / 2, half = this.halfPx, edge = 0.16;
    const ms = t * 1000, tick = Math.floor(ms / 42);
    // Hands step back (dim a little) while the logo comes out of the light
    const dim = this.emblem ? 1 - 0.45 * range(this.wave, 0, 0.35) : 1;
    ctx.font = `700 ${hd.font.toFixed(2)}px ${MONO}`;
    for (const c of hd.cells) {
      const s = reveal - c.thr;
      if (s < -edge) continue;
      const x = left + c.cx + (c.cx < hd.w / 2 ? -half : half), y = top + c.cy;
      if (x < -20 || x > W + 20) continue;
      if (s < edge) { // scrambling in
        const k = (s + edge) / (2 * edge);
        ctx.globalAlpha = (0.4 + 0.6 * k) * dim;
        ctx.fillStyle = k > 0.72 ? c.col : hd.midCol;
        ctx.fillText(CHARS[(c.seed + tick + (c.cx | 0) * 2) % 36], x, y);
        continue;
      }
      ctx.globalAlpha = dim;
      const settled = s - edge;
      if ((this.wave > 0 && onWave(x, y) > 0) || nearPtr(x, y) > 0.25) {
        ctx.fillStyle = `rgb(${lt})`; ctx.fillText(CHARS[(c.seed + tick) % 36], x, y); continue;
      }
      if (settled < 0.13) {
        const k = (1 - settled / 0.13) * 0.5;
        ctx.fillStyle = `rgb(${mix(c.c[0], hd.lt[0], k)},${mix(c.c[1], hd.lt[1], k)},${mix(c.c[2], hd.lt[2], k)})`;
      } else ctx.fillStyle = c.col;
      ctx.fillText(c.live ? CHARS[(c.seed + Math.floor(ms / c.tw)) % 36] : c.ch, x, y);
    }
    ctx.globalAlpha = 1;

    // Logo: revealed outward from the touch point by the ring; the front of the
    // reveal flashes white, the pointer pushes glyphs aside
    if (this.emblem && this.wave > 0) {
      const e = this.emblem, elt = e.lt.join(",");
      ctx.font = `700 ${e.font.toFixed(2)}px ${MONO}`;
      for (const c of e.cells) {
        const r = this.wave - (Math.hypot(c.dx, c.dy) / W + c.jitter);
        if (r < 0) continue;
        let x = tx + c.dx, y = ty + c.dy;
        if (r < 0.04) {
          ctx.fillStyle = r < 0.015 ? "#fff" : `rgb(${elt})`;
          ctx.fillText(CHARS[(c.seed + tick) % 36], x, y);
          continue;
        }
        const p = nearPtr(x, y);
        if (p > 0) {
          const dist = Math.hypot(x - px, y - py) || 1, push = p * e.font * 0.38;
          x += ((x - px) / dist) * push; y += ((y - py) / dist) * push;
          ctx.fillStyle = p > 0.55 ? "#fff" : `rgb(${elt})`;
          ctx.fillText(CHARS[(c.seed + tick) % 36], x, y);
          continue;
        }
        ctx.fillStyle = c.col;
        ctx.fillText(c.live ? CHARS[(c.seed + Math.floor(ms / c.tw)) % 36] : c.ch, x, y);
      }
    }

    // Flash where the fingertips meet
    const flash = range(this.contact, 0.9, 1) * (1 - range(this.wave, 0, 0.3));
    if (flash > 0) {
      const r = W * (0.05 + this.wave * 0.6);
      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, r);
      g.addColorStop(0, `rgba(255,255,255,${(0.85 * flash).toFixed(3)})`);
      g.addColorStop(0.25, `rgba(${lt},${(0.45 * flash).toFixed(3)})`);
      g.addColorStop(1, `rgba(${A.join(",")},0)`);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g; ctx.fillRect(tx - r, ty - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
    }
    return true;
  }
}

// ── Default source: two reaching hands drawn as a shaded silhouette ──
const LEFT_HAND =
  "M0 310 C80 300 170 280 250 245 C285 230 320 222 350 225 C395 228 430 240 460 258 C500 280 540 310 565 335 C578 347 580 356 570 357 C555 358 530 338 505 320 C520 345 548 372 552 388 C556 400 546 402 536 393 C515 373 495 350 478 332 C488 355 505 380 505 393 C505 404 494 404 486 395 C470 377 455 352 445 335 C448 352 452 370 450 380 C447 390 438 388 434 378 C428 360 420 340 410 328 C395 330 380 340 365 352 C330 380 290 410 250 435 C180 470 90 490 0 495 Z";
const RIGHT_HAND =
  "M1200 205 C1120 220 1030 245 960 275 C925 288 890 298 860 302 C820 306 780 312 740 320 C700 326 660 330 625 330 C610 331 606 340 618 344 C650 350 690 350 730 352 C715 365 705 385 710 400 C714 410 724 408 728 398 C735 385 745 372 760 362 C750 385 745 410 752 428 C757 440 768 436 770 424 C772 405 780 388 792 375 C788 395 790 420 800 435 C806 444 816 440 815 428 C812 410 815 392 825 380 C840 385 860 385 885 378 C940 365 1000 360 1060 362 C1110 364 1160 368 1200 372 Z";
const HANDS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecc7a6"/><stop offset=".5" stop-color="#b98563"/><stop offset="1" stop-color="#5e3a27"/></linearGradient>
<radialGradient id="l" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff3e6" stop-opacity=".55"/><stop offset="1" stop-color="#fff3e6" stop-opacity="0"/></radialGradient>
</defs>
<path d="${LEFT_HAND}" fill="url(#g)"/><path d="${LEFT_HAND}" fill="url(#l)"/>
<path d="${RIGHT_HAND}" fill="url(#g)"/><path d="${RIGHT_HAND}" fill="url(#l)"/>
<g fill="none" stroke="#4a2c1d" stroke-width="5" stroke-linecap="round" opacity=".55">
<path d="M330 300 C380 290 420 300 452 322"/><path d="M470 300 C482 318 492 336 500 352"/><path d="M435 312 C442 328 447 344 448 360"/>
<path d="M880 318 C840 330 800 338 760 345"/><path d="M790 372 C800 350 815 340 830 336"/><path d="M1000 300 C960 310 920 318 890 322"/>
</g></svg>`;

const load = (src: string) => new Promise<HTMLImageElement>((ok, fail) => {
  const im = new Image(); im.decoding = "async";
  im.onload = () => ok(im); im.onerror = fail; im.src = src;
});

/** Uses /images/hands.png when present (white or transparent background), else the drawn silhouette. */
export const loadEmblemImage = () => load("/images/fw-nav.png");

export async function loadHandsImage() {
  try { return await load("/images/hands.png"); }
  catch { return load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(HANDS_SVG)}`); }
}
