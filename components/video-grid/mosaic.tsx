// components/video-grid/mosaic.tsx
import React from "react";
import type { VideoItem } from "@/types/video";
import VideoCard from "@/components/VideoCard";

type MosaicProps = {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
};

// Entry point used by VideoGrid
export function renderMosaic({ videos, onSelectId, className }: MosaicProps) {
  const count = videos.length;
  if (count === 0) return null;

  // === 2 items: split 50/50 (stack on mobile) ===
  if (count === 2) {
    return (
      <div className={className}>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onSelect={() => onSelectId(v.id)} />
          ))}
        </div>
      </div>
    );
  }

  // === 3 items: big left, two stacked right ===
if (count === 3) {
  const [big, topRight, bottomRight] = videos;
  return (
    <div className={className}>
      <div
        className="
          grid gap-6
          md:grid-cols-[2fr_1fr]
          md:grid-rows-2
        "
      >
        {/* Left: larger tile fills both rows (matches right stack + gap) */}
        <div className="md:row-span-2 md:h-full">
          <VideoCard video={big} fillHeight onSelect={() => onSelectId(big.id)} />
        </div>

        {/* Right: two stacked */}
        <div>
          <VideoCard video={topRight} onSelect={() => onSelectId(topRight.id)} />
        </div>
        <div>
          <VideoCard video={bottomRight} onSelect={() => onSelectId(bottomRight.id)} />
        </div>
      </div>
    </div>
  );
}
  // Fallback: simple responsive grid (we’ll enhance next for even/odd patterns)
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
