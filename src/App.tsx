import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Topbar from "./components/Topbar";
import Hero from "./components/Hero";
import Work from "./components/Work";
import Contact from "./components/Contact";
import StackMarquee from "./components/StackMarquee";
import Footer from "./components/Footer";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import LoginPage from "./pages/LoginPage";
// the dashboard is only for the site owner: loaded on demand, not in every visitor's bundle
const AdminPage = lazy(() => import("./pages/AdminPage"));
import Cursor from "./components/motion/Cursor";
import PixelSky from "./components/motion/PixelSky";
import SkyBackdrop from "./components/motion/SkyBackdrop";
import GlitchGate, { type GateHandle } from "./components/motion/GlitchGate";
import { useAnimations } from "./useAnimations";
import { useLang } from "./i18n";
import { useContent } from "./content";
import { ADMIN_PATH, RouterContext, SECRET_PATH, normalize, type Route } from "./router";

/**
 * Page transition after andreas.vision (their numbers): the current page
 * shrinks to 0.8 (380ms, ease-in-out), the next one rises from below at 0.8
 * (460ms, ease-out) over a black backdrop with a faint red glitch, then grows back to full size
 * (420ms). Their site keeps both pages mounted; here the outgoing page is
 * frozen as a static copy so the new one can rise over it.
 */
const DEPTH = 0.8;

/** A new page always starts with the nav bar visible: the hide-on-scroll-down state
 *  of the previous page (e.g. a long, scrolled /admin) must not carry over. */
const showTopbar = () => document.querySelector(".topbar")?.classList.remove("hide");
const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

const PAGES: Record<Route, () => React.ReactNode> = {
  // Landing: a short version of everything; /about and /projects hold the full story
  "/": () => (
    <>
      <Hero />
      <StackMarquee />
      <Work preview />
      <Contact />
    </>
  ),
  "/about": () => <AboutPage />,
  "/projects": () => <ProjectsPage />,
  [SECRET_PATH]: () => <LoginPage />,
  [ADMIN_PATH]: () => <Suspense fallback={<section className="sec sec--dark adm" data-tone="dark" />}><AdminPage /></Suspense>,
};

/** Static copy of the outgoing page (ids removed; 2D canvases copied over). */
function freeze(card: HTMLElement) {
  const ghost = card.cloneNode(true) as HTMLElement;
  ghost.classList.add("page-ghost");
  ghost.setAttribute("aria-hidden", "true");
  ghost.inert = true;
  ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  const from = card.querySelectorAll("canvas"), to = ghost.querySelectorAll("canvas");
  from.forEach((c, i) => {
    try { to[i]?.getContext("2d")?.drawImage(c, 0, 0); } catch { /* WebGL / tainted: leave blank */ }
  });
  return ghost;
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const gateRef = useRef<GateHandle>(null);
  const [path, setPath] = useState<Route>(() => {
    const p = normalize(location.pathname);
    // Unknown addresses (e.g. the old /contact) fall back to the landing page
    if (p !== location.pathname) history.replaceState({}, "", p + location.hash);
    return p;
  });
  const pathRef = useRef(path);
  const [moving, setMoving] = useState(false);

  const { lang, t } = useLang();

  // Tab title per page; the sign-in and admin pages also ask search engines not to index them
  useEffect(() => {
    const titles: Partial<Record<Route, string>> = { "/about": t.nav.about, "/projects": t.nav.work };
    document.title = titles[path] ? `${titles[path]} — ${t.name}` : t.docTitle;
    const hidden = path === SECRET_PATH || path === ADMIN_PATH;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (hidden && !robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex, nofollow";
      document.head.append(robots);
    } else if (!hidden) robots?.remove();
  }, [path, t]);
  const { version } = useContent();
  // re-measure when the database content replaces the bundled copy
  const anim = useAnimations(root, lang, path, version);
  const animRef = useRef(anim);
  animRef.current = anim;

  const go = useCallback(async (to: Route, push = true, replace = false) => {
    if (to === pathRef.current) return;
    // redirect: no transition, and the old address leaves the history
    if (replace) {
      history.replaceState({}, "", to);
      animRef.current.context.revert();
      pathRef.current = to;
      flushSync(() => setPath(to));
      window.scrollTo(0, 0);
      requestAnimationFrame(() => { ScrollTrigger.refresh(); showTopbar(); });
      return;
    }
    if (busy.current) return;
    const card = cardRef.current!;
    if (push) history.pushState({}, "", to);
    const swap = () => {
      animRef.current.context.revert(); // unpin + unwrap before React unmounts the old page
      pathRef.current = to;
      flushSync(() => setPath(to));
      window.scrollTo(0, 0);
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { swap(); showTopbar(); return; }

    // Secret page: heavy glitch → static swallows this page → page swaps underneath → static breaks up
    if (to === SECRET_PATH && gateRef.current) {
      busy.current = true;
      try {
        await gateRef.current.close();
        swap();
        await gateRef.current.open();
      } finally {
        requestAnimationFrame(() => { ScrollTrigger.refresh(); showTopbar(); });
        busy.current = false;
      }
      return;
    }

    busy.current = true;
    flushSync(() => setMoving(true));
    card.classList.add("is-moving");

    // 1. current page shrinks into a card
    const shrink = card.animate([{ transform: "scale(1)" }, { transform: `scale(${DEPTH})` }], { duration: 380, easing: IN_OUT, fill: "forwards" });
    await shrink.finished;

    // 2. freeze it, swap in the next page, which rises from below over the copy
    const ghost = freeze(card);
    ghost.style.transform = `scale(${DEPTH})`;
    card.before(ghost);
    swap();
    const rise = card.animate(
      [{ transform: `translateY(100%) scale(${DEPTH})` }, { transform: `translateY(0) scale(${DEPTH})` }],
      { duration: 460, easing: OUT, fill: "forwards" },
    );
    shrink.cancel();
    await rise.finished;
    ghost.remove();

    // 3. grow back to full size
    const grow = card.animate([{ transform: `scale(${DEPTH})` }, { transform: "scale(1)" }], { duration: 420, easing: IN_OUT, fill: "forwards" });
    rise.cancel();
    await grow.finished;
    grow.cancel();
    card.classList.remove("is-moving");
    setMoving(false);
    // The new page's ScrollTriggers were measured while the card was scaled
    // and fixed mid-transition; re-measure now that it is back to normal,
    // otherwise pins (hero → About stage) end up offset with gaps between sections
    requestAnimationFrame(() => { ScrollTrigger.refresh(); showTopbar(); });
    busy.current = false;
  }, []);

  // Back / forward buttons
  useEffect(() => {
    const onPop = () => go(normalize(location.pathname), false);
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, [go]);

  const router = useMemo(() => ({ path, navigate: (to: Route, opts?: { replace?: boolean }) => go(to, true, !!opts?.replace) }), [path, go]);

  return (
    <RouterContext.Provider value={router}>
      <div ref={root}>
        {/* One fixed background behind every page; outside the ScrollSmoother
            content, whose transform would break position: fixed */}
        <PixelSky />
        {moving && <SkyBackdrop />}
        <div ref={cardRef} className="page-card">
          <Topbar />
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <main id="top" data-page={path}>{PAGES[path]()}</main>
              <Footer />
            </div>
          </div>
        </div>
        <GlitchGate ref={gateRef} target={cardRef} />
        <Cursor />
      </div>
    </RouterContext.Provider>
  );
}
