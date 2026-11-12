import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "./lib/supabase";
import { useLang, type Lang } from "./i18n";
import * as local from "./data";
import type { Entry, Project, Scope } from "./data";

/**
 * Site content (projects, experience, education, skills, FAQ) from Supabase,
 * edited in the /admin dashboard. Starts from the bundled data.ts so the site
 * renders instantly and still works if Supabase is slow or unreachable; the
 * database version replaces it as soon as it arrives. `version` bumps on every
 * swap so animations can re-measure.
 *
 * 中文: rows carry Chinese copies of their text (the *_zh columns from
 * supabase/add-zh.sql). The provider hands out the Chinese text in 中文 mode,
 * falling back to English for any field that has none, so pages just read
 * `title`, `group`, `q`… whatever the language.
 */
export type MoreProject = { name: string; desc: string; descZh?: string; scope: Scope };
export type SkillGroup = { group: string; items: string[]; groupZh?: string };
export type Faq = { q: string; a: string; qZh?: string; aZh?: string };

export type Content = {
  projects: Project[];
  moreProjects: MoreProject[];
  experience: Entry[];
  education: Entry[];
  skills: SkillGroup[];
  faq: Faq[];
};

// Row shapes in the database (supabase/schema.sql)
export type ProjectRow = {
  id: string; name: string; description: string; tag: string; label: string; href: string;
  description_zh?: string; tag_zh?: string; // added by supabase/add-zh.sql
  stack: string[]; image: string | null; scope: Scope; featured: boolean; sort_order: number;
};
export type TimelineRow = {
  id: string; kind: "experience" | "education"; date_label: string; title: string; place: string; sort_order: number;
  date_label_zh?: string; title_zh?: string; place_zh?: string;
};
export type SkillRow = { id: string; group_name: string; items: string[]; sort_order: number; group_name_zh?: string };
export type FaqRow = { id: string; question: string; answer: string; sort_order: number; question_zh?: string; answer_zh?: string };

const LOCAL: Content = {
  projects: local.projects,
  moreProjects: local.moreProjects,
  experience: local.experience,
  education: local.education,
  skills: local.skills,
  faq: local.faq,
};

async function fetchContent(): Promise<Content | null> {
  if (!supabase) return null;
  const order = { ascending: true };
  const [p, t, s, f] = await Promise.all([
    supabase.from("projects").select("*").order("sort_order", order).order("created_at", order),
    supabase.from("timeline").select("*").order("sort_order", order).order("created_at", order),
    supabase.from("skills").select("*").order("sort_order", order),
    supabase.from("faq").select("*").order("sort_order", order),
  ]);
  if (p.error || t.error || s.error || f.error) {
    console.warn("[content] Supabase unavailable, using bundled data:", p.error ?? t.error ?? s.error ?? f.error);
    return null;
  }
  const projects = (p.data as ProjectRow[]);
  const timeline = (t.data as TimelineRow[]);
  const toEntry = (r: TimelineRow): Entry => ({
    date: r.date_label, title: r.title, place: r.place,
    dateZh: r.date_label_zh || undefined, titleZh: r.title_zh || undefined, placeZh: r.place_zh || undefined,
  });
  return {
    projects: projects.filter((r) => r.featured).map((r) => ({
      name: r.name, desc: r.description, tag: r.tag, label: r.label, href: r.href,
      descZh: r.description_zh || undefined, tagZh: r.tag_zh || undefined,
      stack: r.stack ?? [], image: r.image ?? undefined, scope: r.scope,
    })),
    moreProjects: projects.filter((r) => !r.featured).map((r) => ({ name: r.name, desc: r.description, descZh: r.description_zh || undefined, scope: r.scope })),
    experience: timeline.filter((r) => r.kind === "experience").map(toEntry),
    education: timeline.filter((r) => r.kind === "education").map(toEntry),
    skills: (s.data as SkillRow[]).map((r) => ({ group: r.group_name, items: r.items ?? [], groupZh: r.group_name_zh || undefined })),
    faq: (f.data as FaqRow[]).map((r) => ({ q: r.question, a: r.answer, qZh: r.question_zh || undefined, aZh: r.answer_zh || undefined })),
  };
}

/** The same content with the Chinese text swapped in where there is some. */
function localize(c: Content, lang: Lang): Content {
  if (lang !== "zh") return c;
  const entry = (e: Entry): Entry => ({ ...e, date: e.dateZh || e.date, title: e.titleZh || e.title, place: e.placeZh || e.place });
  return {
    ...c,
    experience: c.experience.map(entry),
    education: c.education.map(entry),
    skills: c.skills.map((g) => ({ ...g, group: g.groupZh || g.group })),
    faq: c.faq.map((f) => ({ ...f, q: f.qZh || f.q, a: f.aZh || f.a })),
  };
}

type Ctx = Content & { version: number; source: "local" | "database"; reload: () => Promise<void> };
const ContentContext = createContext<Ctx>({ ...LOCAL, version: 0, source: "local", reload: async () => {} });

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ content: Content; version: number; source: "local" | "database" }>(
    { content: LOCAL, version: 0, source: "local" },
  );
  const reload = useCallback(async () => {
    const c = await fetchContent().catch(() => null);
    if (c) setState((s) => ({ content: c, version: s.version + 1, source: "database" }));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const { lang } = useLang();
  const value = useMemo(
    () => ({ ...localize(state.content, lang), version: state.version, source: state.source, reload }),
    [state, reload, lang],
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
