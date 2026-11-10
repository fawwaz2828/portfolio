import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";

type Props = { className?: string; children: ReactNode; tilt?: number };

const SPRING = { stiffness: 220, damping: 22 };

/**
 * Glass card that leans toward the pointer in 3D, with an accent spotlight that
 * follows the cursor and a rotating conic border (CSS: .spot / .glow-border).
 */
export default function SpotlightCard({ className = "", children, tilt = 8 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const rect = useRef<DOMRect | null>(null);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [tilt, -tilt]), SPRING);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-tilt, tilt]), SPRING);
  const glow = useSpring(0, { stiffness: 200, damping: 30 });

  const px = useTransform(mx, [0, 1], ["0%", "100%"]);
  const py = useTransform(my, [0, 1], ["0%", "100%"]);
  const background = useMotionTemplate`radial-gradient(380px circle at ${px} ${py}, rgba(239, 68, 68, 0.24), transparent 65%)`;

  const onEnter = () => {
    rect.current = ref.current!.getBoundingClientRect();
    glow.set(1);
  };
  const onMove = (e: PointerEvent) => {
    const r = rect.current;
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    glow.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`spot ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <motion.span className="spot__glow" style={{ background, opacity: glow }} aria-hidden="true" />
      {children}
    </motion.div>
  );
}
