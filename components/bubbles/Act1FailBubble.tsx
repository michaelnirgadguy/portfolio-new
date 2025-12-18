"use client";

import { useEffect, useMemo, useState } from "react";
import { usePendingDots } from "@/hooks/useChatHooks";

const DEFAULT_LINE_DELAY_MS = 2200;

export default function Act1FailBubble({
  script,
  lineDelayMs = DEFAULT_LINE_DELAY_MS,
}: {
  script: string[];
  lineDelayMs?: number;
}) {
  const safeScript = useMemo(() => script.slice(0, 5), [script]);
  const [visibleCount, setVisibleCount] = useState(() =>
    safeScript.length ? 1 : 0
  );
  const [videoReplaced, setVideoReplaced] = useState(false);

  useEffect(() => {
    setVisibleCount(safeScript.length ? 1 : 0);
    setVideoReplaced(false);

    const timeouts: number[] = [];

    for (let i = 1; i < safeScript.length; i += 1) {
      timeouts.push(
        window.setTimeout(
          () => setVisibleCount((prev) => Math.min(prev + 1, safeScript.length)),
          i * lineDelayMs
        )
      );
    }

    if (safeScript.length) {
      timeouts.push(
        window.setTimeout(() => setVideoReplaced(true), safeScript.length * lineDelayMs)
      );
    }

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [lineDelayMs, safeScript]);

  const visibleLines = safeScript.slice(0, visibleCount);
  const animateDots = visibleCount > 0 && visibleCount < safeScript.length;
  const dots = usePendingDots(animateDots);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2">
        <div className="hamster-wheel hamster-wheel--small" aria-label="hamster wheel spinning" />
        <span className="sr-only">hamster wheel spinning</span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
        <div className="relative flex items-center justify-center">
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
            {videoReplaced ? (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                oopsie!
              </div>
            ) : (
              <video
                className="h-full w-full object-cover"
                src="/diffusion.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {visibleLines.map((line, idx) => {
            const isActive = idx === visibleLines.length - 1;
            const showDots = isActive && animateDots;

            return (
              <div
                key={`${line}-${idx}`}
                className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground shadow-inner"
              >
                <span>
                  {line}
                  {showDots ? (
                    <span aria-hidden className="inline-block w-6">
                      {".".repeat(dots)}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
