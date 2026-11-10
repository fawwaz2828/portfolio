import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { faq } from "../data";

// Reveal: rows drop in from above, each one landing a beat after the last.
const drop: Variants = {
  hidden: { opacity: 0, y: -30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3, visualDuration: 0.5, delay: i * 0.09 },
  }),
};

function Item({ q, a, n }: { q: string; a: string; n: number }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${n}`;

  return (
    <motion.div
      className="faq__item"
      custom={n - 1}
      variants={drop}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      <button
        className="faq__q"
        aria-expanded={open}
        aria-controls={id}
        data-cursor-label={open ? "Close" : "Open"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="faq__n">{String(n).padStart(2, "0")}</span>
        {q}
        <motion.span
          className="faq__icon"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", bounce: 0.3, visualDuration: 0.3 }}
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            id={id}
            className="faq__a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, visualDuration: 0.35 }}
            onAnimationComplete={() => ScrollTrigger.refresh()}
            style={{ overflow: "hidden" }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Faq() {
  return (
    <section className="sec sec--dark faq" id="faq" data-tone="dark">
      <p className="label">(05) Quick answers</p>
      <div className="faq__list">
        {faq.map((item, i) => (
          <Item key={item.q} q={item.q} a={item.a} n={i + 1} />
        ))}
      </div>
    </section>
  );
}
