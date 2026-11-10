import About from "./About";
import { motion } from "motion/react";
import ProximityText from "./motion/ProximityText";
import CrtBackground from "./motion/CrtBackground";
import Sword from "./motion/Sword";
import { useLang } from "../i18n";

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4.5 13.5 13.5 4.5M6 4.5h7.5V12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

const note = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Hero() {
  const { t, lang } = useLang();
  // Two stacked lines; the second one is drawn as an outline only
  const lines = t.hero.lines.map((text, i) => ({ text, outline: i === 1 }));
  const title = t.hero.lines.join(lang === "zh" ? "" : " ");

  return (
    <section className="sec sec--dark hero" data-tone="dark">
      <CrtBackground image="/images/background1.jpg" />
      <Sword />

      <div className="hero__inner">
        <h1 className="hero__title" aria-label={title}>
          {lines.map((line, i) => (
            <span
              key={`${lang}-${i}`}
              className={`hero__line${line.outline ? " hero__line--outline" : ""}`}
              aria-hidden="true"
            >
              <ProximityText text={line.text} min={250} max={800} radius={300} intro={{ delay: 0.3 + i * 0.1 }} scramble />
            </span>
          ))}
        </h1>

        <div className="hero__side">
          <motion.ul
            className="hero__notes"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 1.1 } } }}
          >
            {t.hero.notes.map((n, i) => (
              <motion.li key={i} variants={note}>
                <span className="hero__notes-no">0{i + 1}</span> {n}
              </motion.li>
            ))}
            <motion.li className="hero__status" variants={note}>
              <span className="hero__status-dot" aria-hidden="true" /> {t.hero.status}
            </motion.li>
          </motion.ul>
        </div>
      </div>

      {/* Second stage of the pinned hero: the About content, revealed as the hero unravels (useAnimations §4b) */}
      <div className="hero__manifesto" id="about">
        <About />
      </div>

      <motion.div
        className="hero__micro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <span>{t.name}</span>
        <span className="hero__micro-center">{t.hero.role}<br />{t.hero.based}</span>
        <span>©{new Date().getFullYear()}</span>
      </motion.div>
    </section>
  );
}
