import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import CrtBackground from "../components/motion/CrtBackground";
import ProximityText from "../components/motion/ProximityText";
import { useLang } from "../i18n";
import { Link } from "../router";

/**
 * Secret /login page, reached by tapping "FW" in Morse on the hero sword.
 * UI only for now: the site has no backend, so submitting just says so.
 * Wire `onSubmit` to a real auth provider when one is chosen.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export default function LoginPage() {
  const { t, lang } = useLang();
  const l = t.login;
  const [msg, setMsg] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMsg(l.pending);
  };

  return (
    <section className="sec sec--dark lg" data-tone="dark">
      {/* The dungeon photo is dark already, so less gamma than the other backgrounds */}
      <CrtBackground image="/images/secret.jpg" tone={0.75} />
      <motion.div
        className="lg__panel"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 0.7 }}
      >
        <p className="label lg__kicker"><span className="lg__dot" aria-hidden="true" />{l.kicker}</p>
        <h1 className="lg__title" aria-label={l.title}>
          <span aria-hidden="true">
            <ProximityText key={lang} text={l.title} min={250} max={800} radius={260} intro={{ delay: 0.85 }} />
          </span>
        </h1>
        <p className="lg__lead">{l.lead}</p>

        <form className="lg__form" onSubmit={onSubmit}>
          <label className="lg__field">
            <span className="label">{l.email}</span>
            <input type="email" name="email" autoComplete="username" required />
          </label>
          <label className="lg__field">
            <span className="label">{l.password}</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn-solid" data-cursor-plain>{l.submit} →</button>
          {msg && <p className="lg__msg" role="status">{msg}</p>}
        </form>

        <div className="lg__foot label">
          <Link to="/" className="lg__back">← {l.back}</Link>
          <span className="lg__morse" aria-hidden="true">··−· ·−−</span>
        </div>
      </motion.div>
    </section>
  );
}
