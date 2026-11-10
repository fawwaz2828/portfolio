import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

type Props = { text: string; className?: string; style?: CSSProperties };

/**
 * Paragraph whose lines slide up from behind a mask the first time it scrolls
 * into view. SplitText's autoSplit re-measures lines on resize / font load.
 */
export default function RevealLines({ text, className, style }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            duration: 0.5,
            ease: "power1.inOut",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          }),
      });
      return () => split.revert();
    },
    { scope: ref }
  );

  return (
    <p ref={ref} className={className} style={style}>
      {text}
    </p>
  );
}
