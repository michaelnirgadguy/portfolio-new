"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const LazyLiquidEther = lazy(() => import("@/components/backgrounds/LiquidEther"));

type HslColor = {
  hue: number;
  saturation: number;
  lightness: number;
};

type DesignCssState = {
  accent: HslColor;
  backgroundLightness: number;
  foregroundLightness: number;
  borderLightness: number;
  radius: number;
  bubbleUserLightness: number;
  bubbleAssistantLightness: number;
  veilAlpha: number;
};

type LiquidDesignState = {
  mouseForce: number;
  cursorSize: number;
  isViscous: boolean;
  viscous: number;
  autoDemo: boolean;
  autoSpeed: number;
  autoIntensity: number;
  isBounce: boolean;
  resolution: number;
  colors: [string, string, string];
};

type PerformanceState = {
  hasProfile: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  isLowPower: boolean;
  saveData: boolean;
};

type NavigatorWithPerformanceHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

const defaultPerformanceState: PerformanceState = {
  hasProfile: false,
  prefersReducedMotion: false,
  isMobile: false,
  isLowPower: false,
  saveData: false,
};

const defaultCssState: DesignCssState = {
  accent: { hue: 267, saturation: 100, lightness: 77 },
  backgroundLightness: 99,
  foregroundLightness: 9,
  borderLightness: 92,
  radius: 14,
  bubbleUserLightness: 81,
  bubbleAssistantLightness: 98,
  veilAlpha: 0.62,
};

const defaultLiquidState: LiquidDesignState = {
  mouseForce: 9,
  cursorSize: 100,
  isViscous: true,
  viscous: 90,
  autoDemo: false,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  isBounce: false,
  resolution: 0.5,
  colors: ["#83d2ec", "#f9bef7", "#ec13da"],
};

const panelWidth = 368;

function Label({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-lg border border-border/70 bg-background/70 p-2" title={hint}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      </div>
      {children}
    </label>
  );
}

function clampPanelPosition(x: number, y: number) {
  if (typeof window === "undefined") return { x, y };

  const safeMargin = 8;
  const maxX = Math.max(safeMargin, window.innerWidth - panelWidth - safeMargin);
  const maxY = Math.max(safeMargin, window.innerHeight - 140);

  return {
    x: Math.min(Math.max(safeMargin, x), maxX),
    y: Math.min(Math.max(safeMargin, y), maxY),
  };
}

function getPerformanceState(): PerformanceState {
  const navigatorWithHints = window.navigator as NavigatorWithPerformanceHints;
  const connection = navigatorWithHints.connection;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile =
    window.matchMedia("(max-width: 767px)").matches || window.matchMedia("(pointer: coarse)").matches;
  const saveData = Boolean(connection?.saveData);
  const slowConnection = /(^|-)2g$/.test(connection?.effectiveType ?? "");
  const constrainedMemory =
    typeof navigatorWithHints.deviceMemory === "number" && navigatorWithHints.deviceMemory <= 4;
  const constrainedCpu =
    typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;

  return {
    hasProfile: true,
    prefersReducedMotion,
    isMobile,
    saveData,
    isLowPower: saveData || slowConnection || constrainedMemory || constrainedCpu,
  };
}

function addMediaQueryListener(query: MediaQueryList, listener: () => void) {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  query.addListener(listener);
  return () => query.removeListener(listener);
}

export default function LiquidEtherBackground({
  deferUntilInteraction = false,
}: {
  deferUntilInteraction?: boolean;
}) {
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [performanceState, setPerformanceState] = useState(defaultPerformanceState);
  const [isEffectReady, setIsEffectReady] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 64 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncDesignModeFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setIsDesignMode(params.get("mode") === "design");
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      originalPushState.apply(window.history, args);
      syncDesignModeFromUrl();
    };

    window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      originalReplaceState.apply(window.history, args);
      syncDesignModeFromUrl();
    };

    syncDesignModeFromUrl();
    window.addEventListener("popstate", syncDesignModeFromUrl);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", syncDesignModeFromUrl);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileWidthQuery = window.matchMedia("(max-width: 767px)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const syncPerformanceState = () => setPerformanceState(getPerformanceState());
    const removeReducedMotionListener = addMediaQueryListener(reducedMotionQuery, syncPerformanceState);
    const removeMobileWidthListener = addMediaQueryListener(mobileWidthQuery, syncPerformanceState);
    const removeCoarsePointerListener = addMediaQueryListener(coarsePointerQuery, syncPerformanceState);

    syncPerformanceState();

    return () => {
      removeReducedMotionListener();
      removeMobileWidthListener();
      removeCoarsePointerListener();
    };
  }, []);

  const shouldDisableEffect =
    !isDesignMode &&
    performanceState.hasProfile &&
    (performanceState.prefersReducedMotion || performanceState.isMobile || performanceState.saveData);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isDesignMode) {
      setIsEffectReady(true);
      return;
    }

    if (shouldDisableEffect) {
      setIsEffectReady(false);
      return;
    }

    if (!deferUntilInteraction) {
      setIsEffectReady(true);
      return;
    }

    if (isEffectReady) return;

    const markReady = () => setIsEffectReady(true);
    const fallbackId = window.setTimeout(markReady, 1800);
    const listenerOptions: AddEventListenerOptions = { once: true, passive: true };

    window.addEventListener("pointerdown", markReady, listenerOptions);
    window.addEventListener("keydown", markReady, { once: true });
    window.addEventListener("wheel", markReady, listenerOptions);
    window.addEventListener("touchstart", markReady, listenerOptions);

    return () => {
      window.clearTimeout(fallbackId);
      window.removeEventListener("pointerdown", markReady);
      window.removeEventListener("keydown", markReady);
      window.removeEventListener("wheel", markReady);
      window.removeEventListener("touchstart", markReady);
    };
  }, [deferUntilInteraction, isDesignMode, isEffectReady, shouldDisableEffect]);

  useEffect(() => {
    if (!isDesignMode || typeof window === "undefined") return;

    setPanelPosition((prev) => {
      const isAtDefault = prev.x === 16 && prev.y === 64;
      if (!isAtDefault) return prev;
      const suggestedX = Math.max(16, window.innerWidth - panelWidth - 16);
      return clampPanelPosition(suggestedX, 64);
    });
  }, [isDesignMode]);

  useEffect(() => {
    if (!isDraggingPanel || typeof window === "undefined") return;

    const onPointerMove = (event: PointerEvent) => {
      const nextX = event.clientX - dragOffsetRef.current.x;
      const nextY = event.clientY - dragOffsetRef.current.y;
      setPanelPosition(clampPanelPosition(nextX, nextY));
    };

    const stopDragging = () => {
      setIsDraggingPanel(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [isDraggingPanel]);

  const [cssState, setCssState] = useState(defaultCssState);
  const [liquidState, setLiquidState] = useState(defaultLiquidState);

  useEffect(() => {
    if (!isDesignMode) return;

    const root = document.documentElement;
    const accent = `${cssState.accent.hue} ${cssState.accent.saturation}% ${cssState.accent.lightness}%`;
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--background", `0 0% ${cssState.backgroundLightness}%`);
    root.style.setProperty("--foreground", `0 0% ${cssState.foregroundLightness}%`);
    root.style.setProperty("--border", `214 32% ${cssState.borderLightness}%`);
    root.style.setProperty("--radius", `${cssState.radius}px`);
    root.style.setProperty("--bubble-user-from", `267 96% ${cssState.bubbleUserLightness}% / 0.96`);
    root.style.setProperty(
      "--bubble-assistant-from",
      `210 26% ${cssState.bubbleAssistantLightness}% / 0.94`
    );
    root.style.setProperty("--background-veil-strong-alpha", `${cssState.veilAlpha}`);

    return () => {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--border");
      root.style.removeProperty("--radius");
      root.style.removeProperty("--bubble-user-from");
      root.style.removeProperty("--bubble-assistant-from");
      root.style.removeProperty("--background-veil-strong-alpha");
    };
  }, [cssState, isDesignMode]);

  const runtimeLiquidState = useMemo(() => {
    if (isDesignMode) return liquidState;

    const maxResolution = performanceState.isLowPower ? 0.25 : 0.35;

    return {
      ...liquidState,
      autoDemo: false,
      mouseForce: Math.min(liquidState.mouseForce, performanceState.isLowPower ? 4 : 6),
      cursorSize: Math.min(liquidState.cursorSize, performanceState.isLowPower ? 64 : 82),
      viscous: Math.min(liquidState.viscous, performanceState.isLowPower ? 45 : 60),
      autoIntensity: Math.min(liquidState.autoIntensity, performanceState.isLowPower ? 1 : 1.4),
      isBounce: false,
      resolution: Math.min(liquidState.resolution, maxResolution),
    };
  }, [isDesignMode, liquidState, performanceState.isLowPower]);

  const shouldRenderLiquid =
    isDesignMode || (performanceState.hasProfile && isEffectReady && !shouldDisableEffect);

  const onPanelDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
    setIsDraggingPanel(true);
  };

  const panel = useMemo(() => {
    if (!isDesignMode) return null;

    return (
      <aside
        className="pointer-events-auto fixed z-50 w-[23rem] max-w-[92vw] rounded-xl border border-border bg-card/95 text-xs shadow-xl backdrop-blur"
        style={{ left: `${panelPosition.x}px`, top: `${panelPosition.y}px` }}
      >
        <div
          className="flex cursor-move select-none items-center justify-between rounded-t-xl border-b border-border bg-muted/60 px-3 py-2"
          onPointerDown={onPanelDragStart}
          title="Drag to move this panel"
        >
          <h2 className="text-sm font-semibold">Design Lab</h2>
          <button
            type="button"
            className="cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:border-[hsl(var(--accent))]"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={() => {
              setCssState(defaultCssState);
              setLiquidState(defaultLiquidState);
            }}
          >
            Reset
          </button>
        </div>

        <div className="p-3">
          <p className="mb-3 text-[11px] text-muted-foreground">
            Live controls for key theme tokens and the Liquid Ether background. Open with
            <code className="mx-1 rounded bg-muted px-1 py-0.5">?mode=design</code>.
          </p>

          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
            <section className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Theme tokens
              </h3>

              <Label title="Accent hue" hint="Brand glow and highlight color.">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={cssState.accent.hue}
                  onChange={(e) =>
                    setCssState((prev) => ({
                      ...prev,
                      accent: { ...prev.accent, hue: Number(e.target.value) },
                    }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Accent saturation" hint="How vivid the accent color feels.">
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={cssState.accent.saturation}
                  onChange={(e) =>
                    setCssState((prev) => ({
                      ...prev,
                      accent: { ...prev.accent, saturation: Number(e.target.value) },
                    }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Accent lightness" hint="Controls accent brightness.">
                <input
                  type="range"
                  min={20}
                  max={90}
                  value={cssState.accent.lightness}
                  onChange={(e) =>
                    setCssState((prev) => ({
                      ...prev,
                      accent: { ...prev.accent, lightness: Number(e.target.value) },
                    }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Background lightness" hint="Overall page surface brightness.">
                <input
                  type="range"
                  min={2}
                  max={100}
                  value={cssState.backgroundLightness}
                  onChange={(e) =>
                    setCssState((prev) => ({ ...prev, backgroundLightness: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Foreground lightness" hint="Main text contrast level.">
                <input
                  type="range"
                  min={0}
                  max={98}
                  value={cssState.foregroundLightness}
                  onChange={(e) =>
                    setCssState((prev) => ({ ...prev, foregroundLightness: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Border lightness" hint="Card and panel edge visibility.">
                <input
                  type="range"
                  min={10}
                  max={98}
                  value={cssState.borderLightness}
                  onChange={(e) =>
                    setCssState((prev) => ({ ...prev, borderLightness: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Corner radius" hint="Global rounded look for cards/bubbles.">
                <input
                  type="range"
                  min={4}
                  max={28}
                  value={cssState.radius}
                  onChange={(e) => setCssState((prev) => ({ ...prev, radius: Number(e.target.value) }))}
                  className="w-full"
                />
              </Label>
              <Label title="User bubble lightness" hint="Brightness of user message gradient start.">
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={cssState.bubbleUserLightness}
                  onChange={(e) =>
                    setCssState((prev) => ({ ...prev, bubbleUserLightness: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label
                title="Assistant bubble lightness"
                hint="Brightness of Mimsy bubble gradient start."
              >
                <input
                  type="range"
                  min={10}
                  max={99}
                  value={cssState.bubbleAssistantLightness}
                  onChange={(e) =>
                    setCssState((prev) => ({
                      ...prev,
                      bubbleAssistantLightness: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Background veil alpha" hint="Strength of soft veil above background image.">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={cssState.veilAlpha}
                  onChange={(e) => setCssState((prev) => ({ ...prev, veilAlpha: Number(e.target.value) }))}
                  className="w-full"
                />
              </Label>
            </section>

            <section className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Liquid Ether
              </h3>

              <Label title="Mouse force" hint="How strongly pointer movement pushes fluid.">
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={liquidState.mouseForce}
                  onChange={(e) =>
                    setLiquidState((prev) => ({ ...prev, mouseForce: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Cursor size" hint="Radius of fluid interaction around pointer.">
                <input
                  type="range"
                  min={20}
                  max={260}
                  value={liquidState.cursorSize}
                  onChange={(e) =>
                    setLiquidState((prev) => ({ ...prev, cursorSize: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Viscosity" hint="Higher values make motion thicker/slower.">
                <input
                  type="range"
                  min={1}
                  max={120}
                  value={liquidState.viscous}
                  onChange={(e) => setLiquidState((prev) => ({ ...prev, viscous: Number(e.target.value) }))}
                  className="w-full"
                />
              </Label>
              <Label
                title="Resolution"
                hint="Lower values improve performance, higher values sharpen detail."
              >
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={liquidState.resolution}
                  onChange={(e) =>
                    setLiquidState((prev) => ({ ...prev, resolution: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Auto speed" hint="Pace of autonomous movement when demo mode is on.">
                <input
                  type="range"
                  min={0.1}
                  max={2.5}
                  step={0.05}
                  value={liquidState.autoSpeed}
                  onChange={(e) =>
                    setLiquidState((prev) => ({ ...prev, autoSpeed: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>
              <Label title="Auto intensity" hint="Strength of auto movement patterns.">
                <input
                  type="range"
                  min={0.5}
                  max={4}
                  step={0.1}
                  value={liquidState.autoIntensity}
                  onChange={(e) =>
                    setLiquidState((prev) => ({ ...prev, autoIntensity: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </Label>

              <div
                className="grid grid-cols-3 gap-2 rounded-lg border border-border/70 bg-background/70 p-2"
                title="Gradient palette for liquid effect."
              >
                {liquidState.colors.map((color, index) => (
                  <label key={index} className="text-[10px] text-muted-foreground">
                    Color {index + 1}
                    <input
                      type="color"
                      className="mt-1 block h-8 w-full cursor-pointer rounded border border-border bg-transparent"
                      value={color}
                      onChange={(e) => {
                        const nextColors = [...liquidState.colors] as [string, string, string];
                        nextColors[index] = e.target.value;
                        setLiquidState((prev) => ({ ...prev, colors: nextColors }));
                      }}
                    />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/70 bg-background/70 p-2 text-[11px]">
                <label className="flex items-center gap-2" title="Enable thicker fluid simulation.">
                  <input
                    type="checkbox"
                    checked={liquidState.isViscous}
                    onChange={(e) => setLiquidState((prev) => ({ ...prev, isViscous: e.target.checked }))}
                  />
                  Viscous mode
                </label>
                <label className="flex items-center gap-2" title="Adds bounce in the fluid velocity.">
                  <input
                    type="checkbox"
                    checked={liquidState.isBounce}
                    onChange={(e) => setLiquidState((prev) => ({ ...prev, isBounce: e.target.checked }))}
                  />
                  Bounce mode
                </label>
                <label
                  className="col-span-2 flex items-center gap-2"
                  title="Background animates itself without pointer movement."
                >
                  <input
                    type="checkbox"
                    checked={liquidState.autoDemo}
                    onChange={(e) => setLiquidState((prev) => ({ ...prev, autoDemo: e.target.checked }))}
                  />
                  Auto demo mode
                </label>
              </div>
            </section>
          </div>
        </div>
      </aside>
    );
  }, [cssState, isDesignMode, liquidState, panelPosition]);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at 18% 18%, rgba(131, 210, 236, 0.22), transparent 32%), radial-gradient(circle at 78% 24%, rgba(249, 190, 247, 0.2), transparent 30%), radial-gradient(circle at 54% 78%, rgba(236, 19, 218, 0.12), transparent 34%)",
            opacity: shouldRenderLiquid ? 0.35 : 0.72,
          }}
        />
        {shouldRenderLiquid ? (
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <LazyLiquidEther
                mouseForce={runtimeLiquidState.mouseForce}
                cursorSize={runtimeLiquidState.cursorSize}
                isViscous={runtimeLiquidState.isViscous}
                viscous={runtimeLiquidState.viscous}
                colors={runtimeLiquidState.colors}
                autoDemo={runtimeLiquidState.autoDemo}
                autoSpeed={runtimeLiquidState.autoSpeed}
                autoIntensity={runtimeLiquidState.autoIntensity}
                isBounce={runtimeLiquidState.isBounce}
                resolution={runtimeLiquidState.resolution}
              />
            </Suspense>
          </div>
        ) : null}
      </div>
      {panel}
    </>
  );
}
