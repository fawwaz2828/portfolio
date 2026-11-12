import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useContent } from "../content";
import { Link, useRouter } from "../router";
import { toChinese } from "../lib/translate";
import { toHref } from "../lib/url";

/**
 * Content dashboard (Supabase CRUD) at ADMIN_PATH. Reached after signing in on
 * the secret sign-in page (SECRET_PATH). Without an admin session the page
 * shows nothing and sends the visitor to the home page; RLS on the database
 * is what actually protects writes.
 *
 * Each tab is a table described by `TABS`: which columns to show in the list
 * and which fields the editor has. Saving or deleting reloads the list and the
 * live site content.
 */
type FieldType = "text" | "textarea" | "number" | "tags" | "select" | "checkbox" | "image";
type Field = { key: string; label: string; type: FieldType; options?: [string, string][]; hint?: string; required?: boolean; wide?: boolean };
type Row = Record<string, unknown> & { id: string };
type Tab = {
  id: string; label: string; table: string;
  filter?: [string, string];                // e.g. ["kind", "experience"]
  fields: Field[];
  /** [English field, 中文 field] pairs: empty 中文 fields are machine-translated on save */
  translate?: [string, string][];
  defaults: Record<string, unknown>;
  title: (r: Row) => string;
  meta: (r: Row) => string;
};

const ZH_HINT = "Filled in automatically on save, and again whenever the English text changes";
const TIMELINE_ZH: [string, string][] = [["title", "title_zh"], ["date_label", "date_label_zh"], ["place", "place_zh"]];

const TABS: Tab[] = [
  {
    id: "projects", label: "Projects", table: "projects",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "tag", label: "Tag", type: "text", hint: "e.g. Frontend Lead · 2026" },
      { key: "label", label: "Label", type: "text", hint: "e.g. Civic-tech" },
      { key: "href", label: "Link", type: "text", hint: "https://…" },
      { key: "description", label: "Description", type: "textarea", required: true, wide: true },
      { key: "tag_zh", label: "Tag (中文)", type: "text", hint: "Filled in automatically on save" },
      { key: "description_zh", label: "Description (中文)", type: "textarea", wide: true, hint: "Filled in automatically on save, and again whenever the English text changes. Edit it here to correct the machine translation." },
      { key: "stack", label: "Tech stack", type: "tags", hint: "Comma separated: React, Supabase" },
      { key: "scope", label: "Made for", type: "select", options: [["campus", "Campus"], ["outside", "Outside campus"]] },
      { key: "featured", label: "Show as a big card (off = small \"Also built\" list)", type: "checkbox", wide: true },
      { key: "image", label: "Screenshot", type: "image", wide: true },
      { key: "sort_order", label: "Order", type: "number", hint: "Lower shows first" },
    ],
    translate: [["tag", "tag_zh"], ["description", "description_zh"]],
    defaults: { name: "", description: "", description_zh: "", tag: "", tag_zh: "", label: "", href: "", stack: [], image: null, scope: "outside", featured: true, sort_order: 0 },
    title: (r) => String(r.name),
    meta: (r) => [r.featured ? "Card" : "Also built", r.scope === "campus" ? "Campus" : "Outside", r.tag].filter(Boolean).join(" · "),
  },
  {
    id: "experience", label: "Experience", table: "timeline", filter: ["kind", "experience"],
    fields: [
      { key: "title", label: "Role", type: "text", required: true },
      { key: "date_label", label: "Dates", type: "text", required: true, hint: "e.g. 2025 — 2026" },
      { key: "place", label: "Organisation / details", type: "text", wide: true },
      { key: "title_zh", label: "Role (中文)", type: "text", hint: ZH_HINT },
      { key: "date_label_zh", label: "Dates (中文)", type: "text", hint: ZH_HINT },
      { key: "place_zh", label: "Organisation / details (中文)", type: "text", wide: true, hint: ZH_HINT },
      { key: "sort_order", label: "Order", type: "number", hint: "Lower shows first" },
    ],
    translate: TIMELINE_ZH,
    defaults: { kind: "experience", title: "", date_label: "", place: "", title_zh: "", date_label_zh: "", place_zh: "", sort_order: 0 },
    title: (r) => String(r.title),
    meta: (r) => `${r.date_label} · ${r.place}`,
  },
  {
    id: "education", label: "Education", table: "timeline", filter: ["kind", "education"],
    fields: [
      { key: "title", label: "School", type: "text", required: true },
      { key: "date_label", label: "Dates", type: "text", required: true, hint: "e.g. 2023 — 2025" },
      { key: "place", label: "Degree / details", type: "text", wide: true },
      { key: "title_zh", label: "School (中文)", type: "text", hint: ZH_HINT },
      { key: "date_label_zh", label: "Dates (中文)", type: "text", hint: ZH_HINT },
      { key: "place_zh", label: "Degree / details (中文)", type: "text", wide: true, hint: ZH_HINT },
      { key: "sort_order", label: "Order", type: "number", hint: "Lower shows first" },
    ],
    translate: TIMELINE_ZH,
    defaults: { kind: "education", title: "", date_label: "", place: "", title_zh: "", date_label_zh: "", place_zh: "", sort_order: 0 },
    title: (r) => String(r.title),
    meta: (r) => `${r.date_label} · ${r.place}`,
  },
  {
    id: "skills", label: "Skills", table: "skills",
    fields: [
      { key: "group_name", label: "Group", type: "text", required: true, hint: "e.g. Frontend" },
      { key: "items", label: "Skills", type: "tags", wide: true, hint: "Comma separated: React, Next.js, TypeScript" },
      { key: "group_name_zh", label: "Group (中文)", type: "text", hint: ZH_HINT },
      { key: "sort_order", label: "Order", type: "number", hint: "Lower shows first" },
    ],
    translate: [["group_name", "group_name_zh"]],
    defaults: { group_name: "", items: [], group_name_zh: "", sort_order: 0 },
    title: (r) => String(r.group_name),
    meta: (r) => ((r.items as string[]) ?? []).join(", "),
  },
  {
    id: "faq", label: "FAQ", table: "faq",
    fields: [
      { key: "question", label: "Question", type: "text", required: true, wide: true },
      { key: "answer", label: "Answer", type: "textarea", required: true, wide: true },
      { key: "question_zh", label: "Question (中文)", type: "text", wide: true, hint: ZH_HINT },
      { key: "answer_zh", label: "Answer (中文)", type: "textarea", wide: true, hint: ZH_HINT },
      { key: "sort_order", label: "Order", type: "number", hint: "Lower shows first" },
    ],
    translate: [["question", "question_zh"], ["answer", "answer_zh"]],
    defaults: { question: "", answer: "", question_zh: "", answer_zh: "", sort_order: 0 },
    title: (r) => String(r.question),
    meta: (r) => String(r.answer),
  },
];

/** Upload to the public "portfolio" bucket, return its public URL. */
async function uploadImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `projects/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from("portfolio").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase!.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
}

function Editor({ tab, row, onClose, onSaved }: { tab: Tab; row: Row | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState<Record<string, unknown>>(() => ({ ...tab.defaults, ...(row ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  /**
   * 中文 fields follow the English ones without any button: on save a 中文 field
   * is translated when it is empty, or when the English text was changed and
   * the 中文 text was left as it was (so it would now be out of date). 中文 text
   * typed or corrected by hand in this edit is kept.
   */
  const translate = async () => {
    const out: Record<string, string> = {};
    const text = (o: Record<string, unknown> | null, k: string) => String(o?.[k] ?? "").trim();
    for (const [from, to] of tab.translate ?? []) {
      const src = text(form, from);
      if (!src) continue;
      const stale = !!row && src !== text(row, from) && text(form, to) === text(row, to);
      if (text(form, to) && !stale) continue;
      out[to] = await toChinese(src);
    }
    if (Object.keys(out).length) setForm((f) => ({ ...f, ...out }));
    return out;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    // If the translation service is down the row is still saved; the site
    // shows English there until the next successful save.
    let auto: Record<string, string> = {};
    let note = "";
    try { auto = await translate(); } catch { note = " (中文 not translated: service unavailable)"; }
    const payload: Record<string, unknown> = {};
    for (const f of tab.fields) payload[f.key] = auto[f.key] ?? form[f.key];
    if (typeof payload.href === "string") payload.href = toHref(payload.href);
    if (tab.filter) payload[tab.filter[0]] = tab.filter[1];
    const q = row
      ? supabase!.from(tab.table).update(payload).eq("id", row.id)
      : supabase!.from(tab.table).insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) {
      setErr(/_zh\b/.test(error.message) ? `${error.message} — run supabase/add-zh.sql in the Supabase SQL Editor first.` : error.message);
      return;
    }
    onSaved((row ? "Saved" : "Added") + note);
  };

  const onFile = async (key: string, file: File | undefined) => {
    if (!file) return;
    setBusy(true); setErr("");
    try { set(key, await uploadImage(file)); } catch (e) { setErr(`Upload failed: ${(e as Error).message}`); }
    setBusy(false);
  };

  return (
    <form className="adm-editor" onSubmit={save}>
      <div className="adm-editor__head">
        <span className="label">{row ? "Edit" : "New"} · {tab.label}</span>
        <button type="button" className="adm-x" onClick={onClose} aria-label="Close editor">✕</button>
      </div>
      <div className="adm-fields">
        {tab.fields.map((f) => {
          const v = form[f.key];
          return (
            <label key={f.key} className={`adm-field${f.wide || f.type === "textarea" ? " adm-field--wide" : ""}${f.type === "checkbox" ? " adm-field--check" : ""}`}>
              {f.type !== "checkbox" && <span className="adm-field__label">{f.label}{f.required && " *"}</span>}
              {f.type === "text" && <input value={String(v ?? "")} required={f.required} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "number" && <input type="number" value={Number(v ?? 0)} onChange={(e) => set(f.key, Number(e.target.value))} />}
              {f.type === "textarea" && <textarea rows={4} value={String(v ?? "")} required={f.required} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "tags" && (
                <input
                  value={((v as string[]) ?? []).join(", ")}
                  onChange={(e) => set(f.key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              )}
              {f.type === "select" && (
                <select value={String(v)} onChange={(e) => set(f.key, e.target.value)}>
                  {f.options!.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                </select>
              )}
              {f.type === "checkbox" && (
                <>
                  <input type="checkbox" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} />
                  <span>{f.label}</span>
                </>
              )}
              {f.type === "image" && (
                <div className="adm-image">
                  {v ? <img src={String(v)} alt="" /> : <span className="adm-image__empty">No image — a generated cover is used</span>}
                  <div className="adm-image__actions">
                    <input type="file" accept="image/*" onChange={(e) => onFile(f.key, e.target.files?.[0])} />
                    {!!v && <button type="button" className="adm-btn adm-btn--ghost" onClick={() => set(f.key, null)}>Remove</button>}
                  </div>
                  <input placeholder="…or paste an image URL" value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value || null)} />
                </div>
              )}
              {f.hint && <span className="adm-field__hint">{f.hint}</span>}
            </label>
          );
        })}
      </div>
      {err && <p className="adm-error" role="alert">{err}</p>}
      <div className="adm-editor__foot">
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="adm-btn" disabled={busy}>{busy ? "Saving…" : row ? "Save changes" : "Add"}</button>
      </div>
    </form>
  );
}

function TablePanel({ tab, onChanged }: { tab: Tab; onChanged: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    let q = supabase!.from(tab.table).select("*").order("sort_order", { ascending: true });
    if (tab.filter) q = q.eq(tab.filter[0], tab.filter[1]);
    const { data, error } = await q;
    if (error) setErr(error.message); else setRows(data as Row[]);
    setLoading(false);
  }, [tab]);
  useEffect(() => { setEditing(null); load(); }, [load]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const saved = (m: string) => { setEditing(null); flash(m); load(); onChanged(); };
  const remove = async (r: Row) => {
    if (!confirm(`Delete "${tab.title(r)}"? This can't be undone.`)) return;
    const { error } = await supabase!.from(tab.table).delete().eq("id", r.id);
    if (error) { setErr(error.message); return; }
    flash("Deleted"); load(); onChanged();
  };

  return (
    <section className="adm-panel">
      <div className="adm-panel__head">
        <h2 className="adm-panel__title">{tab.label} <span className="adm-count">{rows.length}</span></h2>
        <button className="adm-btn" onClick={() => setEditing("new")}>+ Add {tab.label === "FAQ" ? "question" : tab.label.toLowerCase().replace(/s$/, "")}</button>
      </div>
      {toast && <p className="adm-toast" role="status">{toast}</p>}
      {err && <p className="adm-error" role="alert">{err}</p>}
      {editing && (
        <Editor key={editing === "new" ? "new" : editing.id} tab={tab} row={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />
      )}
      {loading ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? <p className="adm-empty">Nothing here yet.</p> : (
        <ul className="adm-list">
          {rows.map((r) => (
            <li key={r.id} className={`adm-row${editing !== "new" && editing?.id === r.id ? " is-editing" : ""}`}>
              <span className="adm-row__order">{String(r.sort_order ?? 0).padStart(2, "0")}</span>
              <div className="adm-row__main">
                <span className="adm-row__title">{tab.title(r)}</span>
                <span className="adm-row__meta">{tab.meta(r)}</span>
              </div>
              <div className="adm-row__actions">
                <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(r)}>Edit</button>
                <button className="adm-btn adm-btn--danger" onClick={() => remove(r)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminPage() {
  const { session, status } = useAuth();
  const { reload } = useContent();
  const { navigate } = useRouter();
  const [tabId, setTabId] = useState(TABS[0].id);
  const tab = useMemo(() => TABS.find((t) => t.id === tabId)!, [tabId]);

  // signing out drops the session; the redirect below then takes over
  const signOut = async () => { await supabase?.auth.signOut(); };

  // No admin session (signed out, not an admin, or no Supabase): leave for the
  // home page without a trace of the dashboard or a link to the sign-in page
  const allowed = status === "admin";
  useEffect(() => {
    if (status !== "loading" && !allowed) navigate("/", { replace: true });
  }, [status, allowed, navigate]);
  if (!allowed) return <section className="sec sec--dark adm" data-tone="dark" aria-busy={status === "loading"} />;

  const body = (
    <>
      <nav className="adm-tabs" aria-label="Content">
        {TABS.map((t) => (
          <button key={t.id} className={`adm-tab${t.id === tabId ? " is-active" : ""}`} aria-current={t.id === tabId} onClick={() => setTabId(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <TablePanel tab={tab} onChanged={reload} />
    </>
  );

  return (
    <section className="sec sec--dark adm" data-tone="dark">
      <header className="adm-head">
        <div>
          <p className="label adm-kicker"><span className="lg__dot" aria-hidden="true" /> Admin</p>
          <h1 className="adm-title">Dashboard</h1>
          {session && <p className="adm-who">Signed in as {session.user.email}</p>}
        </div>
        <div className="adm-head__actions">
          <Link to="/" className="adm-btn adm-btn--ghost">View site ↗</Link>
          {session && <button className="adm-btn adm-btn--ghost" onClick={signOut}>Sign out</button>}
        </div>
      </header>
      {body}
    </section>
  );
}
