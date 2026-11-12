import { useEffect, useRef, type PointerEvent } from "react";

/**
 * christendijoux.com project preview: the image is shown as a halftone
 * version on a canvas. Hovering opens the original image through a circle
 * that grows from the pointer.
 *
 * The halftone is drawn as soon as the image has loaded, with no in-between
 * steps: the original colours are never on screen until the card is hovered.
 *
 * They ship pre-rendered "-halftone.png" files; here the halftone is drawn at
 * runtime (dot size from luminance, in the current --fg colour).
 */

type Props = { src: string; alt: string; className?: string; position?: "top" | "center" };

export default function PixelImage({ src, alt, className = "", position = "center" }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Uploaded covers live on another origin (Supabase Storage). Without CORS
    // the canvas is "tainted" and getImageData() throws, so the halftone never
    // draws. Ask for CORS first; if the host refuses (a pasted URL), load it
    // plainly and show grey 4px blocks instead of the halftone.
    const img = new Image();
    img.decoding = "async";
    let readable = true;
    const sameOrigin = new URL(src, location.href).origin === location.origin || src.startsWith("data:");
    if (!sameOrigin) img.crossOrigin = "anonymous";
    img.src = src;
    const small = document.createElement("canvas");
    const sctx = small.getContext("2d", { willReadFrequently: true })!;
    let loaded = false;

    // Source rect for an object-fit: cover crop
    const crop = (w: number, h: number) => {
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = w / s, sh = h / s;
      return [(img.naturalWidth - sw) / 2, position === "top" ? 0 : (img.naturalHeight - sh) / 2, sw, sh] as const;
    };

    const draw = () => {
      if (!loaded) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(box.clientWidth * dpr));
      const h = Math.max(1, Math.round(box.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const [sx, sy, sw, sh] = crop(w, h);
      ctx.clearRect(0, 0, w, h);

      if (!readable) {
        // No-CORS image: its pixels can't be read, so no halftone. Downsample
        // and scale up without smoothing, in grey so the colours stay hidden.
        const block = 4 * dpr;
        const cols = Math.max(1, Math.ceil(w / block)), rows = Math.max(1, Math.ceil(h / block));
        small.width = cols; small.height = rows;
        sctx.imageSmoothingEnabled = true;
        sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
        ctx.imageSmoothingEnabled = false;
        ctx.filter = "grayscale(1) contrast(1.2)";
        ctx.drawImage(small, 0, 0, cols, rows, 0, 0, cols * block, rows * block);
        ctx.filter = "none";
        return;
      }

      // Halftone: one dot per cell, radius from luminance
      const cell = 7 * dpr;
      const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
      small.width = cols; small.height = rows;
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      let px: Uint8ClampedArray;
      try { px = sctx.getImageData(0, 0, cols, rows).data; }
      catch { readable = false; draw(); return; } // tainted after all: fall back to pixels
      ctx.fillStyle = getComputedStyle(box).getPropertyValue("--fg").trim() || "#fff";
      ctx.beginPath();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
          const r = Math.sqrt(lum) * cell * 0.5;
          if (r < 0.4) continue;
          const cx = (x + 0.5) * cell, cy = (y + 0.5) * cell;
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };

    img.onload = () => { loaded = true; draw(); box.dataset.revealed = "true"; };
    // host sent no CORS headers: the CORS request fails, so reload without it
    img.onerror = () => {
      if (img.crossOrigin === null) return;
      img.onerror = null;
      readable = false;
      img.removeAttribute("crossorigin");
      img.src = src;
    };
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    // Halftone ink follows the theme
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => { ro.disconnect(); mo.disconnect(); img.onload = null; img.onerror = null; };
  }, [src, position]);

  // Hover circle grows from the pointer
  const track = (e: PointerEvent<HTMLDivElement>) => {
    const r = boxRef.current?.getBoundingClientRect();
    const el = imgRef.current;
    if (!r || !el) return;
    el.style.setProperty("--rx", `${e.clientX - r.left}px`);
    el.style.setProperty("--ry", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={boxRef} role="img" aria-label={alt} className={`pixel ${className}`} onPointerEnter={track} onPointerMove={track}>
      <canvas ref={canvasRef} className="pixel__canvas" aria-hidden="true" />
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={`pixel__reveal${position === "top" ? " pixel__reveal--top" : ""}`}
      />
      <span className="pixel__frame" aria-hidden="true" />
    </div>
  );
}
