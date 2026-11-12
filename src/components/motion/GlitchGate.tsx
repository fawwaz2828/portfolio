import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";

/**
 * Entering the secret page: a detailed signal-corruption glitch, rendered by a
 * WebGL shader at full device resolution (so the grain goes down to 1px).
 *   close(): the current page shakes; corruption builds up from glitch blocks
 *            in seven sizes (2–35px), each one fine grain, a flat colour, a
 *            pixel-sort streak, a dot matrix (2–5px dots) or a checker
 *            dither; rows tear sideways, 1px lines streak across, thin bands
 *            invert / hue-shift the real page underneath; then fine
 *            multi-scale static swallows the screen.
 *   (App swaps the page under the static.)
 *   open():  the static breaks up and the new page comes through the
 *            corruption, which thins out and settles.
 * Only a transform ever touches the page card, and only while leaving: CSS
 * filters on the full-height card crashed the tab, and a transformed card
 * breaks the new page's ScrollSmoother as it mounts.
 */
export type GateHandle = { close: () => Promise<void>; open: () => Promise<void> };

const STEP_MS = 42; // glitch layout re-rolls in steps; grain re-rolls every frame
const BANDS = 8;
const BAND_FX = ["invert(1)", "hue-rotate(110deg) saturate(6)", "contrast(3) brightness(1.5)", "invert(1) hue-rotate(180deg)", "grayscale(1) contrast(4)", "saturate(8) hue-rotate(-40deg)"];

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uSeed, uK, uCover, uPx;

float h1(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 h3(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }

vec3 palette(float r) {
  if (r < .26) return vec3(.94, .27, .27);   // accent red
  if (r < .40) return vec3(1., .06, .2);     // crimson
  if (r < .53) return vec3(0., .95, .9);     // cyan
  if (r < .66) return vec3(1.);              // white
  if (r < .78) return vec3(.03);             // black
  if (r < .90) return vec3(.42, .02, .05);   // dark red
  return vec3(1., .8, .3);                   // amber
}

void main() {
  vec2 px = floor(gl_FragCoord.xy);
  float y = uRes.y - px.y;
  float t60 = floor(uTime * 60.);
  vec4 col = vec4(0.);

  // rows tear sideways: bands of varying height shift the block lookup
  float bandH = (2. + 46. * h1(vec2(floor(y / 48.), uSeed))) * uPx;
  float row = floor(y / bandH);
  float shift = h1(vec2(row, uSeed * 1.7)) < .28 * uK ? (h1(vec2(row, uSeed + 3.)) - .5) * 220. * uK * uPx : 0.;
  vec2 q = vec2(px.x + shift, y);

  // glitch blocks in seven sizes; the smallest that fires wins
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float s = floor(2. * pow(1.62, fi)) * uPx;
    float stretch = 1. + floor(4. * h1(vec2(fi, floor(uSeed / 3.))));      // some blocks are wide
    vec2 cell = vec2(s * stretch, s);
    vec2 b = floor(q / cell);
    float r = h1(b + vec2(uSeed * 13.1, fi * 7.3));
    if (r < uK * (.05 + .012 * fi)) {
      vec3 c = h3(b + vec2(uSeed, fi));
      vec2 lp = mod(q, cell) / cell;
      vec3 pc = palette(c.y);
      float a = 1.;
      vec3 rgb;
      if (c.x < .26) {                         // fine colour grain
        float g = h1(px + t60 * 17.13);
        rgb = pc * (.25 + g);
        rgb.g += (h1(px + 91.7 + t60) - .5) * .25;
      } else if (c.x < .42) {                  // flat colour
        rgb = pc;
      } else if (c.x < .6) {                   // pixel-sort streak
        float k = fract(lp.x * (1. + floor(c.z * 4.)) + h1(vec2(b.y, uSeed)));
        rgb = mix(pc * .15, pc, k);
      } else if (c.x < .8) {                   // dot matrix, 2–5px dots
        float cs = (2. + floor(c.z * 4.)) * uPx;
        vec2 d = mod(q, cs) - cs * .5;
        a = step(length(d), cs * (.22 + .2 * h1(floor(q / cs) + uSeed)));
        rgb = pc;
      } else {                                 // checker dither
        a = mod(px.x + px.y, 2.);
        rgb = pc;
      }
      col = vec4(clamp(rgb, 0., 1.) * a, a);
      break;
    }
  }

  // 1px lines streaking across
  float lr = h1(vec2(y, uSeed * 3.1));
  if (col.a < .5 && lr < .01 * uK) {
    float st = h1(vec2(y, uSeed + 1.)) * uRes.x, len = h1(vec2(y, uSeed + 2.)) * uRes.x * .7;
    if (px.x > st && px.x < st + len) col = vec4(palette(h1(vec2(y, uSeed + 4.))), 1.);
  }

  // static: grain at 1, 2 and 3px mixed across the screen, slight channel split,
  // red rows and scanlines
  if (uCover > 0.) {
    float zone = h1(floor(px / vec2(96., 6.) / uPx) + floor(uTime * 18.));
    vec2 gp = zone < .55 ? px : zone < .85 ? floor(px / (2. * uPx)) : floor(px / (3. * uPx));
    float g = h1(gp + t60 * 17.13);
    vec3 sc = vec3(g, mix(g, h1(gp + 47.1 + t60), .35), mix(g, h1(gp + 13.3 + t60), .35));
    float rowH = (1. + floor(4. * h1(vec2(floor(y / 16.), floor(uTime * 18.))))) * uPx;
    if (h1(vec2(floor(y / rowH), floor(uTime * 18.) + 5.)) < .07) sc *= vec3(1.5, .25, .3);
    if (h1(vec2(floor(y / rowH), floor(uTime * 18.) + 9.)) < .05) sc *= .15;
    sc *= .72 + .28 * mod(floor(y / uPx), 2.);
    vec4 stc = vec4(clamp(sc, 0., 1.), 1.) * uCover;
    col = col + stc * (1. - col.a);
  }

  gl_FragColor = col; // premultiplied
}`;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[(Math.random() * xs.length) | 0];
const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

type GL = { gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null> };

function initGL(canvas: HTMLCanvasElement): GL | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u: GL["u"] = {};
  for (const k of ["uRes", "uTime", "uSeed", "uK", "uCover", "uPx"]) u[k] = gl.getUniformLocation(prog, k);
  return { gl, u };
}

export default function GlitchGate({ ref, target }: { ref: Ref<GateHandle>; target: RefObject<HTMLElement | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const bands = useRef<(HTMLDivElement | null)[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const glRef = useRef<GL | null | undefined>(undefined);

  useEffect(() => () => { glRef.current?.gl.getExtension("WEBGL_lose_context")?.loseContext(); }, []);

  const resetCard = () => { const c = target.current; if (c) c.style.transform = ""; };

  const setup = () => {
    const cv = canvas.current!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    if (glRef.current === undefined) glRef.current = initGL(cv);
    const g = glRef.current;
    if (g) {
      g.gl.viewport(0, 0, cv.width, cv.height);
      g.gl.uniform2f(g.u.uRes, cv.width, cv.height);
      g.gl.uniform1f(g.u.uPx, dpr); // block sizes are in CSS px; grain stays at device px
    }
  };

  /** Draw one frame. `onCard`: also jitter the page itself (only while leaving). */
  const draw = (now: number, seed: number, k: number, cover: number, newStep: boolean, onCard: boolean) => {
    const g = glRef.current;
    if (g) {
      const { gl, u } = g;
      gl.uniform1f(u.uTime, now / 1000);
      gl.uniform1f(u.uSeed, seed);
      gl.uniform1f(u.uK, k);
      gl.uniform1f(u.uCover, cover);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      // no WebGL: plain cover so the transition still hides the swap
      canvas.current!.style.background = cover > 0.5 ? "#111" : "transparent";
    }
    if (!newStep) return;
    const card = target.current;
    if (card && onCard) {
      card.style.transform = k > 0.02 ? `translate(${rnd(-20, 20) * k}px, ${rnd(-6, 6) * k}px) skewX(${rnd(-5, 5) * k}deg)` : "";
    }
    // thin bands that corrupt the real page beneath
    bands.current.forEach((b) => {
      if (!b) return;
      if (Math.random() > 0.2 + 0.7 * k) { b.style.display = "none"; return; }
      b.style.display = "block";
      b.style.top = `${rnd(0, 100)}%`;
      b.style.height = `${Math.random() < 0.6 ? rnd(1, 6) : rnd(6, 10 + 60 * k)}px`;
      b.style.transform = `translateX(${rnd(-60, 60) * k}px)`;
      b.style.backdropFilter = pick(BAND_FX);
    });
  };

  /** Run for `ms`; layout re-rolls every STEP_MS, grain every frame. */
  const run = (ms: number, at: (p: number) => { k: number; cover: number }, onCard: boolean) => new Promise<void>((done) => {
    const t0 = performance.now();
    let lastStep = -Infinity, seed = Math.random() * 100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms), v = at(p);
      const newStep = now - lastStep >= STEP_MS;
      if (newStep) { lastStep = now; seed += 1 + Math.random() * 7; }
      draw(now, seed, v.k, v.cover, newStep, onCard);
      if (p < 1) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  });

  const pop = (opacity: number, duration: number) =>
    flash.current!.animate([{ opacity }, { opacity: 0 }], { duration, easing: "ease-out" });

  useImperativeHandle(ref, () => ({
    async close() {
      setup();
      root.current!.classList.add("is-on");
      // corruption builds up, then static swallows the screen
      await run(1000, (p) => ({ k: 0.2 + 0.8 * p, cover: smooth(0.7, 1, p) }), true);
      pop(0.85, 240);
      // full static: the page card goes back to normal underneath before App swaps the page
      resetCard();
      await run(360, () => ({ k: 1, cover: 1 }), false);
    },

    async open() {
      // static breaks up; the new page comes through the corruption, which thins out
      pop(0.5, 200);
      await run(1000, (p) => ({ k: 1 - smooth(0.1, 1, p), cover: 1 - smooth(0, 0.45, p) }), false);
      draw(performance.now(), 0, 0, 0, true, false);
      resetCard();
      bands.current.forEach((b) => { if (b) b.style.display = "none"; });
      root.current!.classList.remove("is-on");
    },
  }), []);

  return (
    <div ref={root} className="glitch-gate" aria-hidden="true">
      {Array.from({ length: BANDS }, (_, i) => (
        <div key={i} ref={(n) => { bands.current[i] = n; }} className="glitch-gate__band" />
      ))}
      <canvas ref={canvas} className="glitch-gate__noise" />
      <div ref={flash} className="glitch-gate__flash" />
    </div>
  );
}
