import { Fragment, useEffect, type ReactNode } from "react";
import { motion } from "motion/react";
import { useContent } from "../content";
import { useLang } from "../i18n";
import { toHref } from "../lib/url";
import { Link, slugOf, useRouter } from "../router";
import { useCover } from "../components/Work";
import type { Project } from "../data";
import PixelImage from "../components/motion/PixelImage";
import CrtBackground from "../components/motion/CrtBackground";

/**
 * /projects/<slug>: a project's own page, opened by its card ("View project").
 * Every project has one: title, role, description, stack, cover and a button
 * to the repo / live site. The optional case study written in /admin
 * ("Case study" field) adds sections below. Plain text with a bit of structure:
 *   ## Heading      a section title
 *   - item          a bullet (consecutive ones form a list)
 *   blank line      a new paragraph
 * Links written as https://… become clickable. An unknown slug sends the
 * visitor back to /projects.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

type Block = { kind: "h"; text: string } | { kind: "p"; text: string } | { kind: "ul"; items: string[] };

function parse(src: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) out.push({ kind: "p", text: para.join(" ") }); para = []; };
  for (const raw of src.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const h = line.match(/^#{1,3}\s+(.*)$/);
    const li = line.match(/^[-*•]\s+(.*)$/);
    if (h) { flush(); out.push({ kind: "h", text: h[1] }); }
    else if (li) {
      flush();
      const last = out[out.length - 1];
      if (last?.kind === "ul") last.items.push(li[1]); else out.push({ kind: "ul", items: [li[1]] });
    } else para.push(line);
  }
  flush();
  return out;
}

/** https:// links in running text become anchors. */
function linkify(text: string): ReactNode {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} className="cs__link" href={part.replace(/[.,;]+$/, "")} target="_blank" rel="noopener noreferrer">{part.replace(/^https?:\/\//, "").replace(/[.,;]+$/, "")}</a>
      : <Fragment key={i}>{part}</Fragment>,
  );
}

export default function CaseStudyPage({ slug }: { slug: string }) {
  const { projects, moreProjects, version } = useContent();
  const { t, lang } = useLang();
  const { navigate } = useRouter();
  // the bundled fallback still keeps a short "more" list; those get a page too
  const all: Project[] = [
    ...projects,
    ...moreProjects.map((m) => ({ name: m.name, desc: m.desc, descZh: m.descZh, tag: "", label: "", href: "", stack: [], scope: m.scope })),
  ];
  const index = all.findIndex((x) => slugOf(x.name) === slug);
  const p = all[index];
  const no = String(index + 1).padStart(2, "0");
  const cover = useCover(p ?? { name: "", desc: "", tag: "", label: "", href: "", stack: [], scope: "outside" }, no);
  const body = p ? ((lang === "zh" && p.caseStudyZh) || p.caseStudy || "") : "";

  // Unknown project: wait for the database content first (version > 0), since
  // a project added in /admin is not in the bundled copy
  useEffect(() => {
    if (version > 0 && !p) navigate("/projects", { replace: true });
  }, [version, p, navigate]);
  if (!p) return <section className="sec sec--dark cs" data-tone="dark" />;

  const zh = lang === "zh";
  const local = t.work.projects[p.name];
  const tag = (zh && p.tagZh) || local?.tag || p.tag;
  const desc = (zh && p.descZh) || local?.desc || p.desc;
  const href = toHref(p.href);
  const external = href.startsWith("http");
  const blocks = parse(body);

  return (
    <article className="sec sec--dark cs" data-tone="dark">
      <div className="cs__bg" aria-hidden="true"><CrtBackground image="/images/background2.jpg" /></div>
      <header className="cs__head">
        <div className="work__kicker label">
          <span className="work__kicker-bar" aria-hidden="true" />
          <Link to="/projects" className="cs__crumb">{t.work.all}</Link>
          <span aria-hidden="true">/</span>
          <span>{no}</span>
        </div>
        <motion.h1 className="cs__title" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }}>
          {p.name}
        </motion.h1>
        <motion.div className="cs__meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
          {tag && <span className="label">{tag}</span>}
          <p className="cs__lead">{desc}</p>
          <ul className="pcard__chips" aria-label={t.work.tech}>
            {p.stack.map((s) => <li key={s} className="chip">{s}</li>)}
          </ul>
          {href && (
            <div className="pcard__actions">
              <a className="btn-solid" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                {t.work.openProject} {external && "↗"}
              </a>
            </div>
          )}
        </motion.div>
      </header>

      {cover && (
        <motion.div className="cs__cover" initial={{ clipPath: "inset(100% 0 0 0)" }} animate={{ clipPath: "inset(0% 0 0 0)" }} transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}>
          <PixelImage src={cover} alt={`${t.work.preview} ${p.name}`} position="top" className="cs__img" />
        </motion.div>
      )}

      {blocks.length > 0 && (
        <div className="cs__body">
          {blocks.map((b, i) =>
            b.kind === "h" ? <h2 key={i} className="cs__h">{b.text}</h2>
            : b.kind === "ul" ? <ul key={i} className="cs__list">{b.items.map((it, j) => <li key={j}>{linkify(it)}</li>)}</ul>
            : <p key={i} className="cs__p">{linkify(b.text)}</p>,
          )}
        </div>
      )}

      <footer className="cs__foot">
        <Link to="/projects" className="btn-solid">← {t.work.all}</Link>
      </footer>
    </article>
  );
}
