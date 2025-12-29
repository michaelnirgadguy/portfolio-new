import { useMemo } from "react";
import VideoCard from "@/components/VideoCard";
import { renderMosaic } from "@/components/video-grid/mosaic";
import { getAllVideos } from "@/lib/videos";
import type { VideoItem } from "@/types/video";

export default function GalleryBubble({
  videoIds,
  onOpenVideo,
}: {
  videoIds: string[];
  onOpenVideo?: (video: VideoItem) => void;
}) {
  const byId = useMemo(() => {
    const map = new Map<string, VideoItem>();
    getAllVideos().forEach((v) => map.set(v.id, v));
    return map;
  }, []);

  const videos = videoIds
    .map((id) => byId.get(id))
    .filter(Boolean) as VideoItem[];

  if (!videos.length) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No videos to show.
      </div>
    );
  }

  const handleClick = (id: string) => {
    const video = videos.find((v) => v.id === id);
    if (video) onOpenVideo?.(video);
  };

  if (videos.length <= 4) {
    if (videos.length === 4) {
      return (
        <div className="w-full rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={() => handleClick(video.id)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (videos.length >= 2) {
      return (
        <div className="w-full rounded-xl border border-border bg-card p-4">
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 pr-6 snap-x snap-mandatory scroll-pl-4 [scrollbar-gutter:stable]">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="min-w-[70%] shrink-0 snap-start sm:min-w-[45%]"
                >
                  <VideoCard video={video} onSelect={() => handleClick(video.id)} />
                </div>
              ))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full rounded-xl border border-border bg-card p-4">
        <VideoCard video={videos[0]} onSelect={() => handleClick(videos[0].id)} />
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4">
      {renderMosaic({
        videos,
        onSelectId: handleClick,
        className: "",
      })}
    </div>
  );
}
