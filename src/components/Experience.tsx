import { motion, type Variants } from "motion/react";
import { education, experience, type Entry } from "../data";

// Reveal: entries slide in from their column's outer edge and come into focus.
const entry: Variants = {
  hidden: (side: number) => ({ opacity: 0, x: 60 * side, filter: "blur(10px)" }),
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", bounce: 0.15, visualDuration: 0.7 } },
  // Hover: nudge right while the accent bar grows down the left edge
  hover: { x: 12, transition: { type: "spring", bounce: 0.4, visualDuration: 0.3 } },
};
const bar: Variants = {
  hidden: { scaleY: 0 },
  show: { scaleY: 0 },
  hover: { scaleY: 1, transition: { type: "spring", bounce: 0, visualDuration: 0.3 } },
};

function Column({ heading, entries, side }: { heading: string; entries: Entry[]; side: -1 | 1 }) {
  return (
    <div className="timeline__col">
      <h3 className="timeline__heading">{heading}</h3>
      {entries.map((e) => (
        <motion.div
          className="entry"
          key={e.title + e.date}
          custom={side}
          variants={entry}
          initial="hidden"
          whileInView="show"
          whileHover="hover"
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        >
          <motion.span className="entry__bar" variants={bar} aria-hidden="true" />
          <span className="entry__date">{e.date}</span>
          <h4>{e.title}</h4>
          <p>{e.place}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function Experience() {
  return (
    <section className="sec sec--dark experience" id="experience" data-tone="dark">
      <p className="label">(04) Experience &amp; education</p>
      <div className="timeline">
        <Column heading="Education" entries={education} side={-1} />
        <Column heading="Work & leadership" entries={experience} side={1} />
      </div>
    </section>
  );
}
