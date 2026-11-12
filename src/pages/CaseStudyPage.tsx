import { Fragment, useEffect, type MouseEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useContent } from "../content";
import { useLang } from "../i18n";
import { toHref } from "../lib/url";
import { Link, slugOf, useRouter, type Route } from "../router";
import { useCover } from "../components/Work";
import type { Project } from "../data";
import CrtBackground from "../components/motion/CrtBackground";

/**
 * /projects/<slug>: a project's own page, opened by its card ("View project").
 *
 *   breadcrumb · big title
 *   fact row: role · year · type · made for
 *   lead + "Open project ↗"
 *   cover
 *   [aside: stack, contents]   [numbered sections from the write-up]
 *   next project
 *
 * The write-up is the project's "Case study" field in /admin, plain text with
 * a bit of structure:
 *   ## Heading      starts a numbered section
 *   - item          a bullet; a section's bullets are laid out as cards
 *   blank line      a new paragraph
 * Links written as https://… become clickable. Without a write-up the page
 * still shows the facts, the description and the cover. An unknown slug
 * sends the visitor back to /projects.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] };
type Section = { title: string; blocks: Block[] };

function parse(src: string): Section[] {
  const sections: Section[] = [{ title: "", blocks: [] }];
  let para: string[] = [];
  const cur = () => sections[sections.length - 1];
  const flush = () => { if (para.length) cur().blocks.push({ kind: "p", text: para.join(" ") }); para = []; };
  for (const raw of src.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const h = line.match(/^#{1,3}\s+(.*)$/);
    const li = line.match(/^[-*•]\s+(.*)$/);
    if (h) { flush(); sections.push({ title: h[1], blocks: [] }); }
    else if (li) {
      flush();
      const last = cur().blocks[cur().blocks.length - 1];
      if (last?.kind === "ul") last.items.push(li[1]); else cur().blocks.push({ kind: "ul", items: [li[1]] });
    } else para.push(line);
  }
  flush();
  return sections.filter((s) => s.title || s.blocks.length);
}

/** https:// links in running text become anchors. */
function linkify(text: string): ReactNode {
  return text.split(/(https?:\/\/[^\s)]+)/g).map((part, i) => {
    if (!/^https?:\/\//.test(part)) return <Fragment key={i}>{part}</Fragment>;
    const url = part.replace(/[.,;。，]+$/, "");
    return (
      <Fragment key={i}>
        <a className="cs__link" href={url} target="_blank" rel="noopener noreferrer">{url.replace(/^https?:\/\//, "")}</a>
        {part.slice(url.length)}
      </Fragment>
    );
  });
}

const sectionId = (i: number) => `cs-sec-${i + 1}`;

/** In-page jump that also works under ScrollSmoother (which ignores #hash links). */
function jump(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(el, true, "top 130px"); // clear of the fixed top bar
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Unknown project: wait for the database content first (version > 0), since
  // a project added in /admin is not in the bundled copy
  useEffect(() => {
    if (version > 0 && !p) navigate("/projects", { replace: true });
  }, [version, p, navigate]);
  if (!p) return <section className="sec sec--dark cs" data-tone="dark" />;

  const zh = lang === "zh";
  const c = t.caseStudy;
  const local = t.work.projects[p.name];
  const tag = (zh && p.tagZh) || local?.tag || p.tag;
  const [role, year] = tag ? tag.split(" · ") : ["", ""];
  const desc = (zh && p.descZh) || local?.desc || p.desc;
  const body = (zh && p.caseStudyZh) || p.caseStudy || "";
  const sections = parse(body);
  const titled = sections.filter((s) => s.title);
  const href = toHref(p.href);
  const external = href.startsWith("http");
  const next = all[(index + 1) % all.length];

  const facts: [string, string][] = [
    [c.role, role],
    [c.year, year ?? ""],
    [c.type, p.label],
    [c.madeFor, p.scope === "campus" ? t.projectsPage.campus : t.projectsPage.outside],
  ].filter(([, v]) => v) as [string, string][];

  const open = href && (
    <a className="btn-solid" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {t.work.openProject} {external && "↗"}
    </a>
  );

  let n = 0; // running number for titled sections

  return (
    <article className="sec sec--dark cs" data-tone="dark">
      <div className="cs__bg" aria-hidden="true"><CrtBackground image="/images/background2.jpg" /></div>

      {/* ── Hero ── */}
      <header className="cs__head">
        <div className="work__kicker label">
          <span className="work__kicker-bar" aria-hidden="true" />
          <Link to="/projects" className="cs__crumb">{t.work.all}</Link>
          <span aria-hidden="true">/</span>
          <span className="pcard__no">{no}</span>
          <span aria-hidden="true">/</span>
          <span>{String(all.length).padStart(2, "0")}</span>
        </div>
        <motion.h1 className="cs__title" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }}>
          {p.name}
        </motion.h1>
        {facts.length > 0 && (
          <motion.dl className="cs__facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.45 }}>
            {facts.map(([k, v]) => (
              <div key={k} className="cs__fact">
                <dt className="label">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </motion.dl>
        )}
        <motion.div className="cs__intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}>
          <p className="cs__lead">{desc}</p>
          {open && <div className="cs__cta">{open}</div>}
        </motion.div>
      </header>

      {cover && (
        <motion.div className="cs__cover" initial={{ clipPath: "inset(100% 0 0 0)" }} animate={{ clipPath: "inset(0% 0 0 0)" }} transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}>
          <img src={cover} alt={`${t.work.preview} ${p.name}`} className="cs__img" decoding="async" />
        </motion.div>
      )}

      {/* ── Body: aside (stack, contents) + numbered sections ── */}
      <div className={`cs__layout${sections.length ? "" : " cs__layout--short"}`}>
        <aside className="cs__aside">
          {p.stack.length > 0 && (
            <div className="cs__panel">
              <p className="label cs__panel-title">{c.stack}</p>
              <ul className="pcard__chips" aria-label={t.work.tech}>
                {p.stack.map((s) => <li key={s} className="chip">{s}</li>)}
              </ul>
            </div>
          )}
          {titled.length > 1 && (
            <nav className="cs__panel" aria-label={c.contents}>
              <p className="label cs__panel-title">{c.contents}</p>
              <ol className="cs__toc">
                {titled.map((s, i) => (
                  <li key={i}>
                    <a href={`#${sectionId(i)}`} onClick={(e) => jump(e, sectionId(i))}>
                      <span className="cs__toc-no">{String(i + 1).padStart(2, "0")}</span>{s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {open && <div className="cs__panel cs__panel--cta">{open}</div>}
        </aside>

        <div className="cs__body">
          {sections.length === 0 && <p className="cs__p cs__empty">{c.empty}</p>}
          {sections.map((s, si) => {
            const num = s.title ? ++n : 0;
            return (
              <motion.section
                key={si}
                id={s.title ? sectionId(num - 1) : undefined}
                className="cs__sec"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                {s.title && (
                  <h2 className="cs__h">
                    <span className="cs__h-no">{String(num).padStart(2, "0")}</span>
                    {s.title}
                  </h2>
                )}
                {s.blocks.map((b, i) =>
                  b.kind === "ul"
                    ? <ul key={i} className={`cs__list${b.items.length >= 3 ? " cs__list--cards" : ""}`}>{b.items.map((it, j) => <li key={j}>{linkify(it)}</li>)}</ul>
                    : <p key={i} className="cs__p">{linkify(b.text)}</p>,
                )}
              </motion.section>
            );
          })}
        </div>
      </div>

      {/* ── Next project ── */}
      <footer className="cs__foot">
        {next && next !== p && (
          <Link to={`/projects/${slugOf(next.name)}` as Route} className="cs__next" data-cursor-label={t.work.view}>
            <span className="label">{c.next} →</span>
            <span className="cs__next-name">{next.name}</span>
          </Link>
        )}
        <Link to="/projects" className="cs__back label">← {t.work.all}</Link>
      </footer>
    </article>
  );
}
