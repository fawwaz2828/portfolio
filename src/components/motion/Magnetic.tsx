import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useSpring } from "motion/react";

const SPRING = { stiffness: 300, damping: 16, mass: 0.5 };

/** Pulls its child toward the cursor while hovered, then springs back. */
export default function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const rect = useRef<DOMRect | null>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);

  const onEnter = () => {
    rect.current = ref.current!.getBoundingClientRect();
  };
  const onMove = (e: PointerEvent) => {
    const r = rect.current;
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className="magnetic"
      style={{ x, y }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.span>
  );
}
