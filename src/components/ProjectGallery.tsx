import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

/**
 * Project page gallery: one large image, arrows and thumbnails when there is
 * more than one, and a full-screen view on click (Esc closes, ← → browse).
 * The full-screen view is portalled to <body> because ScrollSmoother
 * transforms the page wrapper, which would break position: fixed inside it.
 */
type Labels = { prev: string; next: string; open: string; close: string; image: string };

export default function ProjectGallery({ images, alt, labels }: { images: string[]; alt: string; labels: Labels }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  // a different project (or a shorter list after an edit) starts at the first image
  useEffect(() => { setI(0); }, [images.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!full) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [full, go]);

  if (!n) return null;
  const many = n > 1;
  const count = `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  return (
    // keys inside the full-screen view are handled by its window listener (the
    // portal still bubbles React events up here, which would move twice)
    <div className="gal" onKeyDown={many && !full ? onKey : undefined}>
      <div className="gal__stage">
        <button type="button" className="gal__main" onClick={() => setFull(true)} aria-label={labels.open} data-cursor-label="+">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={images[i]}
              src={images[i]}
              alt={many ? `${alt} · ${labels.image} ${i + 1}` : alt}
              className="gal__img"
              decoding="async"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          </AnimatePresence>
        </button>
        {many && (
          <>
            <button type="button" className="gal__arrow gal__arrow--prev" onClick={() => go(-1)} aria-label={labels.prev}>←</button>
            <button type="button" className="gal__arrow gal__arrow--next" onClick={() => go(1)} aria-label={labels.next}>→</button>
            <span className="gal__count label" aria-live="polite">{count}</span>
          </>
        )}
      </div>

      {many && (
        <ul className="gal__thumbs">
          {images.map((src, j) => (
            <li key={src + j}>
              <button type="button" className={`gal__thumb${j === i ? " is-active" : ""}`} onClick={() => setI(j)} aria-label={`${labels.image} ${j + 1}`} aria-current={j === i}>
                <img src={src} alt="" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {createPortal(
        <AnimatePresence>
          {full && (
            <motion.div
              className="gal-full"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setFull(false)}
            >
              <img src={images[i]} alt={alt} className="gal-full__img" onClick={(e) => e.stopPropagation()} />
              <button type="button" className="gal-full__close" onClick={() => setFull(false)} aria-label={labels.close} autoFocus>✕</button>
              {many && (
                <>
                  <button type="button" className="gal__arrow gal__arrow--prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={labels.prev}>←</button>
                  <button type="button" className="gal__arrow gal__arrow--next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={labels.next}>→</button>
                  <span className="gal__count label">{count}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
