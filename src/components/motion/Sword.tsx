import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "../../router";

/**
 * Detailed line-art longsword lying horizontally, point to the left.
 * Strokes trace themselves in on load (blade → guard → grip → pommel),
 * a glint runs along the edge every few seconds and the pommel tassel sways.
 * Hovering makes the whole sword glow red (CSS: .hero__sword:hover).
 * Clicking thrusts it forward and sends "sword:strike" with the blade tip's
 * position, which the CRT background answers with a shockwave and a tear.
 *
 * Holding before release charges the strike (power 1 → 3 over 1.5s): a
 * bigger thrust, a screen shake and a larger blast in the background.
 *
 * Secret: tapping "FW" in Morse (··−· ·−−) opens the hidden /login page.
 * A press under 250ms is a dot, a longer hold a dash (the sword "charges"
 * while held); a pause over 1.5s starts the sequence again.
 */
const SECRET = "..-..--"; // F ··−·  W ·−−
const DASH_MS = 250, RESET_MS = 1500, FULL_MS = 1500;
const EASE = [0.16, 1, 0.3, 1] as const;

type Part = { d: string; at: number; fine?: boolean; accent?: boolean; blade?: boolean };

// Wire wrap on the grip: crossing diagonals between the ferrules
const WRAP = Array.from({ length: 10 }, (_, i) => {
  const x = 503 + i * 10;
  return `M${x} 53 L${x + 8} 67 M${x + 8} 53 L${x} 67`;
}).join(" ");

const PARTS: Part[] = [
  // ── Blade ─────────────────────────────
  // outline with a tapering point
  { d: "M10 60 C40 52 70 47 110 45 L470 43 L470 77 L110 75 C70 73 40 68 10 60 Z", at: 0, blade: true },
  // edge bevels
  { d: "M20 60 C58 54 88 51 120 50 L448 49", at: 0.15, fine: true },
  { d: "M20 60 C58 66 88 69 120 70 L448 71", at: 0.15, fine: true },
  // fuller (groove)
  { d: "M152 60 Q152 57 156 57 L432 57 L432 63 L156 63 Q152 63 152 60 Z", at: 0.25, fine: true },
  // ricasso line and etched vines near the guard
  { d: "M448 46 L448 74", at: 0.3, fine: true },
  { d: "M372 53 q7 -4 14 0 t14 0 t14 0 t14 0", at: 0.4, fine: true },
  { d: "M372 67 q7 4 14 0 t14 0 t14 0 t14 0", at: 0.4, fine: true },
  { d: "M459 55 L464 60 L459 65 L454 60 Z", at: 0.45, fine: true },

  // ── Crossguard ────────────────────────
  // langet tongue over the ricasso
  { d: "M470 50 L456 54 L456 66 L470 70", at: 0.35 },
  // quillon block
  { d: "M470 46 Q470 44 472 44 L490 44 Q492 44 492 46 L492 74 Q492 76 490 76 L472 76 Q470 76 470 74 Z", at: 0.4 },
  // quillons sweeping back toward the blade, with ball finials
  { d: "M476 44 C476 30 473 20 462 13 M486 44 C486 27 481 15 468 8", at: 0.45 },
  { d: "M476 76 C476 90 473 100 462 107 M486 76 C486 93 481 105 468 112", at: 0.45 },
  { d: "M458 10 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0", at: 0.6 },
  { d: "M458 110 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0", at: 0.6 },
  // setting ring around the gem
  { d: "M472 60 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", at: 0.55, fine: true },
  // gem
  { d: "M481 53 L487 60 L481 67 L475 60 Z", at: 0.9, accent: true },

  // ── Grip ──────────────────────────────
  // ferrules
  { d: "M492 51 L501 51 L501 69 L492 69", at: 0.5 },
  { d: "M603 51 L612 51 L612 69 L603 69 Z", at: 0.6 },
  // slightly swelled grip
  { d: "M501 53 Q552 49 603 53 L603 67 Q552 71 501 67 Z", at: 0.55 },
  { d: WRAP, at: 0.65, fine: true },

  // ── Pommel ────────────────────────────
  // neck
  { d: "M612 54 L620 52 L620 68 L612 66", at: 0.65 },
  // wheel pommel, inner ring, rivet
  { d: "M620 60 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0", at: 0.7 },
  { d: "M627 60 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", at: 0.8, fine: true },
  { d: "M633 60 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0", at: 0.85, fine: true },
  // peen block
  { d: "M652 56 L658 56 L658 64 L652 64", at: 0.8 },
];

// Cord and tassel hanging from the peen (sways)
const TASSEL = [
  "M658 60 C670 64 674 76 668 88",
  "M665 91 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0",
  "M666 94 L662 114 M668 94 L668 116 M670 94 L674 114",
];

export default function Sword({ delay = 0.6 }: { delay?: number }) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const { navigate } = useRouter();
  const morse = useRef({ seq: "", downAt: 0, lastAt: 0, charge: 0, full: 0, held: 0 });
  const clearCharge = () => {
    const m = morse.current;
    clearTimeout(m.charge); clearTimeout(m.full);
    svgRef.current?.classList.remove("is-charging", "is-charged");
  };

  const pressDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const m = morse.current;
    m.downAt = performance.now();
    clearCharge();
    // visual cue that the hold now counts as a dash / charges the strike
    m.charge = window.setTimeout(() => svgRef.current?.classList.add("is-charging"), DASH_MS);
    m.full = window.setTimeout(() => svgRef.current?.classList.add("is-charged"), FULL_MS);
  };
  const pressUp = () => {
    const m = morse.current;
    clearCharge();
    if (!m.downAt) return;
    const now = performance.now(), held = now - m.downAt;
    m.downAt = 0;
    m.held = held; // read by strike(), which runs on the click right after
    if (now - m.lastAt > RESET_MS + held) m.seq = "";
    m.lastAt = now;
    m.seq = (m.seq + (held >= DASH_MS ? "-" : ".")).slice(-SECRET.length);
    if (m.seq === SECRET) {
      m.seq = "";
      navigate("/login");
    }
  };

  const strike = () => {
    const svg = svgRef.current!, r = svg.getBoundingClientRect();
    const m = morse.current;
    // tap = 1, a full 1.5s hold = 3
    const power = 1 + 2 * Math.min(1, Math.max(0, (m.held - DASH_MS) / (FULL_MS - DASH_MS)));
    m.held = 0;
    // blade tip sits at x = 10 of the 690-wide viewBox, on the centre line
    dispatchEvent(new CustomEvent("sword:strike", { detail: { x: r.left + (10 / 690) * r.width, y: r.top + r.height / 2, power } }));
    if (reduce) return;
    bodyRef.current?.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${-44 * power}px)`, offset: 0.22 }, { transform: "translateX(0)" }],
      { duration: 650 + 250 * (power - 1), easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    // charged hits shake the hero content
    if (power > 1.3) {
      const a = 7 * (power - 1);
      svg.closest(".hero")?.querySelector(".hero__inner")?.animate(
        [0, 1, -1, 0.7, -0.6, 0.3, 0].map((k, i) => ({ transform: `translate(${k * a}px, ${(i % 2 ? -k : k) * a * 0.5}px)` })),
        { duration: 420 + 120 * power, easing: "ease-out" },
      );
    }
    svg.classList.remove("is-striking");
    void svg.getBoundingClientRect(); // restart the flash
    svg.classList.add("is-striking");
  };
  const draw = (at: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 1.4, ease: EASE, delay: delay + at },
        };

  return (
    <svg
      ref={svgRef}
      className="hero__sword"
      viewBox="0 0 690 122"
      fill="none"
      aria-hidden="true"
      onClick={strike}
      onPointerDown={pressDown}
      onPointerUp={pressUp}
      onPointerLeave={() => { clearCharge(); morse.current.downAt = 0; }}
      onAnimationEnd={(e) => e.animationName === "sword-flash" && svgRef.current?.classList.remove("is-striking")}
    >
      <g ref={bodyRef}>
      {PARTS.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          className={p.accent ? "hero__sword-accent" : p.blade ? "hero__sword-blade" : p.fine ? "hero__sword-fine" : undefined}
          vectorEffect="non-scaling-stroke"
          {...draw(p.at)}
        />
      ))}

      {/* Sways from the peen block via CSS (.hero__sword-tassel) */}
      <g className="hero__sword-tassel">
        {TASSEL.map((d, i) => (
          <motion.path key={i} d={d} className="hero__sword-fine" vectorEffect="non-scaling-stroke" {...draw(0.9 + i * 0.1)} />
        ))}
      </g>

      {/* Glint travelling along the upper edge */}
      {!reduce && (
        <motion.path
          d="M20 60 C58 54 88 51 120 50 L448 49"
          className="hero__sword-glint"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0.08, pathOffset: 0, opacity: 0 }}
          animate={{ pathOffset: [0, 0.92], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.4, delay: delay + 2.2 }}
        />
      )}
      </g>
    </svg>
  );
}
