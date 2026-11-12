-- Chinese (中文) text for every content table. Run once in Supabase → SQL Editor → New query.
-- Safe to run again: columns are only added when missing, and the translations
-- below only fill fields that are still empty (your own edits are kept).
-- An empty 中文 field = the site shows the English text in 中文 mode.

-- ── Columns ─────────────────────────────────────────────────────────────
alter table public.projects
  add column if not exists description_zh text not null default '',
  add column if not exists tag_zh         text not null default '';

alter table public.timeline
  add column if not exists date_label_zh text not null default '',
  add column if not exists title_zh      text not null default '',
  add column if not exists place_zh      text not null default '';

alter table public.skills
  add column if not exists group_name_zh text not null default '';

alter table public.faq
  add column if not exists question_zh text not null default '',
  add column if not exists answer_zh   text not null default '';

-- ── Translations for the current content (matched by id) ───────────────
update public.projects as p set
  description_zh = case when p.description_zh = '' then v.d else p.description_zh end,
  tag_zh         = case when p.tag_zh = '' then v.t else p.tag_zh end
from (values
  ('5e9741e7-5e90-4753-ad31-b4e1e3d0c684'::uuid, '让印尼财政与货币政策更易理解的公民科技平台。负责前端开发——Next.js 15、React 19、Supabase。🥈 Codelab TechSprint 2026 第二名。', '前端负责人 · 2026'),
  ('66341359-d7c0-49f5-a53d-efcd4fb65da4'::uuid, '为马来西亚 INDES 2026 打造的 Flutter 移动应用——GetX、Firebase 与 Mapbox。负责开发、UI/UX 与测试。🥇 第一名。', '移动开发 · 2026'),
  ('fbbb2185-afa9-412e-b3c1-8a74886ad9ac'::uuid, '原生 SwiftUI 应用，借助 Apple Vision 与 Core ML 在设备端分析姿态与动作，并由 FastAPI 多智能体后端生成 AI 训练报告。', 'iOS 应用 · 2026'),
  ('10b0fcce-12b9-427e-86ef-96d1d56344c0'::uuid, '面向特殊教育学校的学生成长与信息管理系统——基于角色的权限、个别化教育计划（IEP）、治疗排期与家校沟通。Spring Boot 3、MySQL 8。', 'Web 应用 · 2026'),
  ('da0e8340-970b-430b-9f32-8570f3bf877e'::uuid, 'SwiftUI 卡路里追踪应用，支持 AI 食物分析与个性化热量目标。', 'iOS 应用 · 2026'),
  ('a60e7ad1-20b8-4bad-98e5-fbf4b2a50e07'::uuid, '评估旅游区犯罪风险等级的平台。前端使用 Next.js 与 TypeScript。', '前端 · 2025'),
  ('f3220ffd-366e-434c-9246-4c869a97ac54'::uuid, '一款 AI 商业助手的落地页，帮助商家在 WhatsApp 与 Instagram 上经营。', '自由职业 · 2025'),
  ('cd5f0889-0130-4cda-b170-4eb125c8c351'::uuid, '智能照明与安装服务的电商平台 — PHP, MySQL', ''),
  ('f1a66f6b-a17d-4db1-aca3-688008e0f0c2'::uuid, '面向 STEM 领域女性的导师指导平台 — Java, MySQL', ''),
  ('d1367d16-822b-437c-a8b0-36ae4133d091'::uuid, '建筑维护管理应用 — Figma 原型', ''),
  ('7294646e-4e62-44e2-8143-27e4f6fc2985'::uuid, '开发并管理官方网站（dpm.uii.ac.id）— WordPress', '')
) as v(id, d, t)
where p.id = v.id;

update public.timeline as r set
  date_label_zh = case when r.date_label_zh = '' then v.d else r.date_label_zh end,
  title_zh      = case when r.title_zh = '' then v.t else r.title_zh end,
  place_zh      = case when r.place_zh = '' then v.p else r.place_zh end
from (values
  ('84e720a4-6c66-4902-a868-e9859ab79a3e'::uuid, '2025年9月 — 至今', '南京晓庄学院', '软件工程工学学士（2+2 双学位）· 中国南京'),
  ('01d2da8b-1942-4e17-85d8-d074d9d53fc0'::uuid, '2026 — 至今', '媒体与创意负责人', '晓庄印尼学生会（IMIX）'),
  ('fb3c0272-0657-49e1-8865-a45c85a8a026'::uuid, '2023 — 2025', '印度尼西亚伊斯兰大学', '信息学学士 · 日惹'),
  ('2a137937-2505-420c-82ac-33985526c670'::uuid, '2025 — 2026', '自由职业网页开发者', 'React 界面、落地页与 WordPress 网站'),
  ('bfcff697-cec0-4ec4-9fac-d5109d4582f7'::uuid, '2020 — 2023', '望加锡 Telkom 职业高中', '职业高中'),
  ('29d09bc1-f227-487b-88e1-bae0a267e044'::uuid, '2024 — 2025', '行政与信息媒体干事', 'DSJ DPM UII — 内容、现场报道与网站'),
  ('1f1fda83-bd92-47d5-96ad-63eb16c57968'::uuid, '2024 — 2025', '伊斯兰研究与干部培养', '伊斯兰大学工业技术学院伊斯兰学生协会（HMI FTI UII）'),
  ('8202f130-796c-4d77-a880-3d1169e54c79'::uuid, '2024', '公关干事 · INPUT 与安保干事 · PESONA Ta''aruf 迎新活动', '印度尼西亚伊斯兰大学'),
  ('f6fd88c1-0c0a-4e20-9ab9-5f27c205b62b'::uuid, '2022年3月 — 5月', '行政与运营实习生', 'Telkom Property')
) as v(id, d, t, p)
where r.id = v.id;

update public.skills as s set
  group_name_zh = case when s.group_name_zh = '' then v.g else s.group_name_zh end
from (values
  ('756a0ee5-7536-4c7b-9568-c19ae3d72a28'::uuid, '前端'),
  ('15bd5782-ddf1-4650-9e9b-33c2a93f6a87'::uuid, '移动端'),
  ('2e711e2e-53e0-4a5d-97fc-7d492ea67067'::uuid, '后端'),
  ('d8f568ce-b40c-4dee-8633-7abd3b6c810b'::uuid, 'AI 与设计')
) as v(id, g)
where s.id = v.id;

update public.faq as f set
  question_zh = case when f.question_zh = '' then v.q else f.question_zh end,
  answer_zh   = case when f.answer_zh = '' then v.a else f.answer_zh end
from (values
  ('e70e6c57-bdca-4289-abfa-383261ff1b5d'::uuid, '你现在在寻找什么机会？', '前端开发、UI/UX 或移动端方向的实习和自由职业项目，远程或现场均可。'),
  ('ec5b28bd-0815-4a56-bc77-f5a4f0c0a880'::uuid, '你最常用的技术栈是什么？', '网页端用 Next.js、React 和 TypeScript 搭配 Tailwind；移动端用 SwiftUI 或 Flutter；后端用 Spring Boot 或 FastAPI；设计用 Figma。'),
  ('9e1a952f-b2fc-4a10-ae97-70d06f6e476b'::uuid, '你能做 AI 相关的功能吗？', '可以。我用 Core ML 和 Apple Vision 做过设备端机器学习，也通过多智能体（A2A JSON-RPC 2.0）后端集成过 GPT-4o mini 等大语言模型。'),
  ('4784ac50-485b-4e78-a2e6-0de1753d6d4f'::uuid, '你会说哪些语言？', '印尼语（母语）、英语（流利）和中文（基础，在南京每天都在进步）。')
) as v(id, q, a)
where f.id = v.id;

-- make the API see the new columns right away
notify pgrst, 'reload schema';
