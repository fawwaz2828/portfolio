import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Two-language copy (English / Simplified Chinese). The choice is saved in
 * localStorage and applied to <html lang> (index.html sets it before paint).
 */
export type Lang = "en" | "zh";
const KEY = "lang";

const en = {
  /** Display name (Chinese uses 方伟博) and the browser tab title */
  name: "Fawwaz Akbar Wibowo",
  docTitle: "Fawwaz Akbar Wibowo — Portfolio",
  nav: {
    about: "About",
    work: "Projects",
    stack: "Stack",
    contact: "Contact",
    menu: "Menu",
    close: "Close",
    home: "Home",
    changeLang: "Change language",
    cv: "Download CV",
  },
  hero: {
    lines: ["Locked in.", "Shipping soon."],
    notes: ["Frontend", "UI / UX", "Mobile", "AI"],
    status: "Open to work",
    role: "A software engineer",
    based: "based in Nánjīng",
  },
  about: {
    heading: "About me",
    paras: [
      "I'm Fawwaz, a Software Engineering student in Nanjing who designs and builds web and mobile apps, with a focus on clean interfaces, smooth interaction and the small details that make software feel right to use.",
      "My work spans frontend, UI/UX and AI: competition builds, client websites and side projects, each taken from the first sketch all the way to a shipped product.",
      "I care about how things feel as much as how they work, and I'm always looking for the next problem worth solving with good design and solid code.",
    ],
    more: "Read more",
    photoAlt: "Portrait of Fawwaz Akbar Wibowo",
  },
  work: {
    kicker: "Work",
    title: "Selected Projects",
    lead: "Web, mobile and AI work: competition builds, client sites and side projects, designed and shipped end to end.",
    hint: "Scroll",
    view: "View",
    viewProject: "View project",
    all: "All projects",
    preview: "Preview of",
    tech: "Technologies",
    /** Per-project overrides by project name; English uses data.ts as written */
    projects: {} as Record<string, { tag: string; desc: string }>,
  },
  stack: {
    label: "Tech stack",
    caption: "Frameworks, languages and tools I build with.",
  },
  // Loading screen (paraphrased from mariavasilyeva.com's "Loading the playlist" set)
  contact: {
    kicker: "Contact",
    title: ["Let's build", "something together"],
    lead: "Open to internships, freelance work and collaborations. Tell me about your idea and I'll get back to you.",
    email: "Write to me",
    cv: "Download CV",
    hint: "Keep scrolling",
    rights: "All rights reserved",
  },
  aboutPage: {
    kicker: "About",
    facts: [
      ["From", "Indonesia"],
      ["Based in", "Nanjing, China"],
      ["Studying", "B.Eng Software Engineering · Nanjing Xiaozhuang University"],
      ["Languages", "Indonesian · English · 中文"],
      ["Focus", "Frontend · UI/UX · Mobile · AI"],
      ["Status", "Open to internships & freelance"],
    ] as [string, string][],
    stats: ["Competition podiums in 2026", "Web, mobile & AI projects shipped", "Languages — ID · EN · 中文"],
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    faq: "Quick answers",
    cv: "Download CV",
  },
  projectsPage: {
    kicker: "Projects",
    lead: "Everything I've built, split by where it came from: coursework at university, and work outside campus — competitions, freelance and organisations.",
    campus: "Campus",
    campusDesc: "Built for university courses — apps, systems and prototypes from my Software Engineering and Informatics studies.",
    outside: "Outside campus",
    outsideDesc: "Competitions, freelance clients and student organisations.",
    more: "Also built",
    count: "projects",
  },
  login: {
    kicker: "Restricted",
    title: "Access",
    lead: "You found the hidden door. Members only beyond this point.",
    email: "Email",
    password: "Password",
    submit: "Enter",
    back: "Back to home",
    pending: "Login isn't connected yet. Come back soon.",
  },
  footer: {
    based: "Nanjing, CN · UTC+8",
    built: "Built with React & GSAP",
    top: "Back to top",
  },
  loader: {
    lines: ["Setting the stage", "hang tight for a moment", "tuning the final details", "Get ready to press start", "Enjoy the journey"],
  },
};
export type Dict = typeof en;

const zh: Dict = {
  name: "方伟博",
  docTitle: "方伟博 — 作品集",
  nav: {
    about: "关于",
    work: "项目",
    stack: "技术栈",
    contact: "联系",
    menu: "菜单",
    close: "关闭",
    home: "首页",
    changeLang: "切换语言",
    cv: "下载简历",
  },
  hero: {
    lines: ["全力以赴，", "即将上线。"],
    notes: ["前端", "UI / UX", "移动端", "AI"],
    status: "正在寻找机会",
    role: "软件工程师",
    based: "现居南京",
  },
  about: {
    heading: "关于我",
    paras: [
      "我是方伟博，在南京攻读软件工程，设计并开发网页与移动应用，专注于简洁的界面、流畅的交互，以及让软件用起来恰到好处的细节。",
      "我的工作涵盖前端、UI/UX 与 AI：竞赛项目、客户网站和个人项目，每一个都从第一张草图一路做到上线。",
      "我既在意产品好不好用，也在意它用起来的感觉，并一直在寻找下一个值得用好设计和扎实代码去解决的问题。",
    ],
    more: "了解更多",
    photoAlt: "方伟博的照片",
  },
  work: {
    kicker: "作品",
    title: "精选项目",
    lead: "网页、移动端与 AI 作品：竞赛项目、客户网站和个人项目，从设计到上线全程完成。",
    hint: "滚动",
    view: "查看",
    viewProject: "查看项目",
    all: "全部项目",
    preview: "项目预览：",
    tech: "技术",
    projects: {
      KawalBijak: {
        tag: "前端负责人 · 2026",
        desc: "让印尼财政与货币政策更易理解的公民科技平台。负责前端开发——Next.js 15、React 19、Supabase。🥈 Codelab TechSprint 2026 第二名。",
      },
      Electrovice: {
        tag: "移动开发 · 2026",
        desc: "为马来西亚 INDES 2026 打造的 Flutter 移动应用——GetX、Firebase 与 Mapbox。负责开发、UI/UX 与测试。🥇 第一名。",
      },
      "AI Fitness Coach": {
        tag: "iOS 应用 · 2026",
        desc: "原生 SwiftUI 应用，借助 Apple Vision 与 Core ML 在设备端分析姿态与动作，并由 FastAPI 多智能体后端生成 AI 训练报告。",
      },
      "SNE-SPIMS": {
        tag: "Web 应用 · 2026",
        desc: "面向特殊教育学校的学生成长与信息管理系统——基于角色的权限、个别化教育计划（IEP）、治疗排期与家校沟通。Spring Boot 3、MySQL 8。",
      },
      FoodScan: {
        tag: "iOS 应用 · 2026",
        desc: "SwiftUI 卡路里追踪应用，支持 AI 食物分析与个性化热量目标。",
      },
      CrimeWatch: {
        tag: "前端 · 2025",
        desc: "评估旅游区犯罪风险等级的平台。前端使用 Next.js 与 TypeScript。",
      },
      "larisinai.id": {
        tag: "自由职业 · 2025",
        desc: "一款 AI 商业助手的落地页，帮助商家在 WhatsApp 与 Instagram 上经营。",
      },
    },
  },
  stack: {
    label: "技术栈",
    caption: "我常用的框架、语言与工具。",
  },
  contact: {
    kicker: "联系",
    title: ["一起创造", "点什么吧"],
    lead: "欢迎实习、自由职业与合作邀请。告诉我你的想法，我会尽快回复。",
    email: "给我写信",
    cv: "下载简历",
    hint: "继续滚动",
    rights: "保留所有权利",
  },
  aboutPage: {
    kicker: "关于",
    facts: [
      ["来自", "印度尼西亚"],
      ["现居", "中国南京"],
      ["就读", "南京晓庄学院 · 软件工程（工学学士）"],
      ["语言", "印尼语 · 英语 · 中文"],
      ["方向", "前端 · UI/UX · 移动端 · AI"],
      ["状态", "寻找实习与自由职业机会"],
    ] as [string, string][],
    stats: ["2026 年竞赛获奖", "已上线的网页、移动端与 AI 项目", "语言：印尼语 · 英语 · 中文"],
    experience: "经历",
    education: "教育",
    skills: "技能",
    faq: "常见问题",
    cv: "下载简历",
  },
  projectsPage: {
    kicker: "项目",
    lead: "我做过的所有项目，按来源分为两类：大学课程中的项目，以及校外的竞赛、自由职业和学生组织项目。",
    campus: "校内项目",
    campusDesc: "为大学课程而做：软件工程与信息学学习中的应用、系统和原型。",
    outside: "校外项目",
    outsideDesc: "竞赛、自由职业客户与学生组织。",
    more: "其他作品",
    count: "个项目",
  },
  login: {
    kicker: "限制区域",
    title: "登录",
    lead: "你找到了隐藏的入口。此处仅限成员进入。",
    email: "邮箱",
    password: "密码",
    submit: "进入",
    back: "返回首页",
    pending: "登录功能尚未接入，敬请期待。",
  },
  footer: {
    based: "中国南京 · UTC+8",
    built: "使用 React 与 GSAP 构建",
    top: "回到顶部",
  },
  loader: {
    lines: ["正在布置舞台", "请稍候片刻", "打磨最后的细节", "准备好按下开始", "享受这段旅程"],
  },
};

const DICTS: Record<Lang, Dict> = { en, zh };

const read = (): Lang => {
  try { return localStorage.getItem(KEY) === "zh" ? "zh" : "en"; } catch { return "en"; }
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };
const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(read);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = DICTS[lang].docTitle;
    try { localStorage.setItem(KEY, lang); } catch { /* storage blocked: language applies for this visit */ }
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/**
 * Splits running text into the units the word-reveal animations use: words,
 * or single characters for Chinese. Chinese punctuation sticks to the
 * character before it (so "。" never starts a line), Latin runs such as
 * "UI/UX" stay whole, and spaces become non-breaking so they keep their width.
 */
const CJK_PUNCT = "，。、；：！？）」』”";
export const tokens = (text: string, lang: Lang) => {
  if (lang !== "zh") return text.split(" ");
  const out: string[] = [];
  for (const run of text.match(/[A-Za-z0-9/&+.\-]+|\s|./gu) ?? []) {
    if (CJK_PUNCT.includes(run) && out.length) out[out.length - 1] += run;
    else out.push(run === " " ? " " : run);
  }
  return out;
};
