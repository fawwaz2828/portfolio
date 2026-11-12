import { Fragment, useEffect, useState } from "react";
import ProximityText from "./motion/ProximityText";
import AsciiOverlay from "./motion/AsciiOverlay";
import SpartanHelmet from "./motion/SpartanHelmet";
import { tokens, useLang } from "../i18n";
import { Link } from "../router";

const PHOTO = "/images/me.jpg";

/**
 * About content, shown as the second stage of the pinned hero (see Hero +
 * useAnimations §4b). Words are woven in row by row; the heading, set like the
 * hero headline, rises in when the stage is revealed ("about:reveal" event)
 * and its letters thicken near the pointer.
 * `standalone` (the /about page) reveals by itself shortly after mount.
 */
export default function About({ standalone = false }: { standalone?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const { t, lang } = useLang();
  const gap = lang === "zh" ? "" : " ";

  useEffect(() => {
    if (!standalone) return;
    const id = setTimeout(() => setRevealed(true), 700); // after the page transition settles
    return () => clearTimeout(id);
  }, [standalone]);

  useEffect(() => {
    if (standalone) return;
    const show = () => setRevealed(true);
    const hide = () => setRevealed(false);
    addEventListener("about:reveal", show);
    addEventListener("about:hide", hide);
    return () => {
      removeEventListener("about:reveal", show);
      removeEventListener("about:hide", hide);
    };
  }, [standalone]);

  return (
    <div className="about-stage">
      <div className="about__index">
        <span className="label">(01)</span>
      </div>

      <div className="about__grid">
        <figure className="about__photo">
          <img src={PHOTO} alt={t.about.photoAlt} loading="lazy" decoding="async" />
          <AsciiOverlay src={PHOTO} />
          <figcaption className="about__photo-tag">(FW)</figcaption>
        </figure>

        <div className="about__text">
          <h2 className="about__heading" aria-label={t.about.heading}>
            <span aria-hidden="true">
              <ProximityText key={lang} text={t.about.heading} min={250} max={800} radius={300} intro={{ delay: 0.05 }} play={revealed} scramble />
              <SpartanHelmet play={revealed} delay={0.3} />
            </span>
          </h2>

          <div className="about__body">
            {t.about.paras.map((p, i) => (
              <p key={`${lang}-${i}`} className={`about__para${i > 0 ? " about__para--end" : ""}`}>
                {/* screen readers get the sentence once; the animated words are hidden from them */}
                <span className="sr-only">{p}</span>
                {tokens(p, lang).map((w, j) => (
                  <Fragment key={j}>
                    <span className="hero__word" data-word aria-hidden="true">{w}</span>{gap}
                  </Fragment>
                ))}
              </p>
            ))}
            {/* Landing page only: the full story lives on /about */}
            {!standalone && (
              <Link to="/about" className="btn-solid about__more">
                {t.about.more} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
