import { Fragment, useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";

type Opts = { min?: number; max?: number; radius?: number };

/**
 * Each `.char` inside `ref` gets a variable-font weight driven by its distance
 * to the pointer: smoothstep falloff within `radius`, eased toward the target
 * every frame. The rAF loop stops itself once all letters have settled.
 * Requires a variable font with a `wght` axis.
 */
export function useProximityWeight(
  ref: RefObject<HTMLElement | null>,
  { min = 300, max = 700, radius = 260 }: Opts = {},
) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reduce || !matchMedia("(any-pointer: fine)").matches) return;

    const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
    const weights = chars.map(() => min);
    let centres: { x: number; y: number }[] = [];
    let mx = -9999, my = -9999, raf = 0, inside = false, stale = true;

    const measure = () => {
      centres = chars.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    // Scroll / resize only mark the positions as stale; they are measured again
    // when the pointer next moves, instead of on every scroll event
    const invalidate = () => { stale = true; };

    const tick = () => {
      if (stale) { measure(); stale = false; }
      let moving = false;
      chars.forEach((el, i) => {
        const c = centres[i];
        if (!c) return;
        const u = Math.max(0, 1 - Math.hypot(mx - c.x, my - c.y) / radius);
        const target = min + (max - min) * u * u * (3 - 2 * u); // smoothstep
        weights[i] += 0.18 * (target - weights[i]);
        if (Math.abs(target - weights[i]) > 0.5) moving = true;
        el.style.fontVariationSettings = `"wght" ${weights[i].toFixed(0)}`;
      });
      raf = moving || inside ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onEnter = () => { inside = true; };
    const onLeave = () => { inside = false; mx = my = -9999; };

    const zone = root.parentElement ?? root;
    window.addEventListener("pointermove", onMove, { passive: true });
    zone.addEventListener("pointerenter", onEnter);
    zone.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerenter", onEnter);
      zone.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      chars.forEach((el) => el.style.removeProperty("font-variation-settings"));
    };
  }, [ref, min, max, radius, reduce]);
}

type Props = Opts & {
  text: string;
  className?: string;
  /** Letters rise from below their word mask on mount, staggered (expo-out). */
  intro?: { delay?: number; stagger?: number };
  /** Hold the intro until this turns true (e.g. when scrolled into view). Defaults to true. */
  play?: boolean;
  /** Letters show random ASCII glyphs (# + = - : . * % …) first, then each locks into its real letter at a random moment. */
  scramble?: boolean;
};

// ksenpanchenko.com's decodeText: ASCII-art glyphs, every letter settles at its
// own random moment (25–100% of the run), glyphs re-roll every frame, and the
// layout is frozen meanwhile so nothing jumps. Their 500ms, stretched a little
// for these much larger titles.
const GLYPHS = "#+=-:.*/%";
const DECODE_MS = 700;
const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/** Scramble-in, started `delay` seconds after `play` turns true (restarts each time it does). */
function useScrambleIn(ref: RefObject<HTMLElement | null>, on: boolean, play: boolean, delay: number, text: string) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !on || !play || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
    const real = chars.map((c) => c.textContent ?? "");
    const styles = chars.map((c) => c.getAttribute("style"));
    // Freeze each letter's box so narrow glyphs ( . : ) don't shift the line.
    // All reads first, then all writes: interleaving them forced a fresh
    // layout per letter (~0.8s of main-thread work on a mid-range phone)
    const widths = chars.map((c) => c.getBoundingClientRect().width);
    chars.forEach((c, i) => {
      c.style.width = `${widths[i]}px`;
      c.style.textAlign = "center";
    });
    const settle = chars.map(() => 0.25 + 0.75 * Math.random());
    const t0 = performance.now() + delay * 1000;
    let raf = 0;
    chars.forEach((c, i) => { if (real[i].trim()) c.textContent = randomGlyph(); });
    const restore = () => chars.forEach((c, i) => {
      c.textContent = real[i];
      const st = styles[i];
      if (st === null) c.removeAttribute("style"); else c.setAttribute("style", st);
    });
    const tick = (now: number) => {
      const r = Math.max(0, (now - t0) / DECODE_MS);
      chars.forEach((c, i) => {
        if (!real[i].trim()) return;
        c.textContent = r >= settle[i] ? real[i] : randomGlyph();
      });
      if (r < 1) raf = requestAnimationFrame(tick);
      else restore();
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); restore(); };
  }, [ref, on, play, delay, text]);
}

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

/** Splits `text` into per-letter spans (words kept unbroken) and applies the proximity weight. */
export default function ProximityText({ text, className = "", min = 300, max = 700, radius = 260, intro, play = true, scramble = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  useScrambleIn(ref, scramble, play, intro?.delay ?? 0, text);
  const reduce = useReducedMotion();
  useProximityWeight(ref, { min, max, radius });
  const words = text.split(" ");
  const animateIn = !!intro && !reduce;
  let n = 0; // running letter index for the stagger

  return (
    <span
      ref={ref}
      className={`ptext ${className}`.trim()}
      style={{ "--ptext-min": min, "--ptext-max": max } as CSSProperties}
    >
      <span className="sr-only">{text}</span>
      {words.map((w, wi) => (
        <Fragment key={wi}>
        <span aria-hidden="true" className={`ptext__word${intro ? " ptext__word--mask" : ""}`}>
          {Array.from(w).map((ch, ci) =>
            animateIn ? (
              <motion.span
                key={ci}
                className="char"
                initial={{ y: "115%" }}
                animate={play ? { y: "0%" } : undefined}
                transition={{ duration: 1.15, ease: EXPO_OUT, delay: (intro.delay ?? 0) + n++ * (intro.stagger ?? 0.022) }}
              >
                {ch}
              </motion.span>
            ) : (
              <span key={ci} className="char">{ch}</span>
            ),
          )}
        </span>
        {/* Space sits between the inline-block words; inside one it would collapse */}
        {wi < words.length - 1 && " "}
        </Fragment>
      ))}
    </span>
  );
}
