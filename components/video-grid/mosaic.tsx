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

  // === 3 items: big left, two stacked right (perfect height match) ===
  if (count === 3) {
    const [big, topRight, bottomRight] = videos;

    // Using Tailwind gap-6 (1.5rem). We set CSS vars:
    //   --g  = gap
    //   --C  = (16/9) * gap  (to convert vertical gap into equivalent width so heights match)
    //
    // Then set columns as:
    //   rightCol = (100% - (C + g)) / 3
    //   leftCol  = 2 * rightCol + C
    //
    // This ensures: height(left) == height(topRight) + gap + height(bottomRight)
  // Using Tailwind gap-6 (1.5rem)…
const style: React.CSSProperties & Record<string, string> = {
  // CSS custom properties for calc()
  ["--g"]: "1.5rem",
  ["--C"]: "calc(var(--g) * 16 / 9)",
  gridTemplateColumns:
    "calc((2 * (100% - (var(--C) + var(--g))) / 3) + var(--C)) calc((100% - (var(--C) + var(--g))) / 3)",
};


    return (
      <div className={className}>
        <div className="grid gap-6 md:auto-rows-auto" style={style}>
          {/* Left: large tile (natural 16:9) spans both rows */}
          <div className="row-span-2">
            <VideoCard video={big} onSelect={() => onSelectId(big.id)} />
          </div>

          {/* Right: two stacked (natural 16:9) */}
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

  // TODO next: even/odd batching (pairs and 3-up mosaics)
  // Fallback: simple responsive grid for now
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
