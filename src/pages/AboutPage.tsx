import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProximityText from "../components/motion/ProximityText";
import AsciiOverlay from "../components/motion/AsciiOverlay";
import StackMarquee from "../components/StackMarquee";
import { contact, education, experience, faq, skills, stats, type Entry } from "../data";
import { useLang } from "../i18n";

/**
 * /about — the long version. The landing page keeps a three-paragraph intro;
 * here: portrait + bio + quick facts, numbers, experience and education
 * timelines, skills, FAQ and the tech-stack band.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const rise: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: i * 0.06 } }),
};
const inView = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } } as const;

function SectionHead({ no, title }: { no: string; title: string }) {
  return (
    <div className="ab-head">
      <span className="label ab-head__no">[ {no} ]</span>
      <h2 className="ab-head__title" aria-label={title}>
        <span aria-hidden="true">
          <ProximityText text={title} min={250} max={800} radius={260} />
        </span>
      </h2>
    </div>
  );
}

function Timeline({ entries }: { entries: Entry[] }) {
  return (
    <ol className="ab-rows">
      {entries.map((e, i) => (
        <motion.li key={e.title + e.date} className="ab-row" variants={rise} custom={i} {...inView}>
          <span className="ab-row__date label">{e.date}</span>
          <span className="ab-row__title">{e.title}</span>
          <span className="ab-row__place">{e.place}</span>
        </motion.li>
      ))}
    </ol>
  );
}

function Question({ q, a, n }: { q: string; a: string; n: number }) {
  const [open, setOpen] = useState(false);
  const id = `ab-faq-${n}`;
  return (
    <motion.div className="ab-faq" variants={rise} custom={n} {...inView}>
      <button className="ab-faq__q" aria-expanded={open} aria-controls={id} data-cursor-plain onClick={() => setOpen((o) => !o)}>
        <span className="label ab-faq__n">{String(n).padStart(2, "0")}</span>
        <span>{q}</span>
        <motion.span className="ab-faq__icon" animate={{ rotate: open ? 45 : 0 }} aria-hidden="true">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="a"
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            onAnimationComplete={() => ScrollTrigger.refresh()}
            style={{ overflow: "hidden" }}
          >
            <p className="ab-faq__a">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AboutPage() {
  const { t, lang } = useLang();
  const p = t.aboutPage;

  return (
    <>
      <section className="sec sec--dark ab" data-tone="dark">
        {/* ── Intro ── */}
        <div className="ab-intro">
          <div className="ab-intro__text">
            <p className="label ab-kicker"><span className="ab-kicker__bar" aria-hidden="true" />[ 01 ] · {p.kicker}</p>
            <h1 className="ab-title" aria-label={t.about.heading}>
              <span aria-hidden="true">
                <ProximityText key={lang} text={t.about.heading} min={250} max={800} radius={300} intro={{ delay: 0.75 }} />
              </span>
            </h1>
            <div className="ab-bio">
              {t.about.paras.map((para, i) => (
                <motion.p key={`${lang}-${i}`} className={i === 0 ? "ab-bio__lead" : undefined} variants={rise} custom={i + 10} initial="hidden" animate="show">
                  {para}
                </motion.p>
              ))}
            </div>
            <motion.div className="ab-actions" variants={rise} custom={14} initial="hidden" animate="show">
              <a className="btn-solid" href={contact.cv} target="_blank" rel="noopener noreferrer" data-cursor-plain>{p.cv} ↗</a>
              <a className="ab-link" href={`mailto:${contact.email}`}>{contact.email}</a>
            </motion.div>
          </div>

          <div className="ab-intro__side">
            <motion.figure
              className="ab-photo"
              initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.6 }}
            >
              <img src="/images/me.png" alt={t.about.photoAlt} decoding="async" />
              <AsciiOverlay src="/images/me.png" />
              <figcaption className="ab-photo__tag">(FW)</figcaption>
            </motion.figure>
            <dl className="ab-facts">
              {p.facts.map(([k, v], i) => (
                <motion.div key={k} className="ab-fact" variants={rise} custom={i + 12} initial="hidden" animate="show">
                  <dt className="label">{k}</dt>
                  <dd>{v}</dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>

        {/* ── Numbers ── */}
        <div className="ab-stats">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="ab-stat" variants={rise} custom={i} {...inView}>
              <span className="ab-stat__value">{s.value}</span>
              <span className="ab-stat__label label">{p.stats[i] ?? s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* ── Experience ── */}
        <div className="ab-block">
          <SectionHead no="02" title={p.experience} />
          <Timeline entries={experience} />
        </div>

        {/* ── Education ── */}
        <div className="ab-block">
          <SectionHead no="03" title={p.education} />
          <Timeline entries={education} />
        </div>

        {/* ── Skills ── */}
        <div className="ab-block">
          <SectionHead no="04" title={p.skills} />
          <div className="ab-skills">
            {skills.map((g, i) => (
              <motion.div key={g.group} className="ab-skill" variants={rise} custom={i} {...inView}>
                <h3 className="label ab-skill__group">{g.group}</h3>
                <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="ab-block">
          <SectionHead no="05" title={p.faq} />
          <div className="ab-faqs">
            {faq.map((f, i) => <Question key={f.q} q={f.q} a={f.a} n={i + 1} />)}
          </div>
        </div>
      </section>
      <StackMarquee />
    </>
  );
}
