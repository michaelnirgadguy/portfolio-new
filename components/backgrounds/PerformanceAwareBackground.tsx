"use client";

import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import LiquidEtherBackground from "@/components/backgrounds/LiquidEtherBackground";

const LazyLiquidEther = lazy(() => import("@/components/backgrounds/LiquidEther"));

type NavigatorWithPerformanceHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

function getShouldDisableLiquid() {
  if (typeof window === "undefined") return true;

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

  return prefersReducedMotion || isMobile || saveData || slowConnection || constrainedMemory || constrainedCpu;
}

export default function PerformanceAwareBackground() {
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [isLiquidReady, setIsLiquidReady] = useState(false);
  const [shouldDisableLiquid, setShouldDisableLiquid] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setIsDesignMode(params.get("mode") === "design");
      setShouldDisableLiquid(getShouldDisableLiquid());
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDesignMode || shouldDisableLiquid) {
      setIsLiquidReady(false);
      return;
    }

    const markReady = () => setIsLiquidReady(true);
    const fallbackId = window.setTimeout(markReady, 2200);
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
  }, [isDesignMode, shouldDisableLiquid]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const activePlayers = new Set<string>();
    const handleVideoPlayingChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ playerId?: string; isPlaying?: boolean }>;
      const playerId = customEvent.detail?.playerId;
      if (!playerId) return;

      if (customEvent.detail?.isPlaying) {
        activePlayers.add(playerId);
      } else {
        activePlayers.delete(playerId);
      }

      setIsVideoPlaying(activePlayers.size > 0);
    };

    window.addEventListener("mimsy:video:playing-change", handleVideoPlayingChange);
    return () => {
      window.removeEventListener("mimsy:video:playing-change", handleVideoPlayingChange);
    };
  }, []);

  const shouldRenderLiquid = !isDesignMode && isLiquidReady && !shouldDisableLiquid && !isVideoPlaying;

  const staticOpacity = useMemo(() => {
    if (isVideoPlaying || shouldDisableLiquid) return 0.72;
    return shouldRenderLiquid ? 0.35 : 0.6;
  }, [isVideoPlaying, shouldDisableLiquid, shouldRenderLiquid]);

  if (isDesignMode) {
    return (
      <Suspense fallback={null}>
        <LiquidEtherBackground deferUntilInteraction />
      </Suspense>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(131, 210, 236, 0.22), transparent 32%), radial-gradient(circle at 78% 24%, rgba(249, 190, 247, 0.2), transparent 30%), radial-gradient(circle at 54% 78%, rgba(236, 19, 218, 0.12), transparent 34%)",
          opacity: staticOpacity,
        }}
      />
      {shouldRenderLiquid ? (
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <LazyLiquidEther
              mouseForce={3}
              cursorSize={48}
              isViscous={false}
              viscous={20}
              iterationsViscous={0}
              iterationsPoisson={8}
              BFECC={false}
              colors={["#83d2ec", "#f9bef7", "#ec13da"]}
              autoDemo={false}
              autoSpeed={0.35}
              autoIntensity={0}
              isBounce={false}
              resolution={0.16}
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
