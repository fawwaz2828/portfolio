-- Database upgrade for the portfolio. Run once in Supabase → SQL Editor → New query.
-- Adds: Chinese (中文) text for every content table, project write-ups,
-- full project descriptions and a gallery column (several images per project).
-- Safe to run again: columns are only added when missing, and the text below
-- only fills fields that are still empty (your own edits are kept).
-- An empty 中文 field = the site shows the English text in 中文 mode.
-- An empty case study = no case study page for that project.

-- ── Columns ─────────────────────────────────────────────────────────────
alter table public.projects
  add column if not exists description_zh text not null default '',
  add column if not exists tag_zh         text not null default '',
  add column if not exists case_study     text not null default '',
  add column if not exists case_study_zh  text not null default '',
  add column if not exists images         text[] not null default '{}';

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
-- Project 中文 text is replaced, not only filled: the first automatic (machine)
-- translations had errors such as a tag reading "enter the name of the web app".
-- Edit them in /admin afterwards if you want different wording.
update public.projects as p set
  description_zh = v.d,
  tag_zh         = case when v.t <> '' then v.t else p.tag_zh end
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

-- ── Project write-ups (from each project's repository; edit them in /admin) ──
update public.projects as p set
  case_study    = case when p.case_study = '' then v.en else p.case_study end,
  case_study_zh = case when p.case_study_zh = '' then v.zh else p.case_study_zh end
from (values
  ('5e9741e7-5e90-4753-ad31-b4e1e3d0c684'::uuid, '## The problem
Indonesia''s fiscal and monetary policies are announced as budget figures and jargon. KawalBijak turns them into what they mean for one household: the change in rupiah per month, worked out from the user''s own profile, next to verified reports from citizens on the ground.

## My role
Frontend Lead in a team of three (LaBuLaDa, Universitas Islam Indonesia). I built the landing page, the policy feed, the policy detail pages, the dashboard and the sign-in flow.

## How it works
- A deterministic formula engine turns a policy and a household profile into a monthly rupiah impact.
- A gap score compares official budget figures with citizen reports, weighted by each reporter''s credibility.
- An AI advisor and a what-if simulator (Groq, Llama 3.3 70B) explain the numbers; every AI call is logged for public review.
- Every report goes through an 8-step verification pipeline, and every table is protected by row-level security in Supabase.

## Stack
Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query, Zod, Recharts, GSAP, Supabase and Groq, deployed on Vercel.

## Result
2nd place at Codelab TechSprint 2026. Live demo: https://kawalbijak.vercel.app', '## 要解决的问题
印尼的财政与货币政策通常以预算数字和专业术语发布。KawalBijak 把它们换算成对一个家庭的实际影响：根据用户自己的情况，算出每月多花或少花多少印尼盾，并附上来自各地民众、经过核实的反馈。

## 我的角色
三人团队（LaBuLaDa，印度尼西亚伊斯兰大学）中的前端负责人。我负责落地页、政策信息流、政策详情页、仪表盘和登录流程。

## 工作原理
- 确定性的公式引擎根据政策和家庭情况，计算每月的印尼盾影响。
- 差距评分（Gap Score）把官方预算数字与民众反馈进行对比，并按反馈者的可信度加权。
- AI 顾问和假设模拟器（Groq，Llama 3.3 70B）负责解释这些数字；每一次 AI 调用都会记录下来，供公众审查。
- 每条反馈都要经过 8 步核验流程，Supabase 中的每张表都启用了行级安全（RLS）。

## 技术栈
Next.js 15、React 19、TypeScript、Tailwind CSS v4、shadcn/ui、Zustand、TanStack Query、Zod、Recharts、GSAP、Supabase 和 Groq，部署在 Vercel 上。

## 成果
Codelab TechSprint 2026 第二名。在线演示：https://kawalbijak.vercel.app'),
  ('66341359-d7c0-49f5-a53d-efcd4fb65da4'::uuid, '## The problem
Getting a phone, laptop, AC or TV repaired usually means calling around and guessing what it will cost. ElectroVice connects customers with verified repair technicians nearby and keeps the whole job, from booking to payment, in one app.

## My role
Frontend developer, UI/UX designer and QA tester in a team of three (LaBuLaDa).

## What it does
- Browse verified technicians near you across six repair categories: smartphone, laptop, appliance, AC and cooling, TV and display, vehicle.
- Book a session and follow the technician live on a map.
- A 6-digit code confirms the start of the service between customer and technician.
- In-app chat, itemised repair cost estimates, push notifications, ratings and reviews.
- Separate flows for customers, technicians and admins, with a forced-update check on launch.

## Stack
Flutter and Dart with GetX, Mapbox for live tracking, and Firebase: Firestore, Auth, Cloud Messaging and Storage.

## Result
1st place at INDES 2026 in Malaysia. Released as an Android beta (v3.0.0).', '## 要解决的问题
手机、电脑、空调或电视坏了，通常只能到处打电话，也很难事先知道要花多少钱。ElectroVice 把顾客和附近经过认证的维修师傅连接起来，从预约到付款，整个流程都在一个应用里完成。

## 我的角色
三人团队（LaBuLaDa）中的前端开发、UI/UX 设计与测试。

## 主要功能
- 按位置浏览附近经过认证的师傅，覆盖六类维修：手机、电脑、家电、空调与制冷、电视与显示屏、车辆。
- 预约服务，并在地图上实时查看师傅的位置。
- 顾客与师傅通过 6 位验证码确认服务开始。
- 应用内聊天、逐项列出的维修费用估算、推送通知、评分与评价。
- 顾客、师傅和管理员各有独立的流程，启动时会检查并强制更新版本。

## 技术栈
Flutter 与 Dart（GetX），Mapbox 实时追踪，以及 Firebase：Firestore、Auth、Cloud Messaging 和 Storage。

## 成果
马来西亚 INDES 2026 第一名。已发布 Android 测试版（v3.0.0）。'),
  ('fbbb2185-afa9-412e-b3c1-8a74886ad9ac'::uuid, '## Live workout tracking
- Pose detection runs on the device with Apple Vision, drawn as a skeleton over the camera preview.
- Joint angles are measured and smoothed frame by frame.
- The movement is classified per exercise and every rep is counted.
- Each session ends with a workout result.

## AI coaching backend
- A FastAPI server that speaks the Agent-to-Agent (A2A) protocol: an agent card for discovery and JSON-RPC 2.0 for messages and tasks.
- Three skills: a personalised weekly workout plan, an Apple Health calorie summary, and a coaching chat for training, recovery and nutrition.
- Answers come from Groq (Llama 3.1 8B). The coach is told to keep advice safe and never to claim to be a doctor.
- A CrewAI prototype runs the same idea with two agents: a fitness coach and an Apple Health agent.

## Stack
SwiftUI, Apple Vision, Core ML and Firebase on iOS; Python, FastAPI, Groq and CrewAI on the server.', '## 实时训练追踪
- 在设备端用 Apple Vision 检测姿态，并在相机画面上叠加骨架。
- 逐帧测量并平滑关节角度。
- 按动作类型识别训练动作，并统计每一次重复。
- 每次训练结束后生成训练结果。

## AI 教练后端
- 基于 FastAPI 的服务器，遵循 Agent-to-Agent（A2A）协议：用 Agent Card 进行发现，用 JSON-RPC 2.0 处理消息和任务。
- 三项技能：个性化每周训练计划、Apple Health 卡路里摘要，以及关于训练、恢复和营养的教练对话。
- 回答由 Groq（Llama 3.1 8B）生成。教练被要求给出安全的建议，且从不自称医生。
- 另有一个 CrewAI 原型，用两个智能体实现同样的思路：健身教练和 Apple Health 智能体。

## 技术栈
iOS 端：SwiftUI、Apple Vision、Core ML、Firebase；服务器端：Python、FastAPI、Groq、CrewAI。'),
  ('10b0fcce-12b9-427e-86ef-96d1d56344c0'::uuid, '## Modules
- Sign-in with role-based access for admins, teachers and parents, decided in one central place.
- A role-aware dashboard with live analytics.
- Student roster and profiles, with teacher and parent assignment.
- Daily reports with rubric scoring, a draft-to-publish flow and parent acknowledgement.
- Individualised education programmes (IEP) with measurable goals and progress history.
- Behaviour incidents with severity levels and rules for what parents can see.
- Therapy scheduling that checks for student, teacher and room conflicts.
- Parent–teacher messaging tied to a student, a role-scoped calendar, notifications with a daily therapy reminder, and role-targeted announcements.

## Architecture
Layered from controllers to services (business rules, access control, transactions) to MyBatis data access over MySQL 8. Multi-step writes run in a single transaction, and the access-control and report services are covered by JUnit 5 and Mockito tests.

## Stack
Java 17, Spring Boot 3, Spring Security with BCrypt, Thymeleaf, Bootstrap 5, MyBatis, MySQL 8 and HikariCP.', '## 功能模块
- 登录与基于角色的权限（管理员、教师、家长），由统一的位置集中判定。
- 按角色显示的仪表盘，带实时数据分析。
- 学生名册与档案，可分配教师和家长。
- 每日报告：评分量表、草稿到发布的流程，以及家长确认。
- 个别化教育计划（IEP），包含可衡量的目标和进度记录。
- 行为事件记录，分严重程度，并规定家长可见的内容。
- 治疗排期，自动检查学生、教师和教室的时间冲突。
- 以学生为单位的家校沟通、按角色划分的日历、含每日治疗提醒的通知，以及面向特定角色的公告。

## 架构
分层结构：控制器 → 服务层（业务规则、权限控制、事务）→ MyBatis 数据访问 → MySQL 8。多步写入在同一个事务中完成，权限控制和报告服务有 JUnit 5 与 Mockito 测试覆盖。

## 技术栈
Java 17、Spring Boot 3、Spring Security（BCrypt）、Thymeleaf、Bootstrap 5、MyBatis、MySQL 8、HikariCP。'),
  ('da0e8340-970b-430b-9f32-8570f3bf877e'::uuid, '## How a scan works
- An on-device Core ML model first checks that the photo shows food, so other photos never reach the API.
- OpenAI''s GPT-4o vision model analyses the photo and returns the dish, calories, macros, health score and ingredients as JSON.
- The result is saved to the history and compared with today''s calorie goal.
- Without an API key, the app falls back to a classic Core ML classifier and a calorie database.

## Seven AI agents
The app is built as seven agents with one job each: image recognition, calorie estimation, history, daily recommendations, nutrition facts, personal advice with "what-if" swaps based on the last seven days, and full photo analysis. A coordinator runs them as a pipeline, and the photo-analysis agent is called through an Agent-to-Agent (A2A) protocol with JSON-RPC 2.0 messages.

## Privacy
The history stays on the device as local JSON. Photos are sent to OpenAI only when a scan or a chat needs them.

## Stack
SwiftUI (MVVM), Swift concurrency with async/await and actors, Core ML, Vision, OpenAI GPT-4o and GPT-4o mini, HealthKit.', '## 一次扫描的流程
- 设备端的 Core ML 模型先判断照片里是不是食物，非食物照片不会发送到 API。
- OpenAI 的 GPT-4o 视觉模型分析照片，以 JSON 形式返回菜品、热量、营养素、健康评分和食材。
- 结果保存到历史记录，并与当天的热量目标进行比较。
- 没有 API 密钥时，应用改用传统的 Core ML 分类器和热量数据库。

## 七个 AI 智能体
应用由七个各司其职的智能体组成：图像识别、热量估算、历史记录、每日建议、营养信息、基于最近七天的个性化建议与"假如"替换方案，以及完整的照片分析。协调器把它们串成流水线，照片分析智能体通过 Agent-to-Agent（A2A）协议、以 JSON-RPC 2.0 消息调用。

## 隐私
历史记录以本地 JSON 保存在设备上。只有在扫描或对话需要时，照片才会发送给 OpenAI。

## 技术栈
SwiftUI（MVVM）、Swift 并发（async/await 与 actor）、Core ML、Vision、OpenAI GPT-4o 与 GPT-4o mini、HealthKit。'),
  ('a60e7ad1-20b8-4bad-98e5-fbf4b2a50e07'::uuid, '## My role
I worked on the frontend, built with Next.js and TypeScript.

## Features
- Role-based sign-in for administrators, government, police and tourism managers, with protected routes.
- Drag-and-drop CSV upload with format validation and import progress.
- An AI analytics tab that answers questions such as "which location has the highest trend".
- An interactive heatmap: click an area to see its crime statistics.
- Trend and distribution charts built from the uploaded data.
- A public heatmap and location-based recommendations for tourists, with no account needed.

## Stack
Next.js 15, React, TypeScript, Tailwind CSS, Axios and Lucide icons. In this version the API layer and the AI predictions are mocked.', '## 我的角色
负责前端开发，使用 Next.js 和 TypeScript。

## 功能
- 面向管理员、政府、警方和旅游管理者的角色登录，并保护各自的页面。
- 拖放上传 CSV，带格式校验和导入进度。
- AI 分析页，可以回答"哪个地点的趋势最高"之类的问题。
- 交互式热力图：点击某个区域即可查看该区域的犯罪统计。
- 根据上传数据生成的趋势图和分布图。
- 面向游客的公开热力图和基于位置的建议，无需注册。

## 技术栈
Next.js 15、React、TypeScript、Tailwind CSS、Axios、Lucide 图标。当前版本中，API 层和 AI 预测为模拟实现。'),
  ('f3220ffd-366e-434c-9246-4c869a97ac54'::uuid, '## Design
- A "Greenwave" design system: deep forest-green panels alternating with light cream sections, and lime used sparingly for calls to action and highlights.
- Space Grotesk for headings and Plus Jakarta Sans for body text.
- Rounded, organic shapes: an arch-shaped photo collage, pill buttons with a sliding arrow, a rotating "AI 24/7" seal and a scrolling marquee of features.
- A single breakpoint at 920 px turns every grid into one column.

## Page structure
A hero with the collage and trust badges, the problems businesses face, the solution with a chat screenshot, the features with an analytics dashboard, Lite and Pro pricing, an about section with contact details, and a footer with the business''s legal information.

## Stack
Vite, HTML, CSS and JavaScript, deployed on Vercel.', '## 设计
- "Greenwave"设计系统：深森林绿面板与浅奶油色区块交替，青柠绿只用于行动按钮和重点。
- 标题使用 Space Grotesk，正文使用 Plus Jakarta Sans。
- 圆润、有机的造型：拱形照片拼贴、带滑动箭头的胶囊按钮、旋转的"AI 24/7"徽章，以及滚动的功能字幕条。
- 只设一个 920 px 断点，所有网格在此变为单列。

## 页面结构
首屏（照片拼贴与信任标签）、商家面临的问题、附聊天截图的解决方案、附数据看板的功能介绍、Lite 与 Pro 两档价格、带联系方式的"关于"，以及包含商家法律信息的页脚。

## 技术栈
Vite、HTML、CSS、JavaScript，部署在 Vercel 上。'),
  ('cd5f0889-0130-4cda-b170-4eb125c8c351'::uuid, '## Features
- A product catalogue with product pages, and a blog with search and category filters.
- Accounts with a consultation dashboard, a booking form, a device list and a profile with avatar upload.
- An admin panel with statistics and the latest consultations, plus management of consultations, users, products and articles.
- A landing page that stays dark while its lights are off.

## Code quality
PHP 8.2 with strict types in every file, PHPStan at level 9, the PER-CS code style and Rector. SQL lives only in repositories and always uses bound parameters, form input goes through validated DTOs, every page escapes its output, and every form carries a CSRF token.

## Stack
PHP 8, MySQL and Tailwind CSS.', '## 功能
- 产品目录与产品详情页，以及带搜索和分类筛选的博客。
- 用户账户：咨询列表、预约表单、设备列表，以及可上传头像的个人资料。
- 管理后台：统计数据和最新咨询，并可管理咨询、用户、产品和文章。
- 落地页在"灯"还没打开时保持深色。

## 代码质量
PHP 8.2，所有文件启用严格类型，PHPStan 9 级、PER-CS 代码风格和 Rector。SQL 只写在仓储层并始终使用参数绑定，表单输入经过带校验的 DTO，所有页面输出都经过转义，每个表单都带 CSRF 令牌。

## 技术栈
PHP 8、MySQL、Tailwind CSS。'),
  ('f1a66f6b-a17d-4db1-aca3-688008e0f0c2'::uuid, '## Features
- Find a mentor and apply with a short questionnaire, once per mentor.
- Mentors review applications; mentees see each one as waiting, accepted or declined.
- Private chat between a mentor and their accepted mentees, saved to the database and live while the chat server runs.
- A forum with categories, replies, likes and search.
- A learning library of articles, videos and e-books published by mentors and organisations.
- Passwords hashed with PBKDF2; old plain-text passwords are upgraded at the next sign-in.

## Roles
Mentees, mentors and organisations, each with their own home screen. Organisations manage their profile, join the forum and publish learning content.

## Architecture
Controllers never touch SQL: every query lives in a DAO layer, and the app creates its own tables the first time it connects. Chat runs over a small socket server.

## Stack
Java 17, JavaFX 21, MySQL 8 and Maven.', '## 功能
- 浏览导师并通过简短问卷提交申请，每位导师只能申请一次。
- 导师审核申请；学员可以看到每份申请处于等待、已接受还是已拒绝。
- 导师与已接受学员之间的私聊，消息保存在数据库中，聊天服务器运行时实时显示。
- 带分类、回复、点赞和搜索的论坛。
- 学习资源库：由导师和机构发布的文章、视频和电子书。
- 密码使用 PBKDF2 加密；旧的明文密码会在下次登录时自动升级。

## 角色
学员、导师和机构各有自己的首页。机构可以管理资料、参与论坛并发布学习内容。

## 架构
控制器从不直接写 SQL：所有查询都在 DAO 层，应用首次连接时自动创建数据表。聊天通过一个小型 socket 服务器实现。

## 技术栈
Java 17、JavaFX 21、MySQL 8、Maven。'),
  ('7294646e-4e62-44e2-8143-27e4f6fc2985'::uuid, '## My role
I developed and managed the site in WordPress as part of DPM UII''s administration and information media team, where I also worked on content and live coverage of the council''s events.

## Stack
WordPress.', '## 我的角色
作为 DPM UII 行政与信息媒体团队的一员，我使用 WordPress 开发并管理该网站，同时负责内容制作和委员会活动的现场报道。

## 技术栈
WordPress。')
) as v(id, en, zh)
where p.id = v.id;

-- ── Project descriptions (1–2 paragraphs) and details ──────────────────
-- Description and tech stack are replaced; tag and type only fill empty fields.
update public.projects as p set
  description    = v.en,
  description_zh = v.zh,
  stack          = v.stack,
  tag            = case when p.tag = ''    and v.tag <> ''    then v.tag    else p.tag end,
  tag_zh         = case when p.tag_zh = '' and v.tag_zh <> '' then v.tag_zh else p.tag_zh end,
  label          = case when p.label = ''  and v.label <> ''  then v.label  else p.label end
from (values
  ('5e9741e7-5e90-4753-ad31-b4e1e3d0c684'::uuid, 'KawalBijak is a civic-tech platform that makes Indonesia''s fiscal and monetary policies easy to follow. Instead of budget figures and jargon, it shows what a policy means for one household: the change in rupiah per month, worked out from the user''s own profile, next to verified reports from citizens on the ground.

I led the frontend in a team of three, building the landing page, the policy feed, the policy pages, the dashboard and the sign-in flow in Next.js 15, React 19 and Supabase. The project won 2nd place at Codelab TechSprint 2026.', 'KawalBijak 是一个公民科技平台，让印尼的财政与货币政策更容易理解。它不再只给出预算数字和专业术语，而是根据用户自己的情况，算出一项政策对一个家庭每月意味着多少印尼盾的变化，并附上来自各地民众、经过核实的反馈。

我在三人团队中担任前端负责人，使用 Next.js 15、React 19 和 Supabase 开发了落地页、政策动态、政策详情页、仪表盘和登录流程。该项目获得 Codelab TechSprint 2026 第二名。', array['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Groq']::text[], '', '', ''),
  ('66341359-d7c0-49f5-a53d-efcd4fb65da4'::uuid, 'ElectroVice is a Flutter app that connects customers with verified repair technicians nearby, for phones, laptops, appliances, AC units, TVs and vehicles. Booking, live tracking on a map, chat, cost estimates, payment and reviews all happen in one app.

I worked on the frontend, the UI/UX design and QA in a team of three. The app won 1st place at INDES 2026 in Malaysia and was released as an Android beta.', 'ElectroVice 是一款 Flutter 应用，把顾客和附近经过认证的维修师傅连接起来，覆盖手机、电脑、家电、空调、电视和车辆等维修类别。预约、地图实时追踪、聊天、费用估算、付款和评价都在同一个应用里完成。

我在三人团队中负责前端开发、UI/UX 设计和测试。该应用在马来西亚 INDES 2026 获得第一名，并已发布 Android 测试版。', array['Flutter', 'Dart', 'GetX', 'Firebase', 'Mapbox']::text[], '', '', ''),
  ('fbbb2185-afa9-412e-b3c1-8a74886ad9ac'::uuid, 'fawfitt is a native iOS fitness app that watches your workout through the camera. Apple''s Vision framework tracks the body''s pose on the device, measures joint angles and counts every rep while you train, so no video ever leaves the phone.

A small FastAPI backend adds AI coaching: it builds a personalised weekly plan from the user''s profile, summarises Apple Health calories and answers questions about training, recovery and nutrition.', 'fawfitt 是一款原生 iOS 健身应用，通过摄像头跟踪你的训练。Apple Vision 框架在设备端识别身体姿态、测量关节角度，并在训练时自动计数，视频不会离开手机。

一个轻量的 FastAPI 后端提供 AI 教练功能：根据用户资料生成个性化的每周训练计划，汇总 Apple Health 的卡路里数据，并解答关于训练、恢复和营养的问题。', array['SwiftUI', 'Apple Vision', 'Core ML', 'Firebase', 'Python', 'FastAPI']::text[], '', '', ''),
  ('10b0fcce-12b9-427e-86ef-96d1d56344c0'::uuid, 'Luna Bridge (SNE-SPIMS) is a student progress and information system for a special-needs school. Admins, teachers and parents each sign in to their own view of the same student records: daily reports, individualised education programmes, behaviour notes, therapy schedules and messages between parents and teachers.

The system was moved from an older Servlet/JSP application to Spring Boot 3, with access rules decided in one central place, multi-step changes saved in a single transaction, and the core services covered by JUnit tests.', 'Luna Bridge（SNE-SPIMS）是一套面向特殊教育学校的学生成长与信息管理系统。管理员、教师和家长各自登录，查看同一份学生档案中与自己相关的内容：每日报告、个别化教育计划、行为记录、治疗排期以及家校消息。

系统从旧的 Servlet/JSP 应用迁移到 Spring Boot 3，权限规则集中管理，多步骤操作在同一事务中保存，核心服务由 JUnit 测试覆盖。', array['Java', 'Spring Boot', 'Spring Security', 'Thymeleaf', 'MyBatis', 'MySQL']::text[], '', '', ''),
  ('da0e8340-970b-430b-9f32-8570f3bf877e'::uuid, 'FoodScan is an iOS app that reads a meal from a single photo: the dish, its calories, macros, a health score and the ingredients it can see. Each scan goes into a daily log measured against a personal calorie goal, with suggestions for better choices.

An on-device Core ML model first checks that the photo really shows food, then GPT-4o vision does the analysis. The history stays on the phone, and without an API key the app falls back to an on-device classifier and a calorie database.', 'FoodScan 是一款 iOS 应用，只需一张照片就能识别一餐：菜品名称、卡路里、宏量营养素、健康评分以及可见的食材。每次扫描都会记入每日记录，与个人热量目标对比，并给出更健康的建议。

设备端的 Core ML 模型会先确认照片里确实是食物，再由 GPT-4o 视觉模型进行分析。历史记录保存在手机上；没有 API 密钥时，应用会改用设备端分类器和卡路里数据库。', array['SwiftUI', 'Core ML', 'Vision', 'OpenAI GPT-4o', 'HealthKit']::text[], '', '', ''),
  ('a60e7ad1-20b8-4bad-98e5-fbf4b2a50e07'::uuid, 'CrimeWatch is a web platform that analyses crime data to support tourism safety in Yogyakarta. Tourists can open a public heatmap and safety tips without an account, government and police upload data, tourism managers get trends and predictions, and administrators manage users.

I worked on the frontend in Next.js and TypeScript: role-based sign-in, CSV upload with validation, the interactive heatmap, the trend charts and an AI analytics tab.', 'CrimeWatch 是一个分析犯罪数据、服务日惹旅游安全的网页平台。游客无需注册即可查看公开的热力图和安全提示；政府和警方上传数据；旅游管理者查看趋势与预测；管理员负责管理用户。

我负责使用 Next.js 和 TypeScript 开发前端：基于角色的登录、带校验的 CSV 上传、交互式热力图、趋势图表以及 AI 分析页面。', array['Next.js', 'React', 'TypeScript', 'Tailwind CSS']::text[], '', '', ''),
  ('f3220ffd-366e-434c-9246-4c869a97ac54'::uuid, 'larisin.ai is an AI assistant for Indonesian businesses that replies to customers automatically on WhatsApp and Instagram. As a freelance project, I designed and built its landing page.

The page follows a "Greenwave" design system of deep green and cream sections with lime highlights, and walks visitors from the problems businesses face to the solution, the features, Lite and Pro pricing and contact details. It is built with Vite and plain HTML, CSS and JavaScript and deployed on Vercel.', 'larisin.ai 是一款面向印尼商家的 AI 助手，可以在 WhatsApp 和 Instagram 上自动回复顾客。作为一个自由职业项目，我设计并开发了它的落地页。

页面采用 "Greenwave" 设计系统：深绿色与米色区块交替，并以青柠色点缀，引导访客依次了解商家的痛点、解决方案、功能、Lite 与 Pro 套餐以及联系方式。页面使用 Vite 和原生 HTML、CSS、JavaScript 构建，部署在 Vercel 上。', array['Vite', 'HTML', 'CSS', 'JavaScript', 'Vercel']::text[], '', '', ''),
  ('cd5f0889-0130-4cda-b170-4eb125c8c351'::uuid, 'Sustain Energy Solutions is a website for smart lighting products and installation services. Visitors browse a product catalogue and a blog, then create an account to book a consultation and keep track of their devices, while an admin panel manages consultations, users, products and articles.

The code is PHP 8 with strict types, checked by PHPStan at its strictest level. All SQL uses bound parameters, form input goes through validated objects, and every form is protected with a CSRF token.', 'Sustain Energy Solutions 是一个智能照明产品与安装服务网站。访客可以浏览产品目录和博客，注册账号后预约咨询并管理自己的设备；管理后台负责管理咨询、用户、产品和文章。

代码使用开启严格类型的 PHP 8，并通过最高级别的 PHPStan 检查。所有 SQL 都使用参数绑定，表单输入经过校验对象处理，每个表单都带有 CSRF 令牌保护。', array['PHP', 'MySQL', 'Tailwind CSS']::text[], 'Web App · 2024', 'Web 应用 · 2024', 'Web'),
  ('f1a66f6b-a17d-4db1-aca3-688008e0f0c2'::uuid, 'HerPathway is a desktop mentoring app that connects women with mentors who can help them grow. Mentees apply to a mentor with a short questionnaire, mentors accept or decline, and accepted pairs can chat privately. A forum and a learning library of articles, videos and e-books complete the platform.

It is built with Java 17 and JavaFX on MySQL. Every query lives in a separate data-access layer, chat runs over a small socket server, and passwords are hashed with PBKDF2.', 'HerPathway 是一款桌面端导师指导应用，帮助女性找到能够支持她们成长的导师。学员通过简短问卷向导师申请，导师可以接受或拒绝，配对成功后双方即可私聊。平台还包括论坛以及收录文章、视频和电子书的学习资料库。

应用使用 Java 17 和 JavaFX 开发，数据库为 MySQL。所有查询都放在独立的数据访问层，聊天通过一个小型 socket 服务器实现，密码使用 PBKDF2 加密存储。', array['Java', 'JavaFX', 'MySQL', 'Maven']::text[], 'Desktop App · 2024', '桌面应用 · 2024', 'Desktop'),
  ('d1367d16-822b-437c-a8b0-36ae4133d091'::uuid, 'Maintance is a design for a building maintenance management app, made as an interactive prototype in Figma.

The prototype can be clicked through from its first screen with the "Open project" button.', 'Maintance 是一款建筑维护管理应用的设计，以 Figma 交互原型的形式完成。

点击"打开项目"按钮，即可从第一个页面开始体验该原型。', array['Figma']::text[], 'UI/UX Design', 'UI/UX 设计', 'Prototype'),
  ('7294646e-4e62-44e2-8143-27e4f6fc2985'::uuid, 'The official website of DPM UII, the student representative council of Universitas Islam Indonesia, at dpm.uii.ac.id.

I developed and managed the site in WordPress as part of the council''s administration and information media team, where I also worked on content and live coverage of its events.', '印尼伊斯兰大学学生代表委员会（DPM UII）的官方网站：dpm.uii.ac.id。

作为委员会行政与信息媒体团队的一员，我使用 WordPress 开发并管理该网站，同时负责内容制作和活动的实时报道。', array['WordPress']::text[], 'Web Developer · 2025', '网站开发 · 2025', 'Website')
) as v(id, en, zh, stack, tag, tag_zh, label)
where p.id = v.id;

-- make the API see the new columns right away
notify pgrst, 'reload schema';
