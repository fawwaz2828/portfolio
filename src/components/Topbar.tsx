import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { contact } from "../data";
import { useLang, type Lang } from "../i18n";
import { Link, useRouter, type Route } from "../router";

/**
 * Navigation after christendijoux.com: brand on the left, numbered links on
 * both sides of a boxed monogram in the centre, and a two-way language
 * switch on the right. Below 1024px the links move into a full-screen menu.
 * Each link opens its own page (see App's page transition).
 */
const EASE = [0.16, 1, 0.3, 1] as const;

const panel: Variants = {
  closed: { clipPath: "circle(0px at calc(100% - 40px) 32px)" },
  open: { clipPath: "circle(150vmax at calc(100% - 40px) 32px)", transition: { duration: 0.8, ease: EASE } },
  exit: { clipPath: "circle(0px at calc(100% - 40px) 32px)", transition: { duration: 0.5, ease: [0.7, 0, 0.84, 0] } },
};
const item: Variants = {
  closed: { y: "110%" },
  open: (i: number) => ({ y: "0%", transition: { duration: 0.8, ease: EASE, delay: 0.25 + i * 0.07 } }),
  exit: { y: "110%", transition: { duration: 0.25 } },
};

const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
];

function NavLink({ no, to, label }: { no?: string; to: Route; label: string }) {
  return (
    <Link className="nav__link" to={to}>
      {no && <span className="nav__no">{no}</span>}
      <span>{label}</span>
      <span className="nav__underline" aria-hidden="true" />
    </Link>
  );
}

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const { t, lang, setLang } = useLang();
  const { navigate } = useRouter();

  const sections: { no: string; to: Route; label: string }[] = [
    { no: "01", to: "/about", label: t.nav.about },
    { no: "02", to: "/projects", label: t.nav.work },
  ];
  const menuLinks = [
    { label: t.nav.home, href: "/" },
    ...sections.map((s) => ({ label: s.label, href: s.to as string })),
    ...contact.socials,
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="topbar" data-tone="dark">
      <AnimatePresence>
        {open && (
          <motion.nav
            key="menu"
            id="site-menu"
            className="menu"
            variants={panel}
            initial="closed"
            animate="open"
            exit="exit"
            aria-label={t.nav.menu}
          >
            <ul className="menu__list">
              {menuLinks.map((l, i) => {
                const external = /^https?:|\.pdf$/.test(l.href);
                return (
                  <li key={l.href} className="menu__row">
                    <motion.a
                      className="menu__link"
                      href={l.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      custom={i}
                      variants={item}
                      onClick={(e) => {
                        setOpen(false);
                        if (l.href.startsWith("/") && !external) { e.preventDefault(); navigate(l.href as Route); }
                      }}
                    >
                      {l.label}
                    </motion.a>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      <header className="nav">
        <nav className="nav__bar" aria-label="Navigation">
          <Link to="/" className="nav__brand nav__link">
            {lang === "zh" ? t.name : <>Fawwaz<span className="nav__dot">.</span>Wibowo</>}
          </Link>

          <ul className="nav__links nav__links--left">
            {sections.slice(0, 1).map((s) => <li key={s.no}><NavLink {...s} /></li>)}
          </ul>

          <Link to="/" className="nav__mark" aria-label={`FW — ${t.nav.home}`}>
            {/* Trimmed, downsized copy of public/images/fw.png */}
            <img src="/images/fw-nav.png" alt="" width={240} height={144} />
          </Link>

          <ul className="nav__links nav__links--right">
            {sections.slice(1).map((s) => <li key={s.no}><NavLink {...s} /></li>)}
          </ul>

          <div className="nav__end">
            <button
              type="button"
              className="lang"
              aria-label={`EN / 中文 — ${t.nav.changeLang}`}
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
            >
              {LANGS.map((l) => (
                <span key={l.id} className={`lang__opt${l.id === lang ? " is-active" : ""}`}>{l.label}</span>
              ))}
            </button>
            <button
              type="button"
              className="nav__menu-btn"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? t.nav.close : t.nav.menu}
            </button>
          </div>
        </nav>
      </header>
    </div>
  );
}
