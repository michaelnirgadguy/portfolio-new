"use client";

import { useEffect, useMemo, useRef } from "react";

type LiquidEtherProps = {
  mouseForce?: number;
  cursorSize?: number;
  isViscous?: boolean;
  viscous?: number;
  colors?: string[];
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  isBounce?: boolean;
  resolution?: number;
};

const DEFAULT_COLORS = ["#83d2ec", "#f9bef7", "#ec13da"];

export default function LiquidEther({
  mouseForce = 9,
  cursorSize = 100,
  isViscous = true,
  viscous = 90,
  colors = DEFAULT_COLORS,
  autoDemo = false,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  isBounce = false,
  resolution = 0.5,
}: LiquidEtherProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const palette = useMemo(() => {
    return colors.length > 0 ? colors : DEFAULT_COLORS;
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    const cursor = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const scale = Math.max(0.25, resolution) * window.devicePixelRatio;
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      cursor.x = width / 2;
      cursor.y = height / 2;
      target.x = width / 2;
      target.y = height / 2;
    };

    updateSize();
    const handleResize = () => updateSize();
    window.addEventListener("resize", handleResize);

    const handlePointerMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (autoDemo) {
        const timeFactor = time * 0.001 * autoSpeed;
        target.x = width / 2 + Math.cos(timeFactor) * width * 0.15 * autoIntensity;
        target.y = height / 2 + Math.sin(timeFactor * 1.25) * height * 0.15 * autoIntensity;
      }

      const viscosity = isViscous ? Math.max(20, viscous) : 40;
      const followStrength = (mouseForce / 10) * (40 / viscosity);
      cursor.x += (target.x - cursor.x) * Math.min(1, followStrength * delta * 6);
      cursor.y += (target.y - cursor.y) * Math.min(1, followStrength * delta * 6);

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      const baseRadius = Math.max(60, cursorSize);
      const timeSeed = time * 0.001;
      palette.forEach((color, index) => {
        const offsetAngle = timeSeed * (0.6 + index * 0.2) + index * 2.1;
        const offsetRadius = baseRadius * (0.65 + index * 0.18);
        let centerX = cursor.x + Math.cos(offsetAngle) * width * 0.08;
        let centerY = cursor.y + Math.sin(offsetAngle * 1.2) * height * 0.08;

        if (isBounce) {
          centerX = Math.min(width, Math.max(0, centerX));
          centerY = Math.min(height, Math.max(0, centerY));
        }

        const gradient = context.createRadialGradient(
          centerX,
          centerY,
          offsetRadius * 0.1,
          centerX,
          centerY,
          offsetRadius,
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(centerX, centerY, offsetRadius, 0, Math.PI * 2);
        context.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [
    autoDemo,
    autoIntensity,
    autoSpeed,
    cursorSize,
    isBounce,
    isViscous,
    mouseForce,
    palette,
    resolution,
    viscous,
  ]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
