import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import ProximityText from "../components/motion/ProximityText";
import CrtBackground from "../components/motion/CrtBackground";
import { useLang } from "../i18n";
import { Link, useRouter, ADMIN_PATH } from "../router";
import { supabase } from "../lib/supabase";
import { checkAdmin } from "../lib/auth";

/**
 * Secret sign-in page (SECRET_PATH in router.tsx), reached by tapping "FW" in Morse on the hero sword.
 * Signs in with Supabase (email + password); admins go on to ADMIN_PATH.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export default function LoginPage() {
  const { t, lang } = useLang();
  const l = t.login;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { navigate } = useRouter();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) { setMsg(l.pending); return; }
    const fd = new FormData(e.currentTarget);
    setBusy(true); setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    });
    if (error || !data.user) { setBusy(false); setMsg("Wrong email or password."); return; }
    if (!(await checkAdmin(data.user.id))) {
      await supabase.auth.signOut();
      setBusy(false); setMsg("This account has no admin access.");
      return;
    }
    setBusy(false);
    navigate(ADMIN_PATH);
  };

  return (
    <section className="sec sec--dark lg" data-tone="dark">
      {/* Same CRT/glitch photo backdrop as the homepage hero, on the red gothic hall.
          The photo is dark already, so less gamma than the default */}
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
          <button type="submit" className="btn-solid" disabled={busy}>{busy ? "…" : `${l.submit} →`}</button>
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
