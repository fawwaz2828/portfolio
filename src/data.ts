export const navLinks = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];

export const stats = [
  { value: "2×", label: "Competition podiums in 2026" },
  { value: "10+", label: "Web, mobile & AI projects shipped" },
  { value: "3", label: "Languages — ID · EN · 中文" },
];

export const skills = [
  { group: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { group: "Mobile", items: ["SwiftUI", "Core ML", "Flutter"] },
  { group: "Backend", items: ["Java", "Spring Boot", "FastAPI", "MySQL", "Supabase"] },
  { group: "AI & Design", items: ["GPT-4o mini", "A2A JSON-RPC 2.0", "Figma", "UI/UX Prototyping"] },
];

export type Project = {
  name: string;
  desc: string;
  tag: string;
  label: string;
  href: string;
  /** Tech chips shown on the card */
  stack: string[];
  /** Optional screenshot, e.g. "/images/projects/kawalbijak.jpg". Falls back to a generated cover. */
  image?: string;
  /** Made for university coursework ("campus") or outside it (competitions, freelance, organisations) */
  scope: Scope;
};

export type Scope = "campus" | "outside";

const GITHUB = "https://github.com/fawwaz2828";

export const projects: Project[] = [
  {
    name: "KawalBijak",
    scope: "outside",
    stack: ["Next.js", "React", "Supabase"],
    desc: "Civic-tech platform making Indonesian fiscal & monetary policy accessible. Led the frontend — Next.js 15, React 19, Supabase. 🥈 2nd Place, Codelab TechSprint 2026.",
    tag: "Frontend Lead · 2026",
    label: "Civic-tech",
    href: GITHUB,
  },
  {
    name: "Electrovice",
    scope: "outside",
    stack: ["Flutter", "Firebase", "Mapbox"],
    desc: "Flutter mobile app built for INDES 2026 in Malaysia — GetX, Firebase & Mapbox. Development, UI/UX and QA. 🥇 1st Place.",
    tag: "Mobile Dev · 2026",
    label: "Mobile",
    href: GITHUB,
  },
  {
    name: "AI Fitness Coach",
    scope: "campus",
    stack: ["SwiftUI", "Core ML", "FastAPI"],
    desc: "Native SwiftUI app analyzing posture & movement on-device with Apple Vision and Core ML, with AI coaching reports from a FastAPI multi-agent backend.",
    tag: "iOS App · 2026",
    label: "iOS + AI",
    href: GITHUB,
  },
  {
    name: "SNE-SPIMS",
    scope: "campus",
    stack: ["Spring Boot", "MySQL"],
    desc: "Student progress & information system for special-needs schools — role-based access, IEPs, therapy scheduling, parent–teacher messaging. Spring Boot 3, MySQL 8.",
    tag: "Web App · 2026",
    label: "Enterprise web",
    href: GITHUB,
  },
  {
    name: "FoodScan",
    scope: "campus",
    stack: ["SwiftUI", "AI"],
    desc: "SwiftUI calorie tracker with AI food analysis and personalized calorie goals.",
    tag: "iOS App · 2026",
    label: "iOS + AI",
    href: GITHUB,
  },
  {
    name: "CrimeWatch",
    scope: "campus",
    stack: ["Next.js", "TypeScript"],
    desc: "Platform assessing crime-risk levels in tourist areas. Frontend in Next.js & TypeScript.",
    tag: "Frontend · 2025",
    label: "Web",
    href: GITHUB,
  },
  {
    name: "larisinai.id",
    scope: "outside",
    stack: ["Landing page", "AI"],
    desc: "Landing page for an AI business assistant that helps businesses on WhatsApp & Instagram.",
    tag: "Freelance · 2025",
    label: "Landing page",
    href: "https://larisinai.id",
  },
];

export const moreProjects: { name: string; desc: string; scope: Scope }[] = [
  { name: "Sustain Energy Solutions", desc: "E-commerce for smart lighting & installation services — PHP, MySQL", scope: "campus" },
  { name: "HerPathway", desc: "Mentoring platform for women in STEM — Java, MySQL", scope: "campus" },
  { name: "Maintance", desc: "Building maintenance management app — Figma prototype", scope: "campus" },
  { name: "DPM UII Website", desc: "Developed & managed the official site (dpm.uii.ac.id) — WordPress", scope: "outside" },
];

export type Entry = { date: string; title: string; place: string };

export const education: Entry[] = [
  { date: "Sep 2025 — Now", title: "Nanjing Xiaozhuang University", place: "B.Eng Software Engineering (2+2 Double Degree) · Nanjing, China" },
  { date: "2023 — 2025", title: "Universitas Islam Indonesia", place: "Bachelor of Informatics · Yogyakarta" },
  { date: "2020 — 2023", title: "SMK Telkom Makassar", place: "Vocational high school" },
];

export const experience: Entry[] = [
  { date: "2026 — Now", title: "Media & Creative Leader", place: "Ikatan Mahasiswa Indonesia Xiaozhuang (IMIX)" },
  { date: "2025 — 2026", title: "Freelance Web Developer", place: "React interfaces, landing pages & WordPress sites" },
  { date: "2024 — 2025", title: "Administration & Information Media Staff", place: "DSJ DPM UII — content, live coverage & website" },
  { date: "2024 — 2025", title: "Islamic Studies & Cadre Development", place: "Himpunan Mahasiswa Islam FTI UII" },
  { date: "2024", title: "PR Staff · INPUT & Security Staff · PESONA Ta'aruf", place: "Universitas Islam Indonesia" },
  { date: "Mar — May 2022", title: "Administration & Operations Intern", place: "Telkom Property" },
];

export const faq = [
  { q: "What are you looking for right now?", a: "Internships and freelance projects in frontend development, UI/UX or mobile — remote or on-site." },
  { q: "What's your go-to stack?", a: "Next.js, React and TypeScript with Tailwind for the web; SwiftUI or Flutter for mobile; Spring Boot or FastAPI on the backend; Figma for design." },
  { q: "Can you work with AI features?", a: "Yes — I've built on-device ML with Core ML and Apple Vision, and integrated LLMs like GPT-4o mini through multi-agent (A2A JSON-RPC 2.0) backends." },
  { q: "Which languages do you speak?", a: "Indonesian (native), English (fluent) and Mandarin (basic — improving every day in Nanjing)." },
];

export const contact = {
  email: "fawwazwibowo96@gmail.com",
  cv: "/FawwazAkbarWibowoCV.pdf",
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/fawwaz-wibowo-a69886448" },
    { label: "GitHub", href: "https://github.com/fawwaz2828" },
  ],
};
