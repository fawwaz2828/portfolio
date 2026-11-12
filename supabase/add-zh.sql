-- Chinese text for projects. Run once in Supabase → SQL Editor → New query.
-- Empty = the site shows the English text in 中文 mode.
alter table public.projects
  add column if not exists description_zh text not null default '',
  add column if not exists tag_zh         text not null default '';
