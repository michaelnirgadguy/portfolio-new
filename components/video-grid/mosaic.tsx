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

// === 3 items: big left, two stacked right (heights align exactly) ===
if (count === 3) {
  const [big, topRight, bottomRight] = videos;

  // We use gap-6 (1.5rem). Derive C = (16/9) * gap for perfect height match.
  const style = {
    // @ts-expect-error: custom CSS vars
    "--g": "1.5rem",
    // C = (16/9) * gap
    "--C": "calc(var(--g) * 16 / 9)",
    // WidthRight  = (100% - (C + g)) / 3
    // WidthLeft   = (2/3) * (100% - (C + g)) + C
    gridTemplateColumns:
      "calc((2 * (100% - (var(--C) + var(--g))) / 3) + var(--C)) calc((100% - (var(--C) + var(--g))) / 3)",
  } as React.CSSProperties;

  return (
    <div className={className}>
      <div
        className="
          grid gap-6
          md:auto-rows-auto
        "
        style={style}
      >
        {/* Left: large tile (natural 16:9 via VideoCard) */}
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
