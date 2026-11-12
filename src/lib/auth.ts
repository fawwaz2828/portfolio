import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Current Supabase session + whether that user is an admin (has a row in
 * public.admins, which RLS only lets a user read for themselves).
 * status: "loading" → "signed-out" | "not-admin" | "admin"
 */
export type AuthStatus = "loading" | "signed-out" | "not-admin" | "admin" | "unconfigured";

export async function checkAdmin(userId: string) {
  if (!supabase) return false;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(supabase ? "loading" : "unconfigured");

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const apply = async (s: Session | null) => {
      if (!alive) return;
      setSession(s);
      if (!s) { setStatus("signed-out"); return; }
      const ok = await checkAdmin(s.user.id);
      if (alive) setStatus(ok ? "admin" : "not-admin");
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { apply(s); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return { session, status };
}
