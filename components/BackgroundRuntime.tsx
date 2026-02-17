"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LiquidEtherBackground from "@/components/backgrounds/LiquidEtherBackground";
import type { LiquidEtherProps } from "@/components/backgrounds/LiquidEther";

type BackgroundRuntimeProps = {
  children: React.ReactNode;
};

type ThemeControls = {
  accentHue: number;
  accentSat: number;
  accentLight: number;
  backgroundLight: number;
  foregroundLight: number;
  borderLight: number;
  radius: number;
  veilAlpha: number;
  surfaceOneAlpha: number;
  surfaceTwoAlpha: number;
  shadowDepth: number;
};

type EtherControls = {
  mouseForce: number;
  cursorSize: number;
  viscous: number;
  resolution: number;
  autoDemo: boolean;
  autoSpeed: number;
  autoIntensity: number;
  isBounce: boolean;
  colorA: string;
  colorB: string;
  colorC: string;
};

const defaultTheme: ThemeControls = {
  accentHue: 267,
  accentSat: 100,
  accentLight: 77,
  backgroundLight: 99,
  foregroundLight: 9,
  borderLight: 92,
  radius: 14,
  veilAlpha: 0.62,
  surfaceOneAlpha: 0.78,
  surfaceTwoAlpha: 0.6,
  shadowDepth: 0.12,
};

const defaultEther: EtherControls = {
  mouseForce: 9,
  cursorSize: 100,
  viscous: 90,
  resolution: 0.5,
  autoDemo: false,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  isBounce: false,
  colorA: "#83d2ec",
  colorB: "#f9bef7",
  colorC: "#ec13da",
};

function applyTheme(controls: ThemeControls) {
  const root = document.documentElement;
  root.style.setProperty("--accent", `${controls.accentHue} ${controls.accentSat}% ${controls.accentLight}%`);
  root.style.setProperty("--background", `0 0% ${controls.backgroundLight}%`);
  root.style.setProperty("--foreground", `0 0% ${controls.foregroundLight}%`);
  root.style.setProperty("--border", `214 32% ${controls.borderLight}%`);
  root.style.setProperty("--radius", `${controls.radius}px`);
  root.style.setProperty("--background-veil-strong-alpha", controls.veilAlpha.toFixed(2));
  root.style.setProperty("--surface-1", `0 0% 100% / ${controls.surfaceOneAlpha.toFixed(2)}`);
  root.style.setProperty("--surface-2", `218 26% 96% / ${controls.surfaceTwoAlpha.toFixed(2)}`);
  root.style.setProperty("--shadow-md", `0 14px 36px rgba(15, 23, 42, ${controls.shadowDepth.toFixed(2)})`);
}

function clearTheme() {
  const root = document.documentElement;
  [
    "--accent",
    "--background",
    "--foreground",
    "--border",
    "--radius",
    "--background-veil-strong-alpha",
    "--surface-1",
    "--surface-2",
    "--shadow-md",
  ].forEach((token) => root.style.removeProperty(token));
}

export default function BackgroundRuntime({ children }: BackgroundRuntimeProps) {
  const searchParams = useSearchParams();
  const designMode = searchParams.get("mode") === "design";
  const [theme, setTheme] = useState<ThemeControls>(defaultTheme);
  const [ether, setEther] = useState<EtherControls>(defaultEther);

  useEffect(() => {
    if (!designMode) {
      clearTheme();
      return;
    }
    applyTheme(theme);
  }, [designMode, theme]);

  const etherSettings = useMemo<Partial<LiquidEtherProps>>(
    () => ({
      mouseForce: ether.mouseForce,
      cursorSize: ether.cursorSize,
      isViscous: true,
      viscous: ether.viscous,
      resolution: ether.resolution,
      autoDemo: ether.autoDemo,
      autoSpeed: ether.autoSpeed,
      autoIntensity: ether.autoIntensity,
      isBounce: ether.isBounce,
      colors: [ether.colorA, ether.colorB, ether.colorC],
    }),
    [ether],
  );

  return (
    <>
      <LiquidEtherBackground settings={etherSettings} />
      <main className="relative z-10 min-h-screen">{children}</main>
      {designMode ? (
        <aside className="fixed right-4 top-4 z-50 max-h-[90vh] w-[min(420px,calc(100vw-2rem))] overflow-auto rounded-2xl border border-white/60 bg-white/90 p-4 text-sm shadow-2xl backdrop-blur">
          <div className="mb-3">
            <h2 className="text-base font-semibold">Design Lab</h2>
            <p className="text-xs text-slate-600">Tune key global theme tokens and Liquid Ether background in real time.</p>
          </div>

          <section className="space-y-3 border-t border-slate-200 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Global CSS tokens</h3>
            <Slider label="Accent hue" hint="Main highlight color used for interactive emphasis." min={0} max={360} value={theme.accentHue} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, accentHue: value }))} />
            <Slider label="Accent saturation" hint="How vivid the accent color feels." min={0} max={100} value={theme.accentSat} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, accentSat: value }))} />
            <Slider label="Accent lightness" hint="Brightness of the accent color." min={0} max={100} value={theme.accentLight} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, accentLight: value }))} />
            <Slider label="Background lightness" hint="Base page surface brightness." min={85} max={100} value={theme.backgroundLight} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, backgroundLight: value }))} />
            <Slider label="Foreground lightness" hint="Primary text brightness." min={0} max={30} value={theme.foregroundLight} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, foregroundLight: value }))} />
            <Slider label="Border lightness" hint="Subtle border contrast around cards and controls." min={75} max={98} value={theme.borderLight} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, borderLight: value }))} />
            <Slider label="Corner radius" hint="Rounds cards and shared components." min={4} max={28} value={theme.radius} step={1} onChange={(value) => setTheme((prev) => ({ ...prev, radius: value }))} />
            <Slider label="Surface alpha (glass layer 1)" hint="Opacity of first glass gradient stop." min={0.2} max={1} value={theme.surfaceOneAlpha} step={0.01} onChange={(value) => setTheme((prev) => ({ ...prev, surfaceOneAlpha: value }))} />
            <Slider label="Surface alpha (glass layer 2)" hint="Opacity of second glass gradient stop." min={0.2} max={1} value={theme.surfaceTwoAlpha} step={0.01} onChange={(value) => setTheme((prev) => ({ ...prev, surfaceTwoAlpha: value }))} />
            <Slider label="Background veil alpha" hint="Strength of overlay used over the hero image layer." min={0.1} max={1} value={theme.veilAlpha} step={0.01} onChange={(value) => setTheme((prev) => ({ ...prev, veilAlpha: value }))} />
            <Slider label="Medium shadow strength" hint="Controls card depth for standard elevated elements." min={0.02} max={0.35} value={theme.shadowDepth} step={0.01} onChange={(value) => setTheme((prev) => ({ ...prev, shadowDepth: value }))} />
          </section>

          <section className="mt-4 space-y-3 border-t border-slate-200 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Liquid Ether background</h3>
            <Slider label="Mouse force" hint="How strongly pointer movement pushes fluid." min={0} max={40} step={1} value={ether.mouseForce} onChange={(value) => setEther((prev) => ({ ...prev, mouseForce: value }))} />
            <Slider label="Cursor size" hint="Interaction brush size in pixels." min={20} max={220} step={1} value={ether.cursorSize} onChange={(value) => setEther((prev) => ({ ...prev, cursorSize: value }))} />
            <Slider label="Viscosity" hint="Higher values make motion smoother and heavier." min={10} max={120} step={1} value={ether.viscous} onChange={(value) => setEther((prev) => ({ ...prev, viscous: value }))} />
            <Slider label="Resolution" hint="Higher resolution is sharper but heavier on GPU." min={0.2} max={1} step={0.05} value={ether.resolution} onChange={(value) => setEther((prev) => ({ ...prev, resolution: value }))} />
            <Slider label="Auto speed" hint="Speed of motion when auto demo is enabled." min={0.1} max={2} step={0.05} value={ether.autoSpeed} onChange={(value) => setEther((prev) => ({ ...prev, autoSpeed: value }))} />
            <Slider label="Auto intensity" hint="Strength of automatic movement path." min={0.5} max={4} step={0.1} value={ether.autoIntensity} onChange={(value) => setEther((prev) => ({ ...prev, autoIntensity: value }))} />
            <Toggle label="Enable auto demo" hint="Lets background animate without pointer input." checked={ether.autoDemo} onChange={(checked) => setEther((prev) => ({ ...prev, autoDemo: checked }))} />
            <Toggle label="Bounce wrapping" hint="Reflects fluid at edges for punchier movement." checked={ether.isBounce} onChange={(checked) => setEther((prev) => ({ ...prev, isBounce: checked }))} />
            <ColorRow label="Palette" hint="Three-color gradient used to tint fluid output." colors={[ether.colorA, ether.colorB, ether.colorC]} onChange={(index, color) => setEther((prev) => (index === 0 ? { ...prev, colorA: color } : index === 1 ? { ...prev, colorB: color } : { ...prev, colorC: color }))} />
          </section>

          <div className="mt-4 flex gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium" onClick={() => { setTheme(defaultTheme); setEther(defaultEther); }}>Reset defaults</button>
            <p className="self-center text-[11px] text-slate-500">Open without <code>?mode=design</code> to hide this panel.</p>
          </div>
        </aside>
      ) : null}
    </>
  );
}

type SliderProps = {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function Slider({ label, hint, min, max, step, value, onChange }: SliderProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-xs text-slate-600">{value}</span>
      </div>
      <p className="mb-1 text-[11px] text-slate-500">{hint}</p>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-violet-500" />
    </label>
  );
}

type ToggleProps = {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-2 py-2">
      <span>
        <span className="block font-medium text-slate-800">{label}</span>
        <span className="block text-[11px] text-slate-500">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-500" />
    </label>
  );
}

type ColorRowProps = {
  label: string;
  hint: string;
  colors: string[];
  onChange: (index: number, color: string) => void;
};

function ColorRow({ label, hint, colors, onChange }: ColorRowProps) {
  return (
    <div className="rounded-md border border-slate-200 px-2 py-2">
      <p className="font-medium text-slate-800">{label}</p>
      <p className="mb-2 text-[11px] text-slate-500">{hint}</p>
      <div className="flex gap-2">
        {colors.map((color, index) => (
          <input key={`${color}-${index}`} type="color" value={color} onChange={(event) => onChange(index, event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-transparent" />
        ))}
      </div>
    </div>
  );
}
