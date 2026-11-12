-- Portfolio content schema. Run once in Supabase → SQL Editor → New query.
-- Visitors (anon) can only READ; only users listed in `admins` can write.

-- ── Admins ──────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- an admin may check their own row (used by the dashboard); nobody can write via the API
create policy "admins: read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── Content tables ─────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  description_zh text not null default '',     -- 中文; empty = English is shown
  tag         text not null default '',          -- e.g. "Frontend Lead · 2026"
  tag_zh      text not null default '',
  label       text not null default '',          -- e.g. "Civic-tech"
  href        text not null default '',
  stack       text[] not null default '{}',      -- tech chips
  image       text,                              -- optional screenshot URL
  scope       text not null default 'outside' check (scope in ('campus', 'outside')),
  featured    boolean not null default true,     -- false = small "Also built" list
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.timeline (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('experience', 'education')),
  date_label  text not null,                     -- e.g. "2025 — 2026"
  title       text not null,
  place       text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.skills (
  id          uuid primary key default gen_random_uuid(),
  group_name  text not null,                     -- e.g. "Frontend"
  items       text[] not null default '{}',
  sort_order  int not null default 0
);

create table if not exists public.faq (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  sort_order  int not null default 0
);

-- ── Row Level Security: public read, admin write ───────────────────────
do $$
declare t text;
begin
  foreach t in array array['projects', 'timeline', 'skills', 'faq'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s: public read" on public.%1$I for select to anon, authenticated using (true)', t);
    execute format('create policy "%1$s: admin insert" on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "%1$s: admin update" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "%1$s: admin delete" on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ── Storage bucket for project images (public read, admin upload) ──────
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio images: admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio images: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());
