import { useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Line-art heraldic shield, front view, in the same style as the hero sword
 * and the Spartan helmet: a heater shield with a riveted double border over
 * two crossed swords. The chief (top band) carries three lozenges; the field
 * below has a red chevron behind a castle tower (battlements, arrow slit,
 * gate with portcullis, masonry), two stars and a lozenge in the point.
 * Strokes trace themselves in (swords → shield → charges → details); filled
 * parts hide what sits behind them. `play` holds the draw-in until the
 * "Selected Projects" heading scrolls into view.
 *
 * Interactive like the hero sword: hovering glows red. Pressing is a game
 * "block": the shield braces (shrinks) and the swords tuck in behind it
 * while held; each press flashes the shield, sends a shockwave and a burst
 * of sparks from the point that was hit, and shakes it.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

type Part = { d: string; at: number; fill?: boolean; fine?: boolean; accent?: boolean; far?: boolean; rivet?: boolean };

const PARTS: Part[] = [
  // ── crossed swords behind the shield: blade, fuller, guard, grip, pommel ──
  { d: "M63 31 L254 308 L256 318 L247 313 L57 35 Z", at: 0, fill: true, far: true },
  { d: "M62 36 L250 310", at: 0.5, fine: true, far: true },
  { d: "M46 43 L74 23 M49 46 L77 26", at: 0.25, far: true },
  { d: "M58 30 L48 16 M54 33 L44 19", at: 0.3, far: true },
  { d: "M39 11 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0", at: 0.35, far: true },
  { d: "M237 31 L46 308 L44 318 L53 313 L243 35 Z", at: 0.1, fill: true, far: true },
  { d: "M238 36 L50 310", at: 0.55, fine: true, far: true },
  { d: "M254 43 L226 23 M251 46 L223 26", at: 0.3, far: true },
  { d: "M242 30 L252 16 M246 33 L256 19", at: 0.35, far: true },
  { d: "M251 11 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0", at: 0.4, far: true },

  // ── shield: outer edge, inner border ──
  { d: "M60 58 C88 48 120 46 150 56 C180 46 212 48 240 58 L240 168 C240 236 204 286 150 322 C96 286 60 236 60 168 Z", at: 0.2, fill: true },
  { d: "M70 68 C94 60 122 58 150 67 C178 58 206 60 230 68 L230 168 C230 229 198 275 150 309 C102 275 70 229 70 168 Z", at: 0.4 },

  // ── chief: double line and three lozenges ──
  { d: "M70 112 L230 112", at: 0.6 },
  { d: "M70 117 L230 117", at: 0.7, fine: true },
  { d: "M105 79 L113 90 L105 101 L97 90 Z M195 79 L203 90 L195 101 L187 90 Z", at: 0.8 },
  { d: "M150 77 L160 90 L150 103 L140 90 Z", at: 0.8, accent: true, fill: true },
  { d: "M150 84 L154 90 L150 96 L146 90 Z", at: 0.95, accent: true, fine: true },
  { d: "M78 90 L90 90 M120 90 L133 90 M167 90 L180 90 M210 90 L222 90", at: 0.9, fine: true },

  // ── field: chevron, with a thin line echoing it below ──
  { d: "M74 200 L150 138 L226 200 L219 226 L150 166 L81 226 Z", at: 0.7, accent: true, fill: true },
  { d: "M88 240 L150 186 L212 240", at: 0.9, fine: true },
  // stars either side of the tower
  { d: "M98 138 L101 146 L109 149 L101 152 L98 160 L95 152 L87 149 L95 146 Z M202 138 L205 146 L213 149 L205 152 L202 160 L199 152 L191 149 L199 146 Z", at: 0.9, fine: true },

  // ── castle tower over the chevron ──
  { d: "M120 152 L120 130 L132 130 L132 139 L144 139 L144 130 L156 130 L156 139 L168 139 L168 130 L180 130 L180 152 L174 158 L174 246 L126 246 L126 158 Z", at: 0.8, fill: true },
  { d: "M120 152 L180 152 M126 158 L174 158", at: 1, fine: true },
  // gate with portcullis
  { d: "M140 246 L140 224 C140 209 160 209 160 224 L160 246", at: 1 },
  { d: "M145 216 L145 246 M150 213 L150 246 M155 216 L155 246 M140 226 L160 226 M140 236 L160 236", at: 1.15, fine: true },
  // arrow slit
  { d: "M150 166 L150 190 M144 177 L156 177", at: 1.1, accent: true },
  // masonry
  { d: "M126 172 L142 172 M158 172 L174 172 M126 186 L142 186 M158 186 L174 186 M126 200 L174 200 M134 158 L134 172 M166 172 L166 186 M134 186 L134 200 M138 200 L138 214 M162 200 L162 214 M126 214 L140 214 M160 214 L174 214 M132 214 L132 230 M168 214 L168 230 M126 230 L140 230 M160 230 L174 230", at: 1.2, fine: true },
  // ground under the tower, lozenge in the point of the shield
  { d: "M94 246 L206 246 M108 252 L192 252", at: 1.1, fine: true },
  { d: "M150 264 L157 276 L150 288 L143 276 Z", at: 1.2 },

  // ── rivets along the border ──
  { d: "M150 61.5 h.1 M105 56 h.1 M195 56 h.1 M65 75 h.1 M65 110 h.1 M65 145 h.1 M65 180 h.1 M71 213 h.1 M88.5 253 h.1 M115 287 h.1 M150 315.5 h.1 M185 287 h.1 M211.5 253 h.1 M229 213 h.1 M235 180 h.1 M235 145 h.1 M235 110 h.1 M235 75 h.1", at: 1.3, rivet: true },
];

// the first ten parts are the two crossed swords, the rest is the shield
const SWORD_PARTS = 10;
const SHIELD = "M60 58 C88 48 120 46 150 56 C180 46 212 48 240 58 L240 168 C240 236 204 286 150 322 C96 286 60 236 60 168 Z";

type Hit = { n: number; x: number; y: number; sparks: { a: number; r0: number; r1: number }[] };

const cls = (p: Part) =>
  [p.fill && "crest__fill", p.fine && "crest__fine", p.accent && "crest__accent", p.far && "crest__far", p.rivet && "crest__rivet"]
    .filter(Boolean).join(" ") || undefined;

export default function CrestShield({ play = true, delay = 0 }: { play?: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const [held, setHeld] = useState(false);
  const [hit, setHit] = useState<Hit | null>(null);

  const block = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setHeld(true);
    // impact point in drawing units, kept on the shield's face
    const svg = svgRef.current!;
    const m = svg.getScreenCTM();
    let x = 150, y = 170;
    if (m) {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      x = Math.min(215, Math.max(85, p.x));
      y = Math.min(260, Math.max(80, p.y));
    }
    const sparks = Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2 + Math.random() * 0.4;
      const r0 = 6 + Math.random() * 6;
      return { a, r0, r1: r0 + 18 + Math.random() * 26 };
    });
    setHit((h) => ({ n: (h?.n ?? 0) + 1, x, y, sparks }));
    // shake played directly, so the drawn paths are not remounted (and redrawn) on every hit
    if (!reduce) {
      bodyRef.current?.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: "translate(-5px, 2px) rotate(-1.2deg)", offset: 0.15 },
          { transform: "translate(4px, -2px) rotate(1deg)", offset: 0.35 },
          { transform: "translate(-3px, 1px) rotate(-.6deg)", offset: 0.55 },
          { transform: "translate(2px, 0) rotate(.3deg)", offset: 0.75 },
          { transform: "translate(0, 0)" },
        ],
        { duration: 320, easing: "cubic-bezier(.36, .07, .19, .97)" },
      );
    }
  };
  const letGo = () => setHeld(false);

  const draw = (p: Part, i: number) => (
        <motion.path
          key={i}
          d={p.d}
          className={cls(p)}
          // no vectorEffect="non-scaling-stroke": it makes Chrome measure the
          // pathLength dashes in screen pixels, cutting strokes short when the
          // shield is drawn larger than its viewBox
          {...(reduce
            ? {}
            : {
                initial: { pathLength: 0, opacity: 0 },
                animate: play ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
                transition: { duration: 1.4, ease: EASE, delay: play ? delay + p.at : 0 },
              })}
        />
  );

  return (
    <svg
      ref={svgRef}
      className={`crest${held ? " is-held" : ""}`}
      viewBox="30 0 240 328"
      fill="none"
      aria-hidden="true"
      onPointerDown={block}
      onPointerUp={letGo}
      onPointerCancel={letGo}
      onPointerLeave={letGo}
    >
      <g ref={bodyRef} className="crest__body">
        <g className="crest__swords">{PARTS.slice(0, SWORD_PARTS).map((p, i) => draw(p, i))}</g>
        <g className="crest__shield">
          {PARTS.slice(SWORD_PARTS).map((p, i) => draw(p, i + SWORD_PARTS))}
          {hit && <path key={hit.n} className="crest__flash" d={SHIELD} />}
        </g>
      </g>
      {hit && (
        <g key={hit.n} className="crest__fx">
          <circle className="crest__ring" cx={hit.x} cy={hit.y} r="34" />
          <circle className="crest__ring crest__ring--2" cx={hit.x} cy={hit.y} r="34" />
          <circle className="crest__core" cx={hit.x} cy={hit.y} r="7" />
          {hit.sparks.map((s, i) => (
            <line
              key={i}
              className="crest__spark"
              x1={hit.x + Math.cos(s.a) * s.r0}
              y1={hit.y + Math.sin(s.a) * s.r0}
              x2={hit.x + Math.cos(s.a) * s.r1}
              y2={hit.y + Math.sin(s.a) * s.r1}
              style={{ animationDelay: `${(i % 3) * 20}ms` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
