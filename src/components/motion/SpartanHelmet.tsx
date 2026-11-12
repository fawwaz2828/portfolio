import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Line-art Spartan (Corinthian) helmet in profile, facing left, without a
 * crest, drawn in the same style as the hero sword: strokes trace
 * themselves in (shell → eye opening → embossing).
 * Sits inline next to the "About me" heading and scales with its font size.
 * `play` holds the draw-in until the heading is revealed.
 * Interactive like the hero sword: hovering anywhere on the helmet makes it
 * glow red; pressing it lights a red eye in the eye opening (with a flash),
 * which stays lit while held and fades out a moment after release.
 */
const AFTERGLOW_MS = 1400;
const EASE = [0.16, 1, 0.3, 1] as const;

type Part = { d: string; at: number; fine?: boolean };

const SHELL = "M32 60 C34 36 56 26 80 27 C104 28 120 46 118 72 C117 88 114 100 121 112 L104 117 C97 109 88 105 80 107 C72 109 66 117 61 127 L44 127 C39 116 37 104 37 92 L31 90 L30 64 Z";
const EYE = "M36 74 L58 72 C62 74 62 80 57 82 L38 84 Z";

const PARTS: Part[] = [
  // shell: brow, dome, back of the skull, neck flare, cheek guard, chin, nose guard
  { d: SHELL, at: 0 },
  // eye opening
  { d: EYE, at: 0.2 },
  // embossed brow band and eyebrow curl
  { d: "M33 63 C52 58 72 58 92 63", at: 0.3, fine: true },
  { d: "M44 67 C54 63 64 64 70 68", at: 0.35, fine: true },
  // seam between skull and cheek guard
  { d: "M80 107 C78 96 80 84 92 76", at: 0.35, fine: true },
];

export default function SpartanHelmet({ play = true, delay = 0 }: { play?: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  const [lit, setLit] = useState(false);
  const [flash, setFlash] = useState(0); // bumps on every press to replay the flash
  const off = useRef(0);
  useEffect(() => () => clearTimeout(off.current), []);

  const press = () => { clearTimeout(off.current); setLit(true); setFlash((n) => n + 1); };
  const release = () => { clearTimeout(off.current); off.current = window.setTimeout(() => setLit(false), AFTERGLOW_MS); };

  return (
    <svg
      className={`helmet${lit ? " is-lit" : ""}`}
      viewBox="26 22 100 110"
      fill="none"
      aria-hidden="true"
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={() => lit && release()}
    >
      {/* hit area: the whole helmet silhouette, so hover and press work anywhere on it */}
      <path className="helmet__hit" d={SHELL} />
      {PARTS.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          className={p.fine ? "helmet__fine" : undefined}
          // no vectorEffect="non-scaling-stroke": with it Chrome measures the
          // pathLength dashes in screen pixels, so when the helmet is drawn
          // larger than its viewBox (the big /about title) strokes stop short
          {...(reduce
            ? {}
            : {
                initial: { pathLength: 0, opacity: 0 },
                animate: play ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
                transition: { duration: 1.2, ease: EASE, delay: play ? delay + p.at : 0 },
              })}
        />
      ))}
      {/* the eye: a red glow filling the opening, a soft halo and a bright core */}
      <path className="helmet__socket" d={EYE} />
      <circle className="helmet__glow" cx="48" cy="78" r="7" />
      <circle key={flash} className={`helmet__eye${flash ? " is-flash" : ""}`} cx="48" cy="78" r="2.8" />
    </svg>
  );
}
