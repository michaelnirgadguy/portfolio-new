// components/video-grid/mosaic.tsx
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";

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

// 3 items → hero left (2×2), two stacked right with pixel-perfect alignment
if (videos.length === 3) {
  return (
    <div className={className}>
      {/* Keep a normal grid gap so overall gutters look nice */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* HERO: spans 2 rows — includes one row-gap visually */}
        <div className="sm:col-span-2 sm:row-span-2">
          <VideoCard video={videos[0]} onSelect={() => onSelectId(videos[0].id)} />
        </div>

        {/* RIGHT column: match hero height; fix inner math with a calibrated spacer */}
        <div className="sm:col-span-1 sm:row-span-2 grid grid-rows-[1fr_auto_1fr]">
          {/* top card */}
          <div>
            <VideoCard video={videos[1]} onSelect={() => onSelectId(videos[1].id)} />
          </div>

          {/*
            Spacer height = outer row gap (24px for gap-6) MINUS the extra vertical border we have
            on the right stack compared to the single hero card (≈2px).
            24px - 2px = 22px. Adjust here if your border width or gap scale changes.
          */}
          <div className="h-[22px]" aria-hidden />

          {/* bottom card */}
          <div>
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
