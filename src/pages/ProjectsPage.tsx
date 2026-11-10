import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { moreProjects, projects, type Scope } from "../data";
import { ProjectCard } from "../components/Work";
import CrtBackground from "../components/motion/CrtBackground";
import ProximityText from "../components/motion/ProximityText";
import { useLang } from "../i18n";

/**
 * /projects — plain vertical scroll (the landing page keeps the sideways
 * track), split into campus coursework and work outside campus. Each group:
 * big cards for featured projects, then a compact list of the smaller ones.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

function Title({ text, className, as: Tag = "h2", delay = 0.05 }: { text: string; className: string; as?: "h1" | "h2"; delay?: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">
        <ProximityText text={text} min={250} max={800} radius={300} intro={{ delay, stagger: 0.03 }} play={seen} />
      </span>
    </Tag>
  );
}

function Group({ scope, no }: { scope: Scope; no: string }) {
  const { t, lang } = useLang();
  const p = t.projectsPage;
  const list = projects.filter((x) => x.scope === scope);
  const more = moreProjects.filter((x) => x.scope === scope);
  const title = scope === "campus" ? p.campus : p.outside;

  return (
    <section className="sec sec--dark pj-group" data-tone="dark" id={scope}>
      <div className="pj-group__head">
        <div className="pj-group__title-row">
          <span className="label pj-group__no">[ {no} ]</span>
          <Title key={lang} text={title} className="pj-group__title" />
        </div>
        <p className="pj-group__desc">
          <span className="label">{pad(list.length + more.length)} {p.count}</span>
          {scope === "campus" ? p.campusDesc : p.outsideDesc}
        </p>
      </div>

      <div className="pj-grid">
        {list.map((proj, i) => (
          <motion.div
            key={proj.name}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 1, ease: EASE, delay: (i % 2) * 0.1 }}
          >
            <ProjectCard p={proj} index={i} total={pad(list.length)} />
          </motion.div>
        ))}
      </div>

      {more.length > 0 && (
        <div className="pj-more">
          <p className="label pj-more__label">{p.more}</p>
          <ul>
            {more.map((m, i) => (
              <motion.li
                key={m.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 0.8, ease: EASE, delay: i * 0.06 }}
              >
                <span className="pj-more__name">{m.name}</span>
                <span className="pj-more__desc">{m.desc}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function ProjectsPage() {
  const { t, lang } = useLang();
  const p = t.projectsPage;
  const count = (s: Scope) => projects.filter((x) => x.scope === s).length + moreProjects.filter((x) => x.scope === s).length;

  return (
    <>
      <section className="sec sec--dark pj-hero" data-tone="dark">
        <CrtBackground image="/images/background2.jpg" />
        <div className="pj-hero__inner">
          <div>
            <div className="work__kicker label">
              <span className="work__kicker-bar" aria-hidden="true" />
              <span>[ 02 ] · {p.kicker}</span>
            </div>
            <Title key={lang} as="h1" text={t.work.title} className="work__title" delay={0.75} />
          </div>
          <div>
            <p className="pj-hero__lead">{p.lead}</p>
            <div className="pj-hero__counts label">
              <span><b>{pad(count("campus"))}</b>{p.campus}</span>
              <span><b>{pad(count("outside"))}</b>{p.outside}</span>
            </div>
          </div>
        </div>
      </section>
      <Group scope="campus" no="A" />
      <Group scope="outside" no="B" />
    </>
  );
}
