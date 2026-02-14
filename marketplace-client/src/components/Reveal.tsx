"use client";

import React, { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * IntersectionObserver rootMargin.
   * Defaults to slightly reveal before fully in view.
   */
  rootMargin?: string;
  /**
   * IntersectionObserver threshold.
   */
  threshold?: number;
  /**
   * Optional transition delay (ms).
   */
  delayMs?: number;
};

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function Reveal({
  children,
  className,
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.18,
  delayMs,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isRevealed) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setIsRevealed(true);
          io.disconnect();
          break;
        }
      },
      { rootMargin, threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [isRevealed, rootMargin, threshold]);

  return (
    <div
      ref={ref}
      style={delayMs !== undefined ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cx(
        "opacity-0 translate-y-2 transition-all duration-700 ease-out",
        isRevealed && "opacity-100 translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}