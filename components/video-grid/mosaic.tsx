// components/video-grid/mosaic.tsx
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * Returns the correct mosaic for the given videos.
 * For now: exact 2 and exact 3. Others fallback to simple grid (to be upgraded next step).
 */
export function renderMosaic({
  videos,
  onSelectId,
  className,
}: {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
}) {
  // 2 items → 50/50 split
  if (videos.length === 2) {
    return (
      <div className={className}>
        <div className="grid gap-6 sm:grid-cols-2">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={() => onSelectId(v.id)} />
          ))}
        </div>
      </div>
    );
  }

// 3 items → DEBUG: measure heights of hero vs right column
if (videos.length === 3) {
  return (
    <ThreeMosaicDebug
      videos={videos}
      onSelectId={onSelectId}
      className={className}
    />
  );
}

// ---- Enhanced DEBUG: measure inner cards + gap ----

function ThreeMosaicDebug({
  videos,
  onSelectId,
  className,
}: {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
}) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const topCardRef = useRef<HTMLDivElement | null>(null);
  const bottomCardRef = useRef<HTMLDivElement | null>(null);
  const gapRef = useRef<HTMLDivElement | null>(null);

  const [heroH, setHeroH] = useState(0);
  const [rightH, setRightH] = useState(0);
  const [topH, setTopH] = useState(0);
  const [bottomH, setBottomH] = useState(0);
  const [gapH, setGapH] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      setHeroH(heroRef.current?.getBoundingClientRect().height ?? 0);
      setRightH(rightRef.current?.getBoundingClientRect().height ?? 0);
      setTopH(topCardRef.current?.getBoundingClientRect().height ?? 0);
      setBottomH(bottomCardRef.current?.getBoundingClientRect().height ?? 0);

      // read computed margin on the spacer div (your mt-6)
      const gapEl = gapRef.current;
      if (gapEl) {
        const cs = getComputedStyle(gapEl);
        // margin-top + height (height is 0; we want the visual white space)
        const mt = parseFloat(cs.marginTop || "0");
        const h = gapEl.getBoundingClientRect().height || 0;
        setGapH(mt + h);
      } else {
        setGapH(0);
      }
    };

    const ro = new ResizeObserver(update);
    [heroRef, rightRef, topCardRef, bottomCardRef].forEach((r) => {
      if (r.current) ro.observe(r.current);
    });
    window.addEventListener("resize", update);
    // initial
    update();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const rightSum = Math.round(topH + gapH + bottomH);
  const delta = Math.round(heroH - rightH);
  const deltaInner = Math.round(heroH - rightSum);

  return (
    <div className={className}>
      <div className="relative">
        {/* on-screen badge (live numbers) */}
        <div className="pointer-events-none absolute right-0 top-[-2.2rem] z-10 rounded-md border bg-white/95 px-2 py-1 text-xs shadow-sm">
          hero: {Math.round(heroH)} | right: {Math.round(rightH)} | Δ: {delta}
          {"  "}|| top: {Math.round(topH)} + gap: {Math.round(gapH)} + bot: {Math.round(bottomH)} = {rightSum} (Δinner: {deltaInner})
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* HERO */}
          <div ref={heroRef} className="sm:col-span-2 sm:row-span-2">
            <VideoCard video={videos[0]} onSelect={() => onSelectId(videos[0].id)} />
          </div>

          {/* RIGHT column */}
          <div ref={rightRef} className="sm:col-span-1 sm:row-span-2 flex flex-col">
            <div ref={topCardRef}>
              <VideoCard video={videos[1]} onSelect={() => onSelectId(videos[1].id)} />
            </div>

            {/* This is the visual gap between cards (mt-6). We measure it. */}
            <div ref={gapRef} className="mt-6" />

            <div ref={bottomCardRef}>
              <VideoCard video={videos[2]} onSelect={() => onSelectId(videos[2].id)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




  // Fallback (we’ll replace in next step with even/odd chunking rules)
  return (
    <div className={className}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} onSelect={() => onSelectId(v.id)} />
        ))}
      </div>
    </div>
  );
}
