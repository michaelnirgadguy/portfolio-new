"use client";

import LiquidEther from "@/components/backgrounds/LiquidEther";

export default function LiquidEtherBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <LiquidEther
        mouseForce={9}
        cursorSize={100}
        isViscous
        viscous={90}
        colors={["#83d2ec", "#f9bef7", "#ec13da"]}
        autoDemo={false}
        autoSpeed={0.5}
        autoIntensity={2.2}
        isBounce={false}
        resolution={0.5}
      />
    </div>
  );
}
