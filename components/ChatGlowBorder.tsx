// components/ChatGlowBorder.tsx
"use client";

import { useRef, useLayoutEffect, useState } from "react";

type Props = { active: boolean };

export default function ChatGlowBorder({ active }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Measure the pill shape in real pixels  
  useLayoutEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };

    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  if (!active) {
    return <div ref={ref} className="absolute inset-0" />;
  }

  const r = size.h / 2; // radius = half height
  const pathLen = (size.w - size.h) + Math.PI * size.h; // capsule perimeter midline

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
      >
        <rect
          x="1"
          y="1"
          width={size.w - 2}
          height={size.h - 2}
          rx={r}
          ry={r}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          pathLength={pathLen}
          strokeDasharray={`${pathLen * 0.12} ${pathLen * 0.88}`} // 12% bright segment
          style={{
            filter: "drop-shadow(0 0 6px hsl(var(--accent)))",
          }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to={-2 * pathLen}
            dur="2.8s"
            repeatCount="1"
            fill="freeze"
          />

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
