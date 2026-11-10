import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import ProximityText from "./motion/ProximityText";
import { contact } from "../data";
import { useLang } from "../i18n";
import { HandsField, loadEmblemImage, loadHandsImage } from "./motion/handsField";

/**
 * Contact section with anthracitestudio.be's glyph hands as the background.
 * The section pins while you scroll down (plain vertical scroll) and the
 * scroll progress, sent by useAnimations as "contact:progress", lifts the
 * hands, brings the fingertips together, flashes, then pulls them apart
 * again while a ring spreads out and reveals the FW logo between them.
 */
export default function Contact() {
  const { t } = useLang();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleIn = useInView(titleRef, { once: true, margin: "0px 0px -15% 0px" });

  useEffect(() => {
    const stage = stageRef.current!, out = canvasRef.current!;
    const octx = out.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let field: HandsField | null = null, raf = 0, visible = false, alive = true, t0 = 0, progress = 0, ptrTarget = 0;

    const css = getComputedStyle(document.documentElement);
    const hex = css.getPropertyValue("--accent").trim() || "#ef4444";
    const n = parseInt(hex.slice(1), 16);
    const accent: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const bg = css.getPropertyValue("--surface").trim() || "#171717";

    // Scroll progress → pose
    const pose = (p: number) => {
      if (!field) return;
      const k = (a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
      const io = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
      // rise → touch (flash) → part again while the logo spreads out of the gap
      field.rise = io(k(0, 0.3));
      field.open = 0.22 * (1 - io(k(0.08, 0.42)));
      field.contact = io(k(0.3, 0.6));
      field.part = io(k(0.66, 0.92));
      field.wave = k(0.64, 1);
    };

    const size = () => {
      if (!field) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
      field.resize(w, h);
      out.width = w; out.height = h;
      render(true);
    };
    const render = (force = false) => {
      if (!field) return;
      const time = reduce ? 10 : (performance.now() - t0) / 1000;
      if (field.draw(time, force)) octx.drawImage(field.canvas, 0, 0);
    };
    const loop = () => {
      if (!alive || !visible) return;
      // Ease the pointer lens in and out
      if (field) field.pointer.on += Math.max(-0.08, Math.min(0.08, ptrTarget - field.pointer.on));
      render();
      raf = requestAnimationFrame(loop);
    };

    loadHandsImage().then(async (img) => {
      await document.fonts.load(`700 16px "Space Mono"`).catch(() => {});
      if (!alive) return;
      field = new HandsField(img, accent, bg);
      // Settle below the heading so the text stays readable
      field.restY = 0.66;
      // FW logo appears out of the light once the hands touch
      loadEmblemImage().then((logo) => { if (alive && field) { field.setEmblem(logo); render(true); } }).catch(() => {});
      pose(reduce ? 0.8 : progress);
      size();
    });

    const onProgress = (e: Event) => { progress = (e as CustomEvent<number>).detail; pose(progress); };
    addEventListener("contact:progress", onProgress);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        if (!t0) t0 = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      } else cancelAnimationFrame(raf);
    });
    io.observe(stage);
    const ro = new ResizeObserver(size);
    ro.observe(stage);

    // Pointer lights up the glyphs around it (fine pointers only)
    const move = (e: PointerEvent) => {
      if (!field) return;
      const r = stage.getBoundingClientRect();
      field.pointer.x = (e.clientX - r.left) / r.width;
      field.pointer.y = (e.clientY - r.top) / r.height;
      ptrTarget = 1;
    };
    const leave = () => { ptrTarget = 0; };
    const fine = matchMedia("(pointer: fine)").matches;
    if (fine) { stage.addEventListener("pointermove", move); stage.addEventListener("pointerleave", leave); }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      removeEventListener("contact:progress", onProgress);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <section className="sec sec--dark contact" id="contact" data-tone="dark">
      <div ref={stageRef} className="contact__stage">
        <canvas ref={canvasRef} className="contact__canvas" aria-hidden="true" />

        <div className="contact__content">
          <div className="contact__top">
            <div className="contact__head">
              <p className="contact__kicker">
                <span className="contact__bar" aria-hidden="true" />[ <b>03</b> ] · {t.contact.kicker}
              </p>
              {/* Same treatment as the hero title: letters rise in, weight follows the pointer */}
              <h2 ref={titleRef} className="contact__title" aria-label={t.contact.title.join(" ")}>
                {t.contact.title.map((line, i) => (
                  <span key={`${t.contact.title[0]}-${i}`} className={i === 1 ? "contact__title-outline" : undefined} aria-hidden="true">
                    <ProximityText text={line} min={250} max={800} radius={300} intro={{ delay: 0.1 + i * 0.1 }} play={titleIn} scramble />
                  </span>
                ))}
              </h2>
            </div>
            <div className="contact__aside">
              <p className="contact__lead">{t.contact.lead}</p>
              <div className="contact__actions">
                <a className="btn-solid" href={`mailto:${contact.email}`}>{t.contact.email} ↗</a>
                <a className="contact__email" href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
          </div>

          <div className="contact__bottom">
            <span>© {year} {t.name} · {t.contact.rights}</span>
            <ul className="contact__links">
              {contact.socials.map((s) => (
                <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>
              ))}
              <li><a href={contact.cv} target="_blank" rel="noopener noreferrer">{t.contact.cv} ↗</a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
