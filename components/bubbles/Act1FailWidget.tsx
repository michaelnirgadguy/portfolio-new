"use client";

import { useEffect, useMemo, useState } from "react";
import { usePendingDots } from "@/hooks/useChatHooks";

type Act1FailWidgetProps = {
  script: string[];
  lineDelayMs?: number;
};

const DEFAULT_DELAY = 2200;

export default function Act1FailWidget({ script, lineDelayMs = DEFAULT_DELAY }: Act1FailWidgetProps) {
  const safeScript = useMemo(() => (script.length ? script : []), [script]);
  const [visibleCount, setVisibleCount] = useState(safeScript.length ? 1 : 0);
  const [showVideo, setShowVideo] = useState(true);
  const dots = usePendingDots(visibleCount > 0 && visibleCount < safeScript.length);

  useEffect(() => {
    setVisibleCount(safeScript.length ? 1 : 0);
    setShowVideo(true);
  }, [safeScript]);

  useEffect(() => {
    if (!safeScript.length || visibleCount === 0) return;

    if (visibleCount < safeScript.length) {
      const timer = window.setTimeout(() => setVisibleCount((prev) => prev + 1), lineDelayMs);
      return () => window.clearTimeout(timer);
    }

    setShowVideo(false);
  }, [lineDelayMs, safeScript.length, visibleCount]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center border-b border-border px-3 py-1 text-sm text-muted-foreground">
        <div className="hamster-wheel hamster-wheel--tiny" aria-label="hamster wheel spinning" />
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black">
          {showVideo ? (
            <video
              src="/diffusion.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black text-lg font-semibold text-white">
              oopsie!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 font-mono text-sm text-muted-foreground">
          {safeScript.map((line, idx) => {
            if (idx >= visibleCount) return null;

            const isActive = idx === visibleCount - 1 && visibleCount < safeScript.length;

            return (
              <div key={line + idx} className="rounded-md bg-muted/30 px-3 py-2">
                <span>{line}</span>
                {isActive ? <span className="inline-block w-4 text-muted-foreground">{".".repeat(dots)}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
