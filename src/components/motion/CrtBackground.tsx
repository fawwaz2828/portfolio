import { useEffect, useRef } from "react";

/**
 * CRT / thermal-mosaic header background, ported from ethiack.com's CrtCanvas
 * ("bitmap" shader + its effects pipeline): CRT wobble, a coarse mosaic blended
 * at 25%, a 7-step thermal palette, a mouse spotlight with a lagging second
 * circle, and scanlines with a dimmed backlight.
 *
 * The source is procedural (flowing noise + flickering "window lights") by
 * default; pass `image` (a photo, given a slow drift + flickering windows so it
 * stays alive) or `video` to feed your own footage instead.
 *
 * Listens for "sword:strike" (client x/y of the blade tip, plus `power`
 * 1–3 from how long the sword was held): a shockwave ring
 * spreads from that point, the picture tears along the blade's line and
 * heals, with a glowing slash and a red flash.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 vUv;

uniform float time;
uniform vec2 resolution;
uniform vec2 iMouse;
uniform vec2 mouseSecondOffset;
uniform float uMouseOpacity;

uniform sampler2D uSource;
uniform float uHasSource;
uniform float uSourceAspect;
uniform float uIsStill; // photo: add drift + window flicker
uniform float uTone;    // gamma on footage luminance (darker sky in dark mode)
uniform float uStrike;    // seconds since the sword was struck; < 0 = idle
uniform vec2 uStrikePos;  // blade tip, uv (y up)
uniform float uStrikePower; // 1 = tap, up to 3 = fully charged hold

uniform vec3 color1, color2, color3, color4, color5, color6, color7;

// "bitmap" preset from ethiack.com
const float uRadius = 0.05;
const float uFalloff = 0.1;
const float mosaicRes = 48.0;
const float mosaicBlend = 0.25;
const float scanlineSize = 0.4;
const float crtScanlineIntensity = 1.5;
uniform float backlight; // ethiack dims to 0.55; light theme keeps full brightness

const vec3 W = vec3(0.299, 0.587, 0.114);
float aspectRatio;
vec2 mouseNormalized;

// ── Source ────────────────────────────────────────────────
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

vec4 getInputColor(vec2 uv) {
  if (uHasSource > 0.5) {
    // cover-fit the footage
    float s;
    if (uSourceAspect > aspectRatio) { s = aspectRatio / uSourceAspect; uv.x = uv.x * s + (1.0 - s) * 0.5; }
    else { s = uSourceAspect / aspectRatio; uv.y = uv.y * s + (1.0 - s) * 0.5; }
    if (uIsStill > 0.5) {
      // slow Ken Burns: gentle zoom breathing + lateral drift
      float z = 1.1 + 0.04 * sin(time * 0.07);
      uv = (uv - 0.5) / z + 0.5 + vec2(0.03 * sin(time * 0.045), 0.015 * sin(time * 0.06 + 1.3));
    }
    float lum = pow(dot(texture2D(uSource, uv).rgb, W), uTone);
    if (uIsStill > 0.5) {
      // flicker some mid-tone cells (building facades, not sky or shadow) like window lights
      vec2 cell = floor(uv * vec2(90.0, 60.0));
      float flick = step(0.9, hash(cell + floor(time * 0.5 + hash(cell) * 6.0)));
      float facade = smoothstep(0.15, 0.3, lum) * (1.0 - smoothstep(0.55, 0.7, lum));
      lum = clamp(lum + flick * facade * 0.35, 0.0, 1.0);
    }
    return vec4(vec3(lum), 1.0);
  }
  // Procedural "footage": drifting haze plus a grid of flickering lights
  vec2 p = vec2(uv.x * aspectRatio, uv.y);
  float haze = fbm(p * 2.2 + vec2(time * 0.04, -time * 0.025));
  float body = smoothstep(0.25, 0.85, haze);
  vec2 cell = floor(p * vec2(26.0, 34.0));
  float flick = step(0.82, hash(cell + floor(time * 0.6 + hash(cell) * 4.0)));
  float lights = flick * smoothstep(0.35, 0.7, haze);
  float lum = clamp(body * 0.75 + lights * 0.6 + 0.05 * sin(uv.y * 40.0 + time), 0.0, 1.0);
  return vec4(vec3(lum), 1.0);
}

// ── Effects pipeline (ethiack GC shader) ───────────────────
vec3 getMosaicColor(float b) {
  vec3 r = mix(vec3(0.1), vec3(0.2), step(0.1, b));
  r = mix(r, vec3(0.4), step(0.25, b));
  r = mix(r, vec3(0.6), step(0.45, b));
  r = mix(r, vec3(0.8), step(0.65, b));
  return mix(r, vec3(1.0), step(0.85, b));
}

vec3 thermalVision(float heat) {
  heat = clamp(heat, 0.0, 1.0);
  vec3 c = color1;
  c = mix(c, color2, smoothstep(0.1, 0.2, heat));
  c = mix(c, color3, smoothstep(0.2, 0.4, heat));
  c = mix(c, color4, smoothstep(0.4, 0.6, heat));
  c = mix(c, color5, smoothstep(0.6, 0.8, heat));
  c = mix(c, color6, smoothstep(0.8, 0.95, heat));
  return mix(c, color7, smoothstep(0.95, 1.0, heat));
}

vec4 applyMouseFollower(vec2 uv, vec4 base) {
  vec2 centered = (uv - 0.5) * vec2(aspectRatio, 1.0);
  float range = uRadius + uFalloff;
  float d1 = length(centered - mouseNormalized);
  float d2 = length(centered - (mouseNormalized + mouseSecondOffset));
  float m1 = d1 > range ? 0.0 : (1.0 - smoothstep(uRadius - uFalloff, range, d1)) * uMouseOpacity;
  float m2 = d2 > range ? 0.0 : (1.0 - smoothstep(uRadius - uFalloff, range, d2)) * uMouseOpacity * 0.5;
  float m = clamp(m1 + m2, 0.0, 1.0);
  return vec4(mix(base.rgb, vec3(1.0), m), base.a);
}

vec4 applyMosaic(vec2 uv, vec4 base) {
  vec2 grid = vec2(mosaicRes * aspectRatio, mosaicRes);
  vec2 suv = (floor(uv * grid) + 0.5) / grid;
  vec4 s = applyMouseFollower(suv, getInputColor(suv));
  return mix(base, vec4(getMosaicColor(dot(s.rgb, W)), base.a), mosaicBlend);
}

vec2 crtScanDistort(vec2 uv) {
  float amount = clamp(cos(uv.y * 2.0 + time), 0.0, 1.0) * clamp(cos(uv.y * 2.0 + time + 4.0) * 10.0, 0.0, 1.0);
  float hi = sin(uv.y * 50.0 + time * 3.0) * 0.05;
  float mid = sin(uv.y * 8.0 + time * 1.5) * 0.5;
  uv.x -= 0.025 * amount;
  uv.x -= 0.004 * (hi + mid);
  return uv;
}

void main() {
  aspectRatio = resolution.x / resolution.y;
  mouseNormalized = (iMouse - 0.5) * vec2(aspectRatio, 1.0);
  vec2 uv = crtScanDistort(vUv);

  // Sword strike: shockwave + tear along the blade line + slash glow
  float heat = 0.0;
  if (uStrike >= 0.0) {
    float t = uStrike, p = uStrikePower, sp = sqrt(p);
    vec2 d = (uv - uStrikePos) * vec2(aspectRatio, 1.0);
    float r = length(d);
    // bigger hold → faster, wider, stronger ring that fades more slowly
    float ring = exp(-pow((r - t * 1.5 * sp) * 14.0 / sp, 2.0)) * exp(-t * 1.8 / p);
    uv -= (d / max(r, 1e-4)) * ring * 0.035 * p / vec2(aspectRatio, 1.0);
    float dy = uv.y - uStrikePos.y;
    float tear = exp(-t * 5.0 / p) * exp(-abs(dy) * 5.0 / sp);
    uv.x += sign(dy) * 0.05 * p * tear;
    // slash line runs out from the tip across the screen (leftwards), then fades
    float reach = smoothstep(uStrikePos.x - t * 6.0, uStrikePos.x - t * 6.0 + 0.08, uv.x) * step(uv.x, uStrikePos.x + 0.02);
    float slash = exp(-abs(dy) * 140.0 / sp) * reach * exp(-t * 3.5 / p);
    // charged hits add a blast of light at the tip
    float core = (p - 1.0) * 0.6 * exp(-r * r * 30.0 / p) * exp(-t * 3.0 / p);
    heat = ring * 0.55 * sp + slash * 1.2 + 0.22 * p * exp(-t * 4.0 / p) + core;
  }

  vec4 col = getInputColor(uv);
  col = applyMouseFollower(uv, col);   // mosaicBlend < 0.99
  col = applyMosaic(uv, col);
  col = vec4(thermalVision(dot(col.rgb, W) + heat), 1.0);

  float scan = sin((uv.x * resolution.x) / scanlineSize - time * 5.0) * crtScanlineIntensity * 0.5 + 0.5;
  col.rgb = mix(col.rgb, vec3(scan), 0.1);
  col.rgb *= backlight;
  gl_FragColor = col;
}
`;

type RGB = [number, number, number];
const rgb = (r: number, g: number, b: number): RGB => [r / 255, g / 255, b / 255];
// 7-step thermal ramps (ethiack: deep teal → green → pink), re-tinted to the red accent
const PALETTES: Record<"dark" | "light", RGB[]> = {
  dark: [rgb(14, 14, 14), rgb(38, 30, 30), rgb(86, 58, 58), rgb(255, 168, 160), rgb(255, 236, 228), rgb(239, 68, 68), rgb(239, 68, 68)],
  light: [rgb(245, 245, 242), rgb(228, 224, 220), rgb(205, 192, 188), rgb(240, 140, 136), rgb(255, 250, 246), rgb(220, 38, 38), rgb(220, 38, 38)],
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
  return sh;
}

/** `tone`: gamma on the footage's brightness (higher = darker); 1.6 suits the city photos, darker images want less */
export default function CrtBackground({ video, image, tone = 1.6 }: { video?: string; image?: string; tone?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const host = canvas.parentElement!;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl || gl.isContextLost()) return;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
    } catch (err) {
      console.warn("[CrtBackground] disabled:", err);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      time: U("time"), res: U("resolution"), mouse: U("iMouse"), second: U("mouseSecondOffset"), mouseOp: U("uMouseOpacity"),
      src: U("uSource"), hasSrc: U("uHasSource"), srcAspect: U("uSourceAspect"), still: U("uIsStill"), tone: U("uTone"),
      colors: [1, 2, 3, 4, 5, 6, 7].map((i) => U(`color${i}`)),
      backlight: U("backlight"),
      strike: U("uStrike"), strikePos: U("uStrikePos"), strikePower: U("uStrikePower"),
    };
    gl.uniform1f(u.strike, -1);
    gl.uniform1f(u.strikePower, 1);
    let strikeAt = -1, strikeLife = 2; // performance.now() of the last strike; seconds it lasts

    const onStrike = (e: Event) => {
      const { x, y, power = 1 } = (e as CustomEvent<{ x: number; y: number; power?: number }>).detail;
      const r = canvas.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return; // other section's background
      gl.uniform2f(u.strikePos, (x - r.left) / r.width, 1 - (y - r.top) / r.height);
      gl.uniform1f(u.strikePower, power);
      strikeLife = 2 * power;
      strikeAt = performance.now();
    };
    addEventListener("sword:strike", onStrike);

    const setPalette = () => {
      const light = document.documentElement.dataset.theme === "light";
      PALETTES[light ? "light" : "dark"].forEach((c, i) => gl.uniform3fv(u.colors[i], c));
      gl.uniform1f(u.backlight, light ? 1.0 : 0.55);
      gl.uniform1f(u.tone, light ? 1.0 : tone);
    };
    setPalette();
    const mo = new MutationObserver(() => { setPalette(); if (!running) draw(performance.now()); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Optional footage
    let vid: HTMLVideoElement | null = null;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u.src, 0);
    gl.uniform1f(u.hasSrc, 0);
    gl.uniform1f(u.still, 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // texture rows top-down → UV y-up
    let destroyed = false;
    if (image && !video) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (destroyed || gl.isContextLost()) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.uniform1f(u.srcAspect, img.naturalWidth / img.naturalHeight);
        gl.uniform1f(u.still, 1);
        gl.uniform1f(u.hasSrc, 1);
        if (!running) draw(performance.now());
      };
      img.src = image;
    }
    if (video) {
      vid = Object.assign(document.createElement("video"), { src: video, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
      vid.addEventListener("loadeddata", () => {
        gl.uniform1f(u.srcAspect, vid!.videoWidth / vid!.videoHeight);
        gl.uniform1f(u.hasSrc, 1);
      }, { once: true });
      vid.play().catch(() => {});
    }

    // Mouse: smoothed position in element UV (y up), plus ethiack's wobbling second circle
    const target = { x: 0.5, y: 0.5 }, smooth = { x: 0.5, y: 0.5 };
    let mouseOpacity = 0;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
      mouseOpacity = e.clientY >= r.top && e.clientY <= r.bottom ? 0.5 : 0;
    };
    const finePointer = matchMedia("(any-pointer: fine)").matches;
    if (finePointer) addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(host.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(host.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      if (!running) draw(performance.now());
    };

    const t0 = performance.now();
    function draw(now: number) {
      const t = (now - t0) / 1000;
      smooth.x += (target.x - smooth.x) * 0.1;
      smooth.y += (target.y - smooth.y) * 0.1;
      const wx = Math.sin(t * 1.1) * 0.5 + Math.sin(t * 2.3 + 1.7) * 0.25;
      const wy = Math.sin(t * 1.3) * 0.5 + Math.sin(t * 2.1 + 2.3) * 0.25;
      gl!.uniform1f(u.time, t);
      gl!.uniform2f(u.mouse, smooth.x, 1 - smooth.y);
      gl!.uniform2f(u.second, wx * 0.02, wy * 0.02);
      gl!.uniform1f(u.mouseOp, mouseOpacity);
      const since = strikeAt < 0 ? -1 : (now - strikeAt) / 1000;
      if (since > strikeLife) strikeAt = -1;
      gl!.uniform1f(u.strike, since > strikeLife ? -1 : since);
      if (vid && vid.readyState >= 2) {
        gl!.bindTexture(gl!.TEXTURE_2D, tex);
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, vid);
      }
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    // Animate only while visible; reduced motion gets a single still frame
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, running = false, visible = true;
    const loop = (now: number) => { draw(now); raf = requestAnimationFrame(loop); };
    const start = () => { if (!running && !reduce && visible && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
    io.observe(host);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    start();
    canvas.classList.add("is-loaded");

    return () => {
      destroyed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("pointermove", onMove);
      removeEventListener("sword:strike", onStrike);
      vid?.pause();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      canvas.classList.remove("is-loaded");
    };
  }, [video, image, tone]);

  return (
    <div className="crt-bg" aria-hidden="true">
      <canvas ref={ref} className="crt-bg__canvas" />
      <span className="crt-bg__radial" />
      <span className="crt-bg__gradient" />
    </div>
  );
}
