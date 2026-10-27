import type { ReactNode } from "react";
import { useReveal } from "./useReveal.js";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Adds `is-visible` once the element scrolls into view. The landing page uses
 * it for the hero route draw-in — its single authored motion — and nothing
 * else, so sections do not all fade in on arrival.
 */
export default function Reveal({ children, className = "" }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={(visible ? "is-visible " : "") + className}>
      {children}
    </div>
  );
}
