// components/VideoGrid.tsx
import VideoCard from "@/components/VideoCard";
import type { VideoItem } from "@/types/video";

export default function VideoGrid({
  videos,
  onSelectId,
}: {
  videos: VideoItem[];
  onSelectId?: (id: string) => void;
}) {
  const needsLeftGap = videos.length >= 3 && videos.length % 2 === 1;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {videos.map((v, i) => (
        <>
          {/* Spacer goes in the bottom-left when odd (≥3) */}
          {needsLeftGap && i === videos.length - 1 && (
            <div className="hidden md:block" aria-hidden="true" />
          )}

          <div key={v.id}>
            <VideoCard video={v} onSelect={() => onSelectId?.(v.id)} />
          </div>
        </>
      ))}
    </div>
  );
}
