import { useEffect, useMemo, useState } from "react";

const LINE_DELAY_MS = 2200;

export default function Act1FailBubble({ script }: { script: string[] }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showOopsie, setShowOopsie] = useState(false);

  const safeScript = useMemo(() => (script.length ? script : ["..."]), [script]);

  useEffect(() => {
    if (!safeScript.length) return;

    setVisibleCount(1);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    safeScript.slice(1).forEach((_, idx) => {
      const timeout = setTimeout(() => {
        setVisibleCount((prev) => Math.min(safeScript.length, prev + 1));
      }, (idx + 1) * LINE_DELAY_MS);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [safeScript]);

  useEffect(() => {
    if (!safeScript.length) return;
    if (visibleCount < safeScript.length) return;

    const timeout = setTimeout(() => setShowOopsie(true), 150);
    return () => clearTimeout(timeout);
  }, [safeScript.length, visibleCount]);

  const displayedLines = safeScript.slice(0, visibleCount);
  const isWaitingForMore = visibleCount < safeScript.length;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="h-9 w-9 rounded-full border-2 border-muted-foreground/60 border-t-transparent animate-spin" />
            <span className="absolute text-base">🐹</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 md:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black">
          {showOopsie ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-lg font-semibold text-white">
              oopsie!
            </div>
          ) : (
            <video
              src="/diffusion.mp4"
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
          )}
        </div>

        <div className="flex flex-col justify-start gap-2 font-mono text-xs text-muted-foreground">
          {displayedLines.map((line, idx) => {
            const isActive = idx === displayedLines.length - 1 && isWaitingForMore;

            return (
              <div
                key={`${idx}-${line}`}
                className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-left shadow-sm"
              >
                <span>{line}</span>
                {isActive && <span className="ml-1 inline-block animate-pulse">...</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
