import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useSpring } from "motion/react";

type Mode = "idle" | "lock" | "label";

const LOCKABLE = "a, button, [role=button], label:has(> input[type=checkbox]), select, [data-cursor-lock]";
// Buttons always get the corners, however wide (e.g. full-width FAQ rows);
// the size cap only stops big image links from being boxed in
const BUTTONS = "button, [role=button], .btn-solid, .adm-btn, select";
const MAX_LOCK_W = 340;
const MAX_LOCK_H = 120;
const PAD = 8;
const SPRING = { stiffness: 520, damping: 38, mass: 0.6 };

/**
 * Targeting reticle: four accent corner brackets.
 * - idle: a small diamond trailing the pointer
 * - lock: snaps around every button and around links / pills, and tracks them as they move
 * - label: widens and shows a tag (from data-cursor-label) over big targets
 * - data-cursor-plain on an element keeps the normal cursor over it
 */
export default function Cursor() {
  // Re-evaluated on change (e.g. DevTools device mode, plugging in a mouse) so it never gets stuck off
  // Uses any-pointer (not the primary one): touchscreen laptops / tablet mode
  // report a coarse primary pointer even with a mouse attached. Also switches
  // on at the first real mouse move, whatever the media query says.
  const [enabled, setEnabled] = useState(() => matchMedia("(any-pointer: fine)").matches);
  useEffect(() => {
    const mq = matchMedia("(any-pointer: fine)");
    const sync = () => { if (mq.matches) setEnabled(true); };
    const onMouse = (e: PointerEvent) => { if (e.pointerType === "mouse") setEnabled(true); };
    sync();
    mq.addEventListener("change", sync);
    addEventListener("pointermove", onMouse, { passive: true });
    return () => { mq.removeEventListener("change", sync); removeEventListener("pointermove", onMouse); };
  }, []);
  const [mode, setMode] = useState<Mode>("idle");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const modeRef = useRef<Mode>("idle");
  const target = useRef<Element | null>(null);

  const px = useMotionValue(-100);
  const py = useMotionValue(-100);
  const bx = useSpring(-100, SPRING);
  const by = useSpring(-100, SPRING);
  const bw = useSpring(26, SPRING);
  const bh = useSpring(26, SPRING);

  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    html.classList.add("custom-cursor");

    const setM = (m: Mode) => {
      modeRef.current = m;
      setMode(m);
    };
    const move = (e: PointerEvent) => {
      px.set(e.clientX);
      py.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      setVisible(true);
      const el = e.target as Element;
      // Opt-out: plain cursor over elements marked data-cursor-plain
      if (el.closest?.("[data-cursor-plain]")) {
        target.current = null;
        setM("idle");
        return;
      }
      const labelled = el.closest?.("[data-cursor-label]");
      if (labelled) {
        target.current = null;
        setLabel(labelled.getAttribute("data-cursor-label") || "");
        setM("label");
        return;
      }
      const lockable = el.closest?.(LOCKABLE);
      if (lockable) {
        const r = lockable.getBoundingClientRect();
        const isButton = lockable.matches(BUTTONS);
        if ((isButton || r.width <= MAX_LOCK_W) && r.height <= MAX_LOCK_H) {
          target.current = lockable;
          setM("lock");
          return;
        }
      }
      target.current = null;
      setM("idle");
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setVisible(false);

    addEventListener("pointermove", move);
    addEventListener("pointerover", over);
    addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    html.addEventListener("pointerleave", leave);
    return () => {
      html.classList.remove("custom-cursor");
      removeEventListener("pointermove", move);
      removeEventListener("pointerover", over);
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
      html.removeEventListener("pointerleave", leave);
    };
  }, [enabled, px, py]);

  useAnimationFrame(() => {
    if (!enabled) return;
    const m = modeRef.current;
    if (m === "lock" && target.current) {
      const r = target.current.getBoundingClientRect();
      bx.set(r.left - PAD);
      by.set(r.top - PAD);
      bw.set(r.width + PAD * 2);
      bh.set(r.height + PAD * 2);
    } else {
      const s = m === "label" ? 74 : 26;
      bx.set(px.get() - s / 2);
      by.set(py.get() - s / 2);
      bw.set(s);
      bh.set(s);
    }
  });

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className={`reticle reticle--${mode}`}
        style={{ x: bx, y: by, width: bw, height: bh }}
        animate={{ rotate: mode === "idle" ? 45 : 0, scale: pressed ? 0.82 : 1, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", bounce: 0.3, visualDuration: 0.35 }}
        aria-hidden="true"
      >
        <i className="tl" />
        <i className="tr" />
        <i className="bl" />
        <i className="br" />
        <AnimatePresence>
          {mode === "label" && (
            <motion.span
              key="label"
              className="reticle__label"
              style={{ x: "-50%", y: "-50%" }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", bounce: 0.35, visualDuration: 0.25 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="cursor-dot"
        style={{ x: px, y: py }}
        animate={{ opacity: visible && mode !== "label" ? 1 : 0 }}
        aria-hidden="true"
      />
    </>
  );
}
