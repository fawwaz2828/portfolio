import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

/**
 * While `active` is true, decodes `text` left to right: every `speed` ms,
 * `tick` more characters lock in and the rest flicker through random glyphs.
 * Re-runs each time `active` turns true again.
 */
export function useScramble(text: string, active: boolean, { speed = 30, tick = 0.6, delay = 0 } = {}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (!active || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }
    let id: ReturnType<typeof setInterval>;
    let progress = 0;
    const run = () => {
      id = setInterval(() => {
        const locked = Math.floor((progress += tick));
        if (locked >= text.length) {
          setOut(text);
          clearInterval(id);
          return;
        }
        setOut(
          Array.from(text)
            .map((ch, i) => (ch === " " ? " " : i < locked ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join("")
        );
      }, speed);
    };
    const t = setTimeout(run, delay);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [active, text, speed, tick, delay]);

  return out;
}
