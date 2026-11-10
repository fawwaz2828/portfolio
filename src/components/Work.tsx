import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { projects, type Project } from "../data";
import PixelImage from "./motion/PixelImage";
import ProximityText from "./motion/ProximityText";
import CrtBackground from "./motion/CrtBackground";
import { useLang } from "../i18n";
import { Link } from "../router";

/**
 * Selected projects, after christendijoux.com: an intro panel followed by
 * full-height project columns separated by hairlines, scrolled sideways by
 * the pinned track in useAnimations §5. Each column has a "01 / 07" label row,
 * a de-pixelating halftone preview (original opens in a circle on hover),
 * then title | description, tech chips and buttons.
 */

const TOTAL = String(projects.length).padStart(2, "0");
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
    g.font = `600 ${size}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
    size -= 10;
  } while (g.measureText(name).width > c.width * 0.62 && size > 80);
  // Centred: the preview is cover-cropped and drifts sideways, so keep clear of the edges
  g.textAlign = "center";
  g.fillText(name, c.width / 2, c.height / 2 + size * 0.32);
  return c.toDataURL("image/jpeg", 0.9);
}

function useCover(p: Project, no: string) {
  const [src, setSrc] = useState(p.image ?? "");
  useEffect(() => {
    if (p.image) return;
    let live = true;
    makeCover(p, no).then((url) => live && setSrc(url));
    return () => { live = false; };
  }, [p, no]);
  return src;
}

export function ProjectCard({ p, index, total = TOTAL }: { p: Project; index: number; total?: string }) {
  const no = pad(index + 1);
  const cover = useCover(p, no);
  const { t } = useLang();
  const local = t.work.projects[p.name];
  const [role, year] = (local?.tag ?? p.tag).split(" · ");
  const desc = local?.desc ?? p.desc;
  const external = p.href.startsWith("http");

  return (
    <article className="pcard">
      <div className="pcard__label label">
        <span><span className="pcard__no">{no}</span> / {total}</span>
        <span>{role}{year ? ` · ${year}` : ""}</span>
      </div>

      <a
        className="pcard__media"
        href={p.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        data-cursor-label={t.work.view}
        aria-label={`${t.work.view} ${p.name}`}
      >
        {/* Wider than the frame so the sideways parallax never shows an edge */}
        <div className="pcard__parallax" data-parallax>
          {cover && <PixelImage src={cover} alt={`${t.work.preview} ${p.name}`} position="top" className="pcard__img" />}
        </div>
      </a>

      <div className="pcard__body">
        <h3 className="pcard__title">{p.name}</h3>
        <div>
          <p className="pcard__desc">{desc}</p>
          <ul className="pcard__chips" aria-label={t.work.tech}>
            {p.stack.map((t) => <li key={t} className="chip">{t}</li>)}
          </ul>
          <div className="pcard__actions">
            <a className="btn-solid" href={p.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
              {t.work.viewProject}
            </a>
          </div>
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
    <h2 ref={ref} className="work__title" aria-label={text}>
      <span aria-hidden="true">
        <ProximityText text={text} min={250} max={800} radius={300} intro={{ delay: 0.05, stagger: 0.03 }} play={inView} scramble />
      </span>
    </h2>
  );
}

/** Landing page shows this many; the rest live on /projects. */
const PREVIEW = 3;

export default function Work({ preview = false }: { preview?: boolean }) {
  const { t, lang } = useLang();
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
