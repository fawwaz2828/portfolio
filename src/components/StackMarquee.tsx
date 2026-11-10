import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLang } from "../i18n";
import {
  siReact, siNextdotjs, siTypescript, siJavascript, siTailwindcss, siHtml5, siCss, siVite, siGreensock,
  siSwift, siXcode, siFlutter, siDart, siOpenjdk, siSpringboot, siFastapi, siPython, siPhp,
  siMysql, siSupabase, siFirebase, siMapbox, siWordpress, siFigma, siGit, siGithub,
  type SimpleIcon,
} from "simple-icons";

/**
 * Tech-stack band after christendijoux.com's manifesto marquee, with logos in
 * place of words. Driven by the GSAP ticker: a constant drift that speeds up
 * with scroll velocity, flips direction with the scroll direction and skews
 * while moving fast. It can also be dragged sideways and thrown.
 */
const STACK: SimpleIcon[] = [
  siReact, siNextdotjs, siTypescript, siJavascript, siTailwindcss, siHtml5, siCss, siVite, siGreensock,
  siSwift, siXcode, siFlutter, siDart, siOpenjdk, siSpringboot, siFastapi, siPython, siPhp,
  siMysql, siSupabase, siFirebase, siMapbox, siWordpress, siFigma, siGit, siGithub,
];
// OpenJDK's mark reads better under the plain language name
const nameOf = (i: SimpleIcon) => (i === siOpenjdk ? "Java" : i.title);

export default function StackMarquee() {
  const { t } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current!, band = el.parentElement!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = 0, skew = 0, dir = -1, lastY = scrollY, onScreen = false;
    // Drag: the band follows the pointer, then coasts on the release speed
    let dragging = false, pointerId = -1, lastX = 0, fling = 0;

    const wrap = () => {
      const half = el.scrollWidth / 2;
      if (half) x = ((x % half) - half) % half; // keep x in (-half, 0]
    };
    const render = () => { el.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`; };

    const tick = () => {
      const v = scrollY - lastY; // px per frame, like Lenis' velocity
      lastY = scrollY;
      if (!onScreen || dragging) return;
      if (v !== 0) dir = v > 0 ? -1 : 1;
      const drift = reduce ? 0 : dir * (0.6 + Math.min(0.5 * Math.abs(v), 18));
      x += drift + fling;
      fling *= 0.94; // throw decays back into the normal drift
      if (Math.abs(fling) < 0.05) fling = 0;
      wrap();
      const target = reduce ? 0 : Math.max(-12, Math.min(12, 0.6 * v - 0.5 * fling));
      skew += (target - skew) * 0.12;
      render();
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true; pointerId = e.pointerId; lastX = e.clientX; fling = 0;
      band.classList.add("is-dragging");
    };
    const move = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (Math.abs(dx) > 2 && !band.hasPointerCapture(pointerId)) band.setPointerCapture(pointerId);
      x += dx;
      fling = fling * 0.6 + dx * 0.4; // smoothed speed for the throw
      if (dx !== 0) dir = dx > 0 ? 1 : -1; // keep drifting the way it was dragged
      wrap();
      skew += (Math.max(-12, Math.min(12, -0.4 * dx)) - skew) * 0.3;
      render();
    };
    const up = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      if (band.hasPointerCapture(pointerId)) band.releasePointerCapture(pointerId);
      band.classList.remove("is-dragging");
    };
    band.addEventListener("pointerdown", down);
    band.addEventListener("pointermove", move);
    band.addEventListener("pointerup", up);
    band.addEventListener("pointercancel", up);

    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; });
    io.observe(band);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick); io.disconnect();
      band.removeEventListener("pointerdown", down);
      band.removeEventListener("pointermove", move);
      band.removeEventListener("pointerup", up);
      band.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <section className="stack" id="stack" aria-label={`${t.stack.label}: ${STACK.map(nameOf).join(", ")}`}>
      <div className="stack__fade" aria-hidden="true" />
      <div className="stack__band">
        <div ref={trackRef} className="stack__track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="stack__set">
              {STACK.map((icon) => (
                <span key={`${copy}-${icon.slug}`} className="stack__item">
                  <svg
                    className="stack__logo"
                    viewBox="0 0 24 24"
                    role="img"
                  >
                    <title>{nameOf(icon)}</title>
                    <path d={icon.path} />
                  </svg>
                  <span className="stack__sep">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="stack__caption">{t.stack.caption}</p>
      </div>
    </section>
  );
}
