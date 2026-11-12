import { motion, useReducedMotion } from "motion/react";

/**
 * Line-art barded warhorse in profile, facing right (toward the projects),
 * drawn in the same style as the hero sword and the Spartan helmet.
 * Standing with near and far legs offset, with anatomy lines (jowl, nostril,
 * jugular groove, shoulder, ribs, stifle, hocks, tendons, fetlock tufts) and
 * full plate barding: chanfron with
 * eye guard and plume, articulated crinet on the neck, peytral with a boss
 * on the chest, crupper with a scalloped hem over the rump, war saddle.
 * Strokes trace themselves in (body → legs → armor → details); filled
 * parts hide what sits behind them. `play` holds the draw-in until the
 * "Selected Projects" heading scrolls into view.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

type Part = { d: string; at: number; fill?: boolean; fine?: boolean; accent?: boolean; far?: boolean; rivet?: boolean };

const PARTS: Part[] = [
  // ── behind the body ──
  // far ear
  { d: "M326 40 C324 30 328 19 335 12 C339 22 339 33 334 43", at: 0.3, fill: true, far: true },
  // far legs
  { d: "M272 216 C275 232 273 248 271 260 C274 265 274 271 271 276 L270 296 C272 303 276 308 281 312 L285 320 L262 320 L262 313 C258 309 256 304 256 298 L256 277 C254 271 254 265 256 260 C254 246 250 234 246 222", at: 0.3, fill: true, far: true },
  { d: "M184 210 C178 226 168 240 162 254 C160 260 160 266 160 272 L160 297 C162 304 166 309 171 312 L175 320 L152 320 L152 313 C148 309 146 304 146 298 L146 266 C142 260 139 252 141 244 C138 228 132 214 126 206", at: 0.35, fill: true, far: true },
  { d: "M258 278 L258 294 M148 270 L148 294", at: 0.85, fine: true, far: true },
  // tail
  { d: "M100 128 C80 132 66 156 64 190 C62 214 66 236 60 262 C70 256 76 246 80 232 C83 246 86 256 92 262 C92 240 88 220 90 200 C92 176 92 152 100 138", at: 0.5, fill: true },
  { d: "M94 136 C80 152 72 180 72 210 C72 228 70 242 66 254 M97 142 C88 162 82 188 82 214 C82 232 84 246 88 256 M90 150 C84 172 78 196 78 220", at: 0.75, fine: true },

  // ── body, neck and head ──
  { d: "M242 112 C268 70 304 40 322 40 C326 40 330 42 334 44 C346 60 360 84 372 104 C378 112 384 118 382 126 C380 132 374 136 368 136 C366 140 360 141 356 139 C350 137 346 132 344 126 C340 122 334 116 330 108 C326 100 326 96 322 92 C316 112 306 140 306 168 C308 186 300 204 290 214 C280 220 270 222 262 220 C240 228 200 228 166 208 C140 196 116 186 100 172 C94 160 92 150 94 140 C98 122 112 112 128 112 C146 112 166 120 186 124 C206 128 228 124 242 112 Z", at: 0, fill: true },
  // near ear with its inner fold
  { d: "M318 42 C312 31 313 20 319 11 C326 19 330 30 330 41", at: 0.3, fill: true },
  { d: "M319 18 C322 25 324 31 324 38", at: 0.8, fine: true },
  // head anatomy: jowl, cheekbone, nostril, lips, chin, eye
  { d: "M326 82 C340 82 348 96 346 110 C344 118 338 122 332 120", at: 0.7, fine: true },
  { d: "M344 70 C352 80 358 90 362 102", at: 0.75, fine: true },
  { d: "M371 114 C376 112 380 116 378 122 C376 124 373 124 371 121", at: 0.8 },
  { d: "M364 132 L376 131 M352 133 C350 130 348 128 346 124", at: 0.85, fine: true },
  { d: "M331 66 C335 61 341 61 345 65 C341 69 335 69 331 66 Z", at: 0.8 },
  // neck anatomy: jugular groove, under-neck muscle
  { d: "M324 100 C314 120 306 140 302 160 M318 92 C304 106 290 124 282 146", at: 0.7, fine: true },
  // forelock between the ears
  { d: "M326 42 C330 50 328 56 332 62 M330 42 C334 48 334 54 338 58", at: 0.8, fine: true },
  // mane wisps escaping under the crinet
  { d: "M266 118 C268 126 266 132 261 136 M282 100 C284 108 282 114 277 118 M298 84 C300 92 298 98 293 102 M312 72 C314 80 312 86 307 90", at: 0.85, fine: true },
  // body anatomy: shoulder, elbow, ribs, flank fold, stifle, gaskin
  { d: "M252 126 C258 148 268 166 282 180", at: 0.7, fine: true },
  { d: "M262 204 C258 210 258 216 262 220", at: 0.75, fine: true },
  { d: "M216 180 C210 194 210 208 214 222 M200 180 C196 194 196 206 200 220 M184 178 C180 190 180 202 184 214", at: 0.75, fine: true },
  { d: "M170 202 C164 194 162 186 166 178", at: 0.8, fine: true },
  { d: "M150 188 C146 200 140 214 128 226 M116 206 C122 220 124 232 122 244", at: 0.75, fine: true },

  // ── near legs ──
  { d: "M290 214 C293 232 291 248 289 260 C292 265 292 271 289 276 L288 296 C290 303 294 308 299 312 L303 320 L280 320 L280 313 C276 309 274 304 274 298 L274 277 C272 271 272 265 274 260 C272 246 268 232 262 220", at: 0.2, fill: true },
  { d: "M166 208 C160 226 150 240 144 254 C142 260 142 266 142 272 L142 297 C144 304 148 309 153 312 L157 320 L134 320 L134 313 C130 309 128 304 128 298 L128 266 C124 260 121 252 123 244 C118 222 110 196 100 172", at: 0.25, fill: true },
  // knee, chestnut, tendons, fetlock tufts, coronets, hoof walls
  { d: "M274 262 C280 264 284 264 289 262 M278 238 a2 4 0 1 0 4 0 a2 4 0 1 0 -4 0 M276 278 L276 294 M274 300 C270 304 270 308 273 311 M280 313 L299 313 M286 313 L289 320", at: 0.8, fine: true },
  { d: "M123 244 C130 242 138 246 143 254 M126 252 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M130 272 L130 294 M128 300 C124 304 124 308 127 311 M134 313 L153 313 M140 313 L143 320", at: 0.8, fine: true },

  // ── barding ──
  // crupper (rump plate): scalloped hem, inner border, emblem, tail guard
  { d: "M186 126 C166 120 146 112 128 112 C112 112 98 122 94 140 C92 150 94 160 98 168 C106 176 112 170 120 176 C128 182 134 174 142 180 C150 186 156 178 164 182 C172 186 178 178 186 180 Z", at: 0.45, fill: true },
  { d: "M182 132 C164 126 146 120 130 120 C116 120 106 128 102 142 C100 150 102 158 104 164 M108 170 C124 176 160 178 182 174", at: 0.75, fine: true },
  { d: "M131 150 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", at: 0.85, accent: true },
  { d: "M140 143 L140 157 M133 150 L147 150", at: 0.9, accent: true, fine: true },
  { d: "M100 122 L88 124 L88 138 L98 136 M88 131 L98 130", at: 0.6 },
  // crinet: lames with ridges and an inner border
  { d: "M244 110 C268 70 304 42 322 42 L326 62 C296 76 270 104 258 132 Z", at: 0.5, fill: true },
  { d: "M259 88 L267 115 M276 69 L278 99 M294 53 L293 85 M309 44 L309 72", at: 0.8, fine: true },
  { d: "M254 112 C270 88 294 64 320 52", at: 0.85, fine: true },
  // peytral: chest plate, engraved border, boss with spike
  { d: "M296 132 C306 150 310 176 302 196 C298 206 292 214 284 218 C276 222 268 222 260 222 C260 200 262 176 270 156 C278 146 288 138 296 132 Z", at: 0.55, fill: true },
  { d: "M294 142 C302 158 304 178 298 194 C294 204 288 210 280 214 C274 216 270 216 266 216 C266 198 268 180 276 164 C282 154 288 148 294 142 Z", at: 0.8, fine: true },
  { d: "M276 180 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M284 180 L296 176", at: 0.85 },
  // war saddle: cantle, seat, pommel, skirt quilting, girth, stirrup leather and iron
  { d: "M184 124 C180 112 182 100 190 96 C194 104 194 114 198 120 C208 124 218 122 224 116 C226 108 232 102 240 102 C240 110 238 116 234 122 L236 170 C220 176 200 176 186 170 Z", at: 0.4, fill: true },
  { d: "M188 132 L234 130 M190 144 L235 142 M190 156 L235 154 M222 174 L224 226 M226 174 L228 226", at: 0.75, fine: true },
  { d: "M204 174 L204 196 M196 196 C196 204 200 208 204 208 C208 208 212 204 212 196 Z", at: 0.8 },
  // chanfron: face plate, centre ridge, eye guard, rondel
  { d: "M334 46 C346 60 358 82 368 102 L362 112 C352 94 342 80 330 70 C328 60 330 52 334 46 Z", at: 0.55, fill: true },
  { d: "M334 52 C344 66 354 84 364 104", at: 0.85, fine: true },
  { d: "M329 65 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", at: 0.8 },
  { d: "M350 86 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0", at: 0.85, fine: true },
  // bridle: noseband, cheekpiece, bit, reins
  { d: "M346 112 C356 110 366 104 372 98 M336 58 C342 80 350 104 358 124 M356 124 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M360 126 C332 138 270 132 238 104", at: 0.85, fine: true },
  // rivets
  { d: "M267 110 h.1 M278 94 h.1 M293 80 h.1 M308 67 h.1 M112 166 h.1 M128 172 h.1 M146 176 h.1 M164 176 h.1 M180 172 h.1 M270 210 h.1 M290 204 h.1 M298 168 h.1 M286 150 h.1", at: 0.95, rivet: true },
  // plume
  { d: "M328 38 C320 12 336 -8 362 -4 C348 2 340 16 336 36", at: 0.9, accent: true, fill: true },
  { d: "M332 32 C330 16 340 4 352 0", at: 0.95, accent: true, fine: true },
  // ground
  { d: "M50 320 L390 320", at: 0.6, fine: true },
];

const cls = (p: Part) =>
  [p.fill && "horse__fill", p.fine && "horse__fine", p.accent && "horse__accent", p.far && "horse__far", p.rivet && "horse__rivet"]
    .filter(Boolean).join(" ") || undefined;

export default function ArmoredHorse({ play = true, delay = 0 }: { play?: boolean; delay?: number }) {
  const reduce = useReducedMotion();

  return (
    <svg className="horse" viewBox="30 -10 370 340" fill="none" aria-hidden="true">
      {PARTS.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          className={cls(p)}
          // no vectorEffect="non-scaling-stroke": it makes Chrome measure the
          // pathLength dashes in screen pixels, cutting strokes short when the
          // horse is drawn larger than its viewBox
          {...(reduce
            ? {}
            : {
                initial: { pathLength: 0, opacity: 0 },
                animate: play ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
                transition: { duration: 1.4, ease: EASE, delay: play ? delay + p.at : 0 },
              })}
        />
      ))}
    </svg>
  );
}
