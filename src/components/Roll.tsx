import type { AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { text: string };

/** Link whose label rolls up to reveal an accent-coloured copy on hover. */
export default function Roll({ text, className = "", ...rest }: Props) {
  return (
    <a {...rest} className={`roll ${className}`.trim()} data-text={text}>
      <span>{text}</span>
    </a>
  );
}
