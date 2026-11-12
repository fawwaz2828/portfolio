import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "./lib/supabase";
import * as local from "./data";
import type { Entry, Project, Scope } from "./data";

/**
 * Site content (projects, experience, education, skills, FAQ) from Supabase,
 * edited in the /admin dashboard. Starts from the bundled data.ts so the site
 * renders instantly and still works if Supabase is slow or unreachable; the
 * database version replaces it as soon as it arrives. `version` bumps on every
 * swap so animations can re-measure.
 */
export type MoreProject = { name: string; desc: string; descZh?: string; scope: Scope };
export type SkillGroup = { group: string; items: string[] };
export type Faq = { q: string; a: string };

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
export type TimelineRow = { id: string; kind: "experience" | "education"; date_label: string; title: string; place: string; sort_order: number };
export type SkillRow = { id: string; group_name: string; items: string[]; sort_order: number };
export type FaqRow = { id: string; question: string; answer: string; sort_order: number };

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
  const toEntry = (r: TimelineRow): Entry => ({ date: r.date_label, title: r.title, place: r.place });
  return {
    projects: projects.filter((r) => r.featured).map((r) => ({
      name: r.name, desc: r.description, tag: r.tag, label: r.label, href: r.href,
      descZh: r.description_zh || undefined, tagZh: r.tag_zh || undefined,
      stack: r.stack ?? [], image: r.image ?? undefined, scope: r.scope,
    })),
    moreProjects: projects.filter((r) => !r.featured).map((r) => ({ name: r.name, desc: r.description, descZh: r.description_zh || undefined, scope: r.scope })),
    experience: timeline.filter((r) => r.kind === "experience").map(toEntry),
    education: timeline.filter((r) => r.kind === "education").map(toEntry),
    skills: (s.data as SkillRow[]).map((r) => ({ group: r.group_name, items: r.items ?? [] })),
    faq: (f.data as FaqRow[]).map((r) => ({ q: r.question, a: r.answer })),
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
  const value = useMemo(() => ({ ...state.content, version: state.version, source: state.source, reload }), [state, reload]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
