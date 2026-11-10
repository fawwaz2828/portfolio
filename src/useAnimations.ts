import type { RefObject } from "react";
import type { Lang } from "./i18n";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

/**
 * All scroll animations live here, in one context scoped to the app root,
 * so ScrollSmoother is created before every ScrollTrigger and everything
 * is reverted automatically on unmount.
 */
export function useAnimations(scope: RefObject<HTMLDivElement | null>, lang: Lang, page: string) {
  // Returned so a page change can tear everything down *before* React swaps
  // the DOM (pin-spacers wrap pinned sections and would break the unmount)
  return useGSAP(
    () => {
      const root = scope.current!;
      const html = document.documentElement;
      const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
      const topbar = q(".topbar");
      topbar.classList.remove("hide"); // a fresh page starts with the bar visible

      // Keep content below the fixed nav
      const setTopbarH = () => html.style.setProperty("--topbar-h", `${topbar.offsetHeight}px`);
      setTopbarH();
      addEventListener("resize", setTopbarH);

      // Navbar inverts to match whichever section sits under it
      gsap.utils.toArray<HTMLElement>("[data-tone]").forEach((sec) => {
        if (sec === topbar) return;
        ScrollTrigger.create({
          trigger: sec,
          start: () => `top ${topbar.offsetHeight}px`,
          end: () => `bottom ${topbar.offsetHeight}px`,
          onToggle: (self) => {
            if (self.isActive) topbar.dataset.tone = sec.dataset.tone;
          },
        });
      });

      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        // Simple fallback: reveal on scroll, no smoothing / pinning
        const io = new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("in");
                io.unobserve(e.target);
              }
            }),
          { threshold: 0.15 }
        );
        root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
        return () => {
          io.disconnect();
          removeEventListener("resize", setTopbarH);
        };
      }

      html.classList.add("gsap-on");

      // 1. Smooth, inertia-style scrolling
      const smoother = ScrollSmoother.create({
        wrapper: q("#smooth-wrapper"),
        content: q("#smooth-content"),
        smooth: 1.2,
        effects: true,
        smoothTouch: 0.1,
      });

      const has = (sel: string) => !!root.querySelector(sel);

      // 4. About statement: words light up as you scroll through it
      if (has(".about__statement")) {
        gsap.fromTo(".about__statement .w", { opacity: 0.12 }, {
          opacity: 1, stagger: 0.05, ease: "none",
          scrollTrigger: { trigger: ".about__statement", start: "top 85%", end: "bottom 45%", scrub: true },
        });
      }

      // 4b. Hero → intro transition (ported from jarnket.com's HeroStage):
      //     pin the hero; title lines split apart, small text lifts away, the
      //     portrait collapses like a pulled thread, then the intro text is
      //     "woven" in row by row, alternating direction like a shuttle.
      let aboutScroll: (() => number) | null = null; // where the "#about" link should land
      if (has(".hero__manifesto")) {
        const hero = q(".hero");
        const OPEN = "inset(0% 0% 0% 0%)";
        const closed = (row: number) => (row % 2 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)");
        const emit = (name: string) => () => { dispatchEvent(new Event(name)); };
        // Group each paragraph's words into visual rows, then alternate direction
        // across all rows: odd rows run right-to-left (the shuttle going back)
        const rowsOf = () => {
          const rows: HTMLElement[][] = [];
          gsap.utils.toArray<HTMLElement>(".about__para", hero).forEach((p) => {
            let top = NaN;
            p.querySelectorAll<HTMLElement>(".hero__word").forEach((el) => {
              if (el.offsetTop !== top) { rows.push([]); top = el.offsetTop; }
              rows[rows.length - 1].push(el);
            });
          });
          return rows.map((r, i) => (i % 2 ? [...r].reverse() : r));
        };

        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
          const rows = rowsOf();
          rows.forEach((r, i) => gsap.set(r, { clipPath: closed(i) }));
          gsap.set(".hero__manifesto", { autoAlpha: 0 });
          const n = 0.5 / Math.max(rows.length, 1);
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: hero, start: "top top", end: "+=160%", pin: true, scrub: 0.8, anticipatePin: 1 },
          })
            .fromTo([".hero__notes", ".hero__micro", ".hero__sword"], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, stagger: 0.03, duration: 0.2 }, 0)
            .to(".hero__line:nth-child(odd)", { xPercent: -60, autoAlpha: 0, duration: 0.3 }, 0.04)
            .to(".hero__line:nth-child(even)", { xPercent: 60, autoAlpha: 0, duration: 0.3 }, 0.04)
            // Scramble the heading as the stage appears (and reset when scrolling back past it)
            .call(emit("about:hide"), [], 0.27)
            .set(".hero__manifesto", { autoAlpha: 1 }, 0.28)
            .call(emit("about:reveal"), [], 0.28)
            .fromTo(".about__index", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: OPEN, duration: 0.12 }, 0.28)
            // Portrait wipes up from the bottom as the stage opens
            .fromTo(".about__photo", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: OPEN, duration: 0.3 }, 0.3)
            .fromTo(".about__photo img", { scale: 1.15 }, { scale: 1, duration: 0.45 }, 0.3);
          rows.forEach((r, i) => {
            tl.to(r, { clipPath: OPEN, duration: n, stagger: n / Math.max(r.length, 1) }, 0.34 + i * n);
          });
          // "Read more" button arrives once the last row is woven in
          tl.fromTo(".hero .about__more", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.34 + rows.length * n);
          tl.to({}, { duration: 0.1 }); // short hold at the end
          aboutScroll = () => tl.scrollTrigger!.end;
          return () => { aboutScroll = null; };
        });
        // Small screens: no pin, rows weave in as they scroll into view
        mm.add("(max-width: 767px)", () => {
          ScrollTrigger.create({
            trigger: ".about__heading", start: "top 85%",
            onEnter: emit("about:reveal"), onLeaveBack: emit("about:hide"),
          });
          gsap.fromTo(".about__photo", { clipPath: "inset(100% 0% 0% 0%)" }, {
            clipPath: OPEN, duration: 1, ease: "expo.out",
            scrollTrigger: { trigger: ".about__photo", start: "top 85%", once: true },
          });
          rowsOf().forEach((r, i) => {
            gsap.fromTo(r, { clipPath: closed(i) }, {
              clipPath: OPEN, duration: 0.5, stagger: 0.04, ease: "power1.inOut",
              scrollTrigger: { trigger: r[0], start: "top 88%", once: true },
            });
          });
        });
      }

      // 5. Featured work: pin the section and move the card track sideways
      //    while scrolling down. Created here, after ScrollSmoother, so the
      //    pin uses the right (transform) pin type.
      if (has(".work__track")) {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 1024px)", () => {
          const track = q(".work__track");
          const bar = q(".work__progress");
          const dist = () => Math.max(0, track.scrollWidth - innerWidth);
          const slide = gsap.to(track, {
            x: () => -dist(),
            ease: "none",
            scrollTrigger: {
              trigger: ".work",
              start: "top top",
              end: () => `+=${dist()}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (st) => { bar.style.transform = `scaleX(${st.progress})`; },
            },
          });
          const st = slide.scrollTrigger!;
          // Depth of field: the project in focus stays sharp, the others blur
          // and dim with their distance from their own resting stop
          const cards = gsap.utils.toArray<HTMLElement>(".pcard", track);
          const last = new Map<HTMLElement, number>();
          const focus = () => {
            if (!st.isActive && st.progress === 0 && last.size) return;
            const d = dist(), iw = innerWidth, scrolled = -(gsap.getProperty(track, "x") as number);
            for (const c of cards) {
              let stop = Math.min(d, Math.max(0, c.offsetLeft + c.offsetWidth / 2 - iw / 2));
              if (stop < iw * 0.3) stop = 0;          // intro + first project share the opening view
              if (d - stop < iw * 0.3) stop = d;
              const k = Math.min(1, Math.max(0, (Math.abs(scrolled - stop) - iw * 0.12) / (iw * 0.45)));
              const q = Math.round(k * 50) / 50;
              if (last.get(c) === q) continue;
              last.set(c, q);
              c.style.filter = q ? `blur(${(q * 7).toFixed(1)}px)` : "";
              c.style.opacity = q ? String(1 - q * 0.55) : "";
            }
          };
          gsap.ticker.add(focus);
          // Previews drift against the travel direction (christendijoux: xPercent 6 → -6)
          gsap.utils.toArray<HTMLElement>(".work [data-parallax]").forEach((el) => {
            gsap.fromTo(el, { xPercent: 6 }, {
              xPercent: -6, ease: "none",
              scrollTrigger: { trigger: el, containerAnimation: slide, start: "left right", end: "right left", scrub: true },
            });
          });
          return () => {
            gsap.ticker.remove(focus);
            cards.forEach((c) => { c.style.filter = ""; c.style.opacity = ""; });
          };
        });
      }

      // 5b. Contact: plain vertical scroll — pin the stage and feed the scroll
      //     progress to the glyph hands (rise → touch → shock ring)
      if (has(".contact__stage")) {
        const send = (p: number) => dispatchEvent(new CustomEvent("contact:progress", { detail: p }));
        ScrollTrigger.create({
          trigger: ".contact",
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: true,
          onUpdate: (st) => send(st.progress),
          onRefresh: (st) => send(st.progress),
        });
      }

      // 6. Everything else fades up in staggered batches
      const rest = gsap.utils.toArray<HTMLElement>(".reveal");
      if (rest.length) {
        gsap.set(rest, { opacity: 0, y: 60 });
        ScrollTrigger.batch(rest, {
          start: "top 90%",
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" }),
        });
      }


      // Hide top bar when scrolling down, show when scrolling up
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => topbar.classList.toggle("hide", self.direction === 1 && self.scroll() > 300),
      });

      // Anchor links scroll smoothly through ScrollSmoother
      const onClick = (e: MouseEvent) => {
        const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
        if (!a) return;
        // About lives inside the pinned hero: jump to the end of that transition
        if (a.getAttribute("href") === "#about" && aboutScroll) {
          e.preventDefault();
          smoother.scrollTo(aboutScroll(), true);
          return;
        }
        const target = document.querySelector(a.getAttribute("href")!);
        if (!target) return;
        e.preventDefault();
        smoother.scrollTo(target, true, `top ${topbar.offsetHeight}px`);
      };
      root.addEventListener("click", onClick);

      return () => {
        root.removeEventListener("click", onClick);
        removeEventListener("resize", setTopbarH);
        html.classList.remove("gsap-on");
        smoother.kill();
      };
    },
    // Text changes with the language and the page changes the DOM, so every
    // split / pin is rebuilt on either
    { scope, dependencies: [lang, page], revertOnUpdate: true }
  );
}
