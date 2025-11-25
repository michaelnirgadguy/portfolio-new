// components/ChatGlowBorder.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type ChatGlowBorderProps = {
  active: boolean;
};

export default function ChatGlowBorder({ active }: ChatGlowBorderProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  // Measure the *parent* (the actual pill div) so the SVG matches it
  useEffect(() => {
    if (!overlayRef.current) return;
    const pill = overlayRef.current.parentElement; // parent is the pill container
    if (!pill) return;

    const update = () => {
      const rect = pill.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(pill);

    return () => ro.disconnect();
  }, []);

  // Always render the overlay div so we have a ref to measure from
  if (!size || !active) {
    return (
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10"
      />
    );
  }

  const { width, height } = size;

  // Radius for a rounded-full pill is basically half the height
  const radius = height / 2;

  // We draw a rectangle slightly larger than the pill:
  // - viewBox expanded by 6px (3px each side)
  // - rect positioned at (3,3) with width/height equal to pill size
  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-[-3px] z-10"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width + 6} ${height + 6}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect
          x={3}
          y={3}
          width={width}
          height={height}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          pathLength={100}
          strokeDasharray="14 86" // 14% bright segment, 86% gap
          style={{
            filter: "drop-shadow(0 0 10px hsl(var(--accent)))",
          }}
        >
          {/* 2 full laps around the pill */}
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-200"        // 2 * pathLength (100)
            dur="2.8s"        // 1.4s per lap
            repeatCount="1"
            fill="freeze"
          />

          {/* Then fade out */}
          <animate
            attributeName="opacity"
            from="1"
            to="0"
            begin="2.8s"
            dur="0.3s"
            fill="freeze"
          />
        </rect>
      </svg>
    </div>
  );
}
