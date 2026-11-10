const root = document.documentElement;
const topbar = document.querySelector(".topbar");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = window.gsap && window.ScrollTrigger && window.ScrollSmoother;

// Offset content below the fixed ticker + nav
const setTopbarH = () => root.style.setProperty("--topbar-h", topbar.offsetHeight + "px");
setTopbarH();
addEventListener("resize", setTopbarH);

// Greeting by time of day
const h = new Date().getHours();
document.getElementById("greet").textContent =
  h < 11 ? "Good morning" : h < 15 ? "Good afternoon" : h < 19 ? "Good evening" : "Hey night owl";

// Wrap each hero line in an inner span (for masked slide-up)
document.querySelectorAll(".hero__title .line").forEach((line) => {
  line.innerHTML = `<span class="inner">${line.innerHTML}</span>`;
});

// Split the about statement into words (keeps <em> styling)
function splitWords(el) {
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part);
        else {
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.append(s);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1) splitWords(node);
  });
}
const statement = document.querySelector(".about__statement");
splitWords(statement);

// Split text into per-character spans (opening scene)
function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  [...text].forEach((ch) => {
    const s = document.createElement("span");
    s.className = "c";
    s.textContent = ch === " " ? " " : ch;
    el.append(s);
  });
}
splitChars(document.querySelector(".stage__name"));
splitChars(document.querySelector(".stage__typed"));

// Rotating hero word (query after the wrap above)
const words = ["intuitive", "human", "smart", "alive", "effortless"];
const wordEl = document.getElementById("swap-word");
let wi = 0;
setInterval(() => {
  wordEl.classList.add("out");
  setTimeout(() => {
    wi = (wi + 1) % words.length;
    wordEl.textContent = words[wi];
    wordEl.classList.remove("out");
  }, 300);
}, 2200);

let smoother = null;

if (hasGSAP && !reduceMotion) {
  root.classList.add("gsap-on");
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // 1. Smooth, inertia-style scrolling
  smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.2,
    effects: true,
    smoothTouch: 0.1,
  });

  // 0. Opening scene — pinned while you scroll through it
  const stage = document.querySelector(".stage");
  const stageWords = gsap.utils.toArray(".stage__word");
  const nameChars = gsap.utils.toArray(".stage__name .c");
  const typedChars = gsap.utils.toArray(".stage__typed .c");

  gsap.set(stageWords.slice(1), { yPercent: 100, opacity: 0 });
  gsap.set(".stage__line", { scaleX: 0 });
  gsap.set(".stage__stop", { opacity: 0, y: 20 });
  gsap.set(".stage__photo", { clipPath: "inset(50% 50% 50% 50% round 24px)" });
  gsap.set(nameChars, { yPercent: 120, opacity: 0 });
  gsap.set(typedChars, { display: "none" });
  gsap.set(".stage__caret", { opacity: 0 });

  // First greeting rises in on page load
  gsap.from(stageWords[0], { yPercent: 60, opacity: 0, duration: 1.4, ease: "expo.out", delay: 0.2 });
  gsap.from(".stage__hint", { opacity: 0, y: 10, duration: 1, delay: 1 });

  const scene = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: { trigger: stage, start: "top top", end: "+=260%", pin: true, scrub: 1 },
  });
  scene
    // 你好 → halo → hello
    .to(stageWords[0], { yPercent: -100, opacity: 0, duration: 1 })
    .to(stageWords[1], { yPercent: 0, opacity: 1, duration: 1 }, "<")
    .to(".stage__hint", { opacity: 0, duration: 0.4 }, "<")
    .to(stageWords[1], { yPercent: -100, opacity: 0, duration: 1 }, "+=0.4")
    .to(stageWords[2], { yPercent: 0, opacity: 1, duration: 1 }, "<")
    // Route Makassar → Yogyakarta → Nanjing draws itself
    .to(".stage__line", { scaleX: 1, duration: 1.4, ease: "none" }, "<")
    .to(".stage__stop", { opacity: 1, y: 0, stagger: 0.45, duration: 0.4 }, "<")
    // Greeting & route leave, photo opens from the centre
    .to([stageWords[2], ".stage__route"], { opacity: 0, yPercent: -30, duration: 1 }, "+=0.4")
    .to(".stage__photo", { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.2 }, "<0.2")
    // Name pops up letter by letter
    .to(nameChars, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: "back.out(1.6)" }, "-=0.4")
    // Byline types itself out
    .set(".stage__caret", { opacity: 1 })
    .to(typedChars, { display: "inline", stagger: 0.03, duration: 0.01, ease: "none" })
    .to({}, { duration: 0.6 }); // short hold before unpinning

  // Subtle mouse parallax inside the scene
  const photoX = gsap.quickTo(".stage__photo", "x", { duration: 0.8, ease: "power3" });
  const photoY = gsap.quickTo(".stage__photo", "y", { duration: 0.8, ease: "power3" });
  const nameX = gsap.quickTo(".stage__name", "x", { duration: 0.8, ease: "power3" });
  stage.addEventListener("mousemove", (e) => {
    const dx = e.clientX / innerWidth - 0.5;
    const dy = e.clientY / innerHeight - 0.5;
    photoX(dx * 30); photoY(dy * 30); nameX(dx * -40);
  });

  // 2. Hero intro: lines slide up from behind a mask (now plays when the hero scrolls in)
  const intro = gsap.timeline({
    defaults: { ease: "expo.out" },
    scrollTrigger: { trigger: ".hero", start: "top 75%" },
  });
  intro
    .from(".hero__title .inner", { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0.15)
    .to(".hero .reveal", { opacity: 1, y: 0, duration: 1 }, 0)
    .from(".hero__photo", { scale: 0.6, rotate: -20, opacity: 0, duration: 1.2 }, 0.5);

  // 3. Hero title drifts up slightly while you scroll away (stays fully visible)
  gsap.fromTo(".hero__title", { yPercent: 0 }, {
    yPercent: -12, ease: "none", immediateRender: false,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.fromTo(".hero__photo", { yPercent: 0, rotate: -4 }, {
    yPercent: -40, rotate: 6, ease: "none", immediateRender: false,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // 4. About statement: words light up as you scroll through it
  gsap.fromTo(statement.querySelectorAll(".w"), { opacity: 0.12 }, {
    opacity: 1, stagger: 0.05, ease: "none",
    scrollTrigger: { trigger: statement, start: "top 85%", end: "bottom 45%", scrub: true },
  });

  // 5. Giant text slides sideways with scroll
  gsap.fromTo(".bigline__track", { xPercent: 0 }, {
    xPercent: -50, ease: "none",
    scrollTrigger: { trigger: ".bigline", start: "top bottom", end: "bottom top", scrub: 1 },
  });

  // 6. Everything else fades up in staggered batches
  const rest = gsap.utils.toArray(".reveal").filter((el) => !el.closest(".hero"));
  gsap.set(rest, { opacity: 0, y: 60 });
  ScrollTrigger.batch(rest, {
    start: "top 90%",
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" }),
  });

  // 7. Contact headline scales in as it arrives
  gsap.from(".contact__title", {
    scale: 0.75, transformOrigin: "left bottom", ease: "none",
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top 30%", scrub: true },
  });

  // 8. Footer name rises from below
  gsap.from(".footer__big", {
    yPercent: 70, ease: "none",
    scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
  });

  // Hide top bar when scrolling down, show when scrolling up
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => topbar.classList.toggle("hide", self.direction === 1 && self.scroll() > 300),
  });

  // Anchor links scroll smoothly through ScrollSmoother
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      smoother.scrollTo(target, true, `top ${topbar.offsetHeight}px`);
    });
  });

  // Opening FAQ / "more projects" changes page height
  document.querySelectorAll("details").forEach((d) =>
    d.addEventListener("toggle", () => ScrollTrigger.refresh())
  );
} else {
  // Fallback: simple reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

// Project hover preview following cursor
const preview = document.querySelector(".preview");
let px = 0, py = 0, tx = 0, ty = 0;
document.querySelectorAll(".project").forEach((p) => {
  p.addEventListener("mouseenter", () => {
    preview.style.background = p.dataset.color;
    preview.firstElementChild.textContent = p.dataset.label || "";
    preview.classList.add("show");
  });
  p.addEventListener("mouseleave", () => preview.classList.remove("show"));
});
addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
(function loop() {
  px += (tx - px) * 0.12;
  py += (ty - py) * 0.12;
  preview.style.left = px + "px";
  preview.style.top = py + "px";
  requestAnimationFrame(loop);
})();

// Theme toggle
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch (_) {}
document.querySelector(".theme-toggle").addEventListener("click", () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = isDark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
});

// Year
document.getElementById("year").textContent = new Date().getFullYear();
