import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import type { Project } from "../data";
import { useContent } from "../content";
import PixelImage from "./motion/PixelImage";
import ProximityText from "./motion/ProximityText";
import CrtBackground from "./motion/CrtBackground";
import CrestShield from "./motion/CrestShield";
import { useLang } from "../i18n";
import { toHref } from "../lib/url";
import { Link, slugOf, type Route } from "../router";

/**
 * Selected projects, after christendijoux.com: an intro panel followed by
 * full-height project columns separated by hairlines, scrolled sideways by
 * the pinned track in useAnimations §5. Each column has a "01 / 07" label row,
 * a de-pixelating halftone preview (original opens in a circle on hover),
 * then title | description, tech chips and buttons.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Placeholder cover for projects without a screenshot: big name on a dark field. */
async function makeCover(p: Project, no: string) {
  await document.fonts?.ready;
  const c = document.createElement("canvas");
  c.width = 1600; c.height = 1100;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(400, 250, 0, 400, 250, 1300);
  grad.addColorStop(0, "#3a1414");
  grad.addColorStop(1, "#0b0b0b");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#ef4444";
  g.font = '700 44px "Space Mono", monospace';
  g.fillText(`(${no})`, 260, 150);
  g.fillStyle = "#9a9a9a";
  g.fillText(p.label.toUpperCase(), 260, c.height - 110);
  g.fillStyle = "#f2f2ee";
  let size = 330;
  const name = p.name.toUpperCase();
  do {
    g.font = `600 ${size}px "Big Shoulders Display Variable", "Arial Narrow", sans-serif`;
    size -= 10;
  } while (g.measureText(name).width > c.width * 0.62 && size > 80);
  // Centred: the preview is cover-cropped and drifts sideways, so keep clear of the edges
  g.textAlign = "center";
  g.fillText(name, c.width / 2, c.height / 2 + size * 0.32);
  return c.toDataURL("image/jpeg", 0.9);
}

export function useCover(p: Project, no: string) {
  const [src, setSrc] = useState(p.image ?? "");
  useEffect(() => {
    // the database copy can arrive after mount with an uploaded image the
    // bundled copy did not have: follow it instead of keeping the first value
    if (p.image) { setSrc(p.image); return; }
    let live = true;
    makeCover(p, no).then((url) => live && setSrc(url));
    return () => { live = false; };
  }, [p, no]);
  return src;
}

export function ProjectCard({ p, index, total }: { p: Project; index: number; total?: string }) {
  const { projects } = useContent();
  total ??= String(projects.length).padStart(2, "0");
  const no = pad(index + 1);
  const cover = useCover(p, no);
  const { t, lang } = useLang();
  // 中文: the text saved with the project in /admin wins, then the built-in
  // translations in i18n.tsx, then English so a card is never empty
  const local = t.work.projects[p.name];
  const zh = lang === "zh";
  const [role, year] = ((zh && p.tagZh) || local?.tag || p.tag).split(" · ");
  const desc = (zh && p.descZh) || local?.desc || p.desc;
  const href = toHref(p.href);
  const external = href.startsWith("http");
  // With a case study the card opens it; the live project stays one click away on that page
  const caseTo = p.caseStudy ? (`/projects/${slugOf(p.name)}` as Route) : null;
  // Wider than the frame so the sideways parallax never shows an edge
  const media = (
    <div className="pcard__parallax" data-parallax>
      {cover && <PixelImage src={cover} alt={`${t.work.preview} ${p.name}`} position="top" className="pcard__img" />}
    </div>
  );

  return (
    <article className="pcard">
      <div className="pcard__label label">
        <span><span className="pcard__no">{no}</span> / {total}</span>
        <span>{role}{year ? ` · ${year}` : ""}</span>
      </div>

      {/* Projects without a link (e.g. ones turned into cards from the old "more" list) get a plain frame */}
      {caseTo ? (
        <Link to={caseTo} className="pcard__media" data-cursor-label={t.work.read} aria-label={`${t.work.caseStudy}: ${p.name}`}>
          {media}
        </Link>
      ) : href ? (
        <a
          className="pcard__media"
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          data-cursor-label={t.work.view}
          aria-label={`${t.work.view} ${p.name}`}
        >
          {media}
        </a>
      ) : (
        <div className="pcard__media">{media}</div>
      )}

      <div className="pcard__body">
        <h3 className="pcard__title">{p.name}</h3>
        <div>
          <p className="pcard__desc">{desc}</p>
          <ul className="pcard__chips" aria-label={t.work.tech}>
            {p.stack.map((t) => <li key={t} className="chip">{t}</li>)}
          </ul>
          {(href || caseTo) && (
            <div className="pcard__actions">
              {caseTo && <Link to={caseTo} className="btn-solid">{t.work.caseStudy}</Link>}
              {href && <a className={caseTo ? "btn-ghost" : "btn-solid"} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                {t.work.viewProject}
              </a>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** Heading set like the hero headline: letters rise in on view, weight follows the pointer. */
function RiseTitle({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  return (
    <>
      <h2 ref={ref} className="work__title" aria-label={text}>
        <span aria-hidden="true">
          <ProximityText text={text} min={250} max={800} radius={300} intro={{ delay: 0.05, stagger: 0.03 }} play={inView} scramble />
        </span>
      </h2>
      <CrestShield play={inView} delay={0.4} />
    </>
  );
}

/** Landing page shows this many; the rest live on /projects. */
const PREVIEW = 3;

export default function Work({ preview = false }: { preview?: boolean }) {
  const { t, lang } = useLang();
  const { projects } = useContent();
  const list = preview ? projects.slice(0, PREVIEW) : projects;
  return (
    <section className="sec sec--dark work" id="work" data-tone="dark">
      {/* Same CRT / thermal background as the hero; stays put while the track slides over it */}
      <CrtBackground image="/images/background2.jpg" />
      <div className="work__track">
        <div className="work__intro">
          <div>
            <div className="work__kicker label">
              <span className="work__kicker-bar" aria-hidden="true" />
              <span aria-hidden="true">[ <span className="pcard__no">02</span> / 03 ]</span>
              <span aria-hidden="true">·</span>
              <span>{t.work.kicker}</span>
            </div>
            <RiseTitle key={lang} text={t.work.title} />
          </div>
          <div className="work__foot">
            <p className="work__lead">
              {t.work.lead}
            </p>
            <p className="label work__hint">{t.work.hint} →</p>
          </div>
        </div>

        {list.map((p, i) => <ProjectCard key={p.name} p={p} index={i} />)}

        {preview && (
          <div className="pcard pcard--more">
            <Link to="/projects" className="pcard__more" data-cursor-label={t.work.view}>
              <span className="label">{pad(projects.length)} {t.work.kicker}</span>
              <span className="pcard__more-title">{t.work.all} <span aria-hidden="true">→</span></span>
            </Link>
          </div>
        )}
      </div>
      <span className="work__progress" aria-hidden="true" />
    </section>
  );
}
