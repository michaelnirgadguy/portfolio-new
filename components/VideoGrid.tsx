// components/VideoGrid.tsx
// Thin wrapper that delegates layout to the mosaic helper.

import type { VideoItem } from "@/types/video";
import { renderMosaic } from "@/components/video-grid/mosaic";
import VideoCard from "@/components/VideoCard";

type Props = {
  videos: VideoItem[];
  onSelectId: (id: string) => void;
  className?: string;
};

export default function VideoGrid({ videos, onSelectId, className }: Props) {
  // Primary path: use the helper for all counts
  try {
    return renderMosaic({ videos, onSelectId, className });
  } catch {
    // Fallback: simple responsive grid, just in case
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
}
