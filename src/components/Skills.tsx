import { motion, stagger, type Variants } from "motion/react";
import SpotlightCard from "./motion/SpotlightCard";
import { skills } from "../data";

// Reveal: cards flip up from lying flat, like panels standing up.
const flip: Variants = {
  hidden: { opacity: 0, rotateX: 60, y: 60 },
  show: (i: number) => ({
    opacity: 1,
    rotateX: 0,
    y: 0,
    transition: { type: "spring", bounce: 0.25, visualDuration: 0.8, delay: i * 0.1 },
  }),
};
// Pills inside each card de-blur in sequence.
const list: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.05, { startDelay: 0.35 }) } },
};
const pill: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", bounce: 0.2, visualDuration: 0.4 } },
};

export default function Skills() {
  return (
    <section className="sec sec--dark" id="skills" data-tone="dark">

      <p className="label">(03) Skills</p>
      <div className="skills">
        {skills.map((g, i) => (
          <motion.div
            key={g.group}
            custom={i}
            variants={flip}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            style={{ transformPerspective: 1000, transformOrigin: "50% 100%" }}
          >
            {/* Hover: 3D tilt toward the pointer with an accent spotlight */}
            <SpotlightCard className={`skills__group glass${i % 2 ? " glass--alt" : ""}`}>
              <h3>{g.group}</h3>
              <motion.ul className="services" variants={list}>
                {g.items.map((item) => (
                  <motion.li
                    key={item}
                    data-cursor-lock
                    variants={pill}
                    whileHover={{ x: -2, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
