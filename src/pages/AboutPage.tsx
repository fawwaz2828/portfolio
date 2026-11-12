import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProximityText from "../components/motion/ProximityText";
import CrtBackground from "../components/motion/CrtBackground";
import AsciiOverlay from "../components/motion/AsciiOverlay";
import SpartanHelmet from "../components/motion/SpartanHelmet";
import { StackTable } from "../components/StackMarquee";
import { contact, type Entry } from "../data";
import { useContent } from "../content";
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

/** "Experience ────◆" */
function SectionHead({ title }: { title: string }) {
  return (
    <div className="ab-head">
      <h2 className="ab-head__title" aria-label={title}>
        <span aria-hidden="true">
          <ProximityText text={title} min={250} max={800} radius={260} />
        </span>
      </h2>
      <span className="ab-head__rule" aria-hidden="true" />
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
      <button className="ab-faq__q" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
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
  const { experience, education, skills, faq } = useContent();

  return (
    <>
      <section className="sec sec--dark ab" data-tone="dark">
        {/* Same glitching photo backdrop as the homepage hero, behind the intro only, fading out below it */}
        <div className="ab-bg" aria-hidden="true">
          <CrtBackground image="/images/background1.jpg" />
        </div>
        {/* ── Intro ── */}
        <div className="ab-intro">
          <div className="ab-intro__text">
            <p className="ab-kicker"><span className="label">{p.kicker}</span></p>
            <h1 className="ab-title" aria-label={t.about.heading}>
              <span aria-hidden="true">
                <ProximityText key={lang} text={t.about.heading} min={250} max={800} radius={300} intro={{ delay: 0.75 }} />
                <SpartanHelmet delay={1} />
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
              <img src="/images/me.jpg" alt={t.about.photoAlt} decoding="async" />
              <AsciiOverlay src="/images/me.jpg" />
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

        {/* Experience | Education side by side on wide screens */}
        <div className="ab-cols">
        <div className="ab-block">
          <SectionHead title={p.experience} />
          <Timeline entries={experience} />
        </div>

        {/* ── Education ── */}
        <div className="ab-block">
          <SectionHead title={p.education} />
          <Timeline entries={education} />
        </div>
        </div>

        {/* Skills | FAQ side by side on wide screens */}
        <div className="ab-cols">
        <div className="ab-block">
          <SectionHead title={p.skills} />
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
          <SectionHead title={p.faq} />
          <div className="ab-faqs">
            {faq.map((f, i) => <Question key={f.q} q={f.q} a={f.a} n={i + 1} />)}
          </div>
        </div>
        </div>

        {/* ── Tech stack: a still table here, the moving band stays on the landing page ── */}
        <div className="ab-block">
          <SectionHead title={t.stack.label} />
          <StackTable />
        </div>
      </section>
    </>
  );
}
