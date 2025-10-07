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

// 3 items → measured spacer to align bottoms exactly
if (videos.length === 3) {
  return (
    <ThreeMosaic
      videos={videos}
      onSelectId={onSelectId}
      className={className}
    />
  );
}


function ThreeMosaic({
  videos,
  onSelectId,
  className,
}: {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
}) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const colRef = useRef<HTMLDivElement | null>(null);
  const GAP_Y = 24; // Tailwind gap-6
  const [spacer, setSpacer] = useState(GAP_Y);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const h = heroRef.current?.offsetHeight ?? 0;
      const c = colRef.current?.offsetHeight ?? 0;
      const delta = h - c; // how much we need to push bottom card down
      setSpacer(Math.max(GAP_Y + delta, 0));
    });
    if (heroRef.current) ro.observe(heroRef.current);
    if (colRef.current) ro.observe(colRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={className}>
      <div className="grid gap-6 sm:grid-cols-3">
        {/* HERO */}
        <div ref={heroRef} className="sm:col-span-2 sm:row-span-2">
          <VideoCard video={videos[0]} onSelect={() => onSelectId(videos[0].id)} />
        </div>

        {/* RIGHT column: stack with measured spacer */}
        <div ref={colRef} className="sm:col-span-1 sm:row-span-2 flex flex-col">
          <VideoCard video={videos[1]} onSelect={() => onSelectId(videos[1].id)} />
          <div style={{ height: spacer }} aria-hidden />
          <VideoCard video={videos[2]} onSelect={() => onSelectId(videos[2].id)} />
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
