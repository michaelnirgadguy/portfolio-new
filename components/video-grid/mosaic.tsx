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

// ---- add below in the same file (temporary debug component) ----

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
  const [heroH, setHeroH] = useState(0);
  const [rightH, setRightH] = useState(0);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      setHeroH(heroRef.current?.getBoundingClientRect().height ?? 0);
      setRightH(rightRef.current?.getBoundingClientRect().height ?? 0);
    });
    if (heroRef.current) ro.observe(heroRef.current);
    if (rightRef.current) ro.observe(rightRef.current);
    // also listen to window resize for safety
    const onWin = () => {
      setHeroH(heroRef.current?.getBoundingClientRect().height ?? 0);
      setRightH(rightRef.current?.getBoundingClientRect().height ?? 0);
    };
    window.addEventListener("resize", onWin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, []);

  const delta = Math.round(heroH - rightH); // + means right is shorter, - means right is taller

  return (
    <div className={className}>
      <div className="relative">
        {/* on-screen badge */}
        <div className="pointer-events-none absolute right-0 top-[-2rem] z-10 rounded-md border bg-white/90 px-2 py-1 text-xs shadow-sm">
          hero: {Math.round(heroH)}px | right: {Math.round(rightH)}px | Δ: {delta}px
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* HERO (measure this wrapper) */}
          <div ref={heroRef} className="sm:col-span-2 sm:row-span-2 outline-1 -outline-offset-1 outline-transparent">
            <VideoCard video={videos[0]} onSelect={() => onSelectId(videos[0].id)} />
          </div>

          {/* RIGHT COLUMN (measure this wrapper) */}
          <div ref={rightRef} className="sm:col-span-1 sm:row-span-2 flex flex-col">
            <VideoCard video={videos[1]} onSelect={() => onSelectId(videos[1].id)} />
            <div className="mt-6" />
            <VideoCard video={videos[2]} onSelect={() => onSelectId(videos[2].id)} />
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
