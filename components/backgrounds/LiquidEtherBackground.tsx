"use client";

import LiquidEther, { LiquidEtherProps } from "@/components/backgrounds/LiquidEther";

type LiquidEtherBackgroundProps = {
  settings?: Partial<LiquidEtherProps>;
};

const defaultSettings: LiquidEtherProps = {
  mouseForce: 9,
  cursorSize: 100,
  isViscous: true,
  viscous: 90,
  colors: ["#83d2ec", "#f9bef7", "#ec13da"],
  autoDemo: false,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  isBounce: false,
  resolution: 0.5,
};

export default function LiquidEtherBackground({
  settings,
}: LiquidEtherBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <LiquidEther {...defaultSettings} {...settings} />
    </div>
  );
}
