import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useLang } from "../i18n";

/**
 * Slim footer: one row of small print (location, back to top).
 */
export default function Footer() {
  const { t } = useLang();
  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(0, true);
    else scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer" data-tone="dark">
      <div className="footer__row label">
        <span>{t.footer.based}</span>
        <a href="#top" className="footer__top" onClick={toTop}>{t.footer.top} ↑</a>
      </div>
    </footer>
  );
}
