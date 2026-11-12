-- Current site content (generated from src/data.ts). Run after schema.sql.

insert into public.projects (name, description, tag, label, href, stack, image, scope, featured, sort_order) values
  ('KawalBijak', 'Civic-tech platform making Indonesian fiscal & monetary policy accessible. Led the frontend — Next.js 15, React 19, Supabase. 🥈 2nd Place, Codelab TechSprint 2026.', 'Frontend Lead · 2026', 'Civic-tech', 'https://github.com/fawwaz2828', array['Next.js', 'React', 'Supabase']::text[], null, 'outside', true, 0),
  ('Electrovice', 'Flutter mobile app built for INDES 2026 in Malaysia — GetX, Firebase & Mapbox. Development, UI/UX and QA. 🥇 1st Place.', 'Mobile Dev · 2026', 'Mobile', 'https://github.com/fawwaz2828', array['Flutter', 'Firebase', 'Mapbox']::text[], null, 'outside', true, 1),
  ('AI Fitness Coach', 'Native SwiftUI app analyzing posture & movement on-device with Apple Vision and Core ML, with AI coaching reports from a FastAPI multi-agent backend.', 'iOS App · 2026', 'iOS + AI', 'https://github.com/fawwaz2828', array['SwiftUI', 'Core ML', 'FastAPI']::text[], null, 'campus', true, 2),
  ('SNE-SPIMS', 'Student progress & information system for special-needs schools — role-based access, IEPs, therapy scheduling, parent–teacher messaging. Spring Boot 3, MySQL 8.', 'Web App · 2026', 'Enterprise web', 'https://github.com/fawwaz2828', array['Spring Boot', 'MySQL']::text[], null, 'campus', true, 3),
  ('FoodScan', 'SwiftUI calorie tracker with AI food analysis and personalized calorie goals.', 'iOS App · 2026', 'iOS + AI', 'https://github.com/fawwaz2828', array['SwiftUI', 'AI']::text[], null, 'campus', true, 4),
  ('CrimeWatch', 'Platform assessing crime-risk levels in tourist areas. Frontend in Next.js & TypeScript.', 'Frontend · 2025', 'Web', 'https://github.com/fawwaz2828', array['Next.js', 'TypeScript']::text[], null, 'campus', true, 5),
  ('larisinai.id', 'Landing page for an AI business assistant that helps businesses on WhatsApp & Instagram.', 'Freelance · 2025', 'Landing page', 'https://larisinai.id', array['Landing page', 'AI']::text[], null, 'outside', true, 6),
  ('Sustain Energy Solutions', 'E-commerce for smart lighting & installation services — PHP, MySQL', '', '', '', '{}', null, 'campus', false, 100),
  ('HerPathway', 'Mentoring platform for women in STEM — Java, MySQL', '', '', '', '{}', null, 'campus', false, 101),
  ('Maintance', 'Building maintenance management app — Figma prototype', '', '', '', '{}', null, 'campus', false, 102),
  ('DPM UII Website', 'Developed & managed the official site (dpm.uii.ac.id) — WordPress', '', '', '', '{}', null, 'outside', false, 103);

insert into public.timeline (kind, date_label, title, place, sort_order) values
  ('experience', '2026 — Now', 'Media & Creative Leader', 'Ikatan Mahasiswa Indonesia Xiaozhuang (IMIX)', 0),
  ('experience', '2025 — 2026', 'Freelance Web Developer', 'React interfaces, landing pages & WordPress sites', 1),
  ('experience', '2024 — 2025', 'Administration & Information Media Staff', 'DSJ DPM UII — content, live coverage & website', 2),
  ('experience', '2024 — 2025', 'Islamic Studies & Cadre Development', 'Himpunan Mahasiswa Islam FTI UII', 3),
  ('experience', '2024', 'PR Staff · INPUT & Security Staff · PESONA Ta''aruf', 'Universitas Islam Indonesia', 4),
  ('experience', 'Mar — May 2022', 'Administration & Operations Intern', 'Telkom Property', 5),
  ('education', 'Sep 2025 — Now', 'Nanjing Xiaozhuang University', 'B.Eng Software Engineering (2+2 Double Degree) · Nanjing, China', 0),
  ('education', '2023 — 2025', 'Universitas Islam Indonesia', 'Bachelor of Informatics · Yogyakarta', 1),
  ('education', '2020 — 2023', 'SMK Telkom Makassar', 'Vocational high school', 2);

insert into public.skills (group_name, items, sort_order) values
  ('Frontend', array['React', 'Next.js', 'TypeScript', 'Tailwind CSS']::text[], 0),
  ('Mobile', array['SwiftUI', 'Core ML', 'Flutter']::text[], 1),
  ('Backend', array['Java', 'Spring Boot', 'FastAPI', 'MySQL', 'Supabase', 'Firebase']::text[], 2),
  ('AI & Design', array['GPT-4o mini', 'A2A JSON-RPC 2.0', 'Figma', 'UI/UX Prototyping']::text[], 3);

insert into public.faq (question, answer, sort_order) values
  ('What are you looking for right now?', 'Internships and freelance projects in frontend development, UI/UX or mobile — remote or on-site.', 0),
  ('What''s your go-to stack?', 'Next.js, React and TypeScript with Tailwind for the web; SwiftUI or Flutter for mobile; Spring Boot or FastAPI on the backend; Figma for design.', 1),
  ('Can you work with AI features?', 'Yes — I''ve built on-device ML with Core ML and Apple Vision, and integrated LLMs like GPT-4o mini through multi-agent (A2A JSON-RPC 2.0) backends.', 2),
  ('Which languages do you speak?', 'Indonesian (native), English (fluent) and Mandarin (basic — improving every day in Nanjing).', 3);

