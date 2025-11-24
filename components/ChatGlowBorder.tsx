// components/ChatGlowBorder.tsx
"use client";

type ChatGlowBorderProps = {
  /** Whether the glow animation should be visible / running */
  active: boolean;
};

export default function ChatGlowBorder({ active }: ChatGlowBorderProps) {
  if (!active) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="97"
        rx="50"
        ry="50"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        pathLength={100}
        strokeDasharray="12 88" // bright segment length vs gap
        style={{
          filter: "drop-shadow(0 0 6px hsl(var(--accent)))",
        }}
      >
        {/* 2 full laps */}
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-200"        // 2 * pathLength (100) = 2 rotations
          dur="2.8s"        // 1.4s per lap like before
          repeatCount="1"
          fill="freeze"
        />

        {/* Then fade out completely */}
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
  );
}
