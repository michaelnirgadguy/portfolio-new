"use client";

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
  onOpenVideo?: (id: string) => void;
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
    onOpenVideo?.(id);
  };

  if (videos.length <= 4) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onSelect={() => handleClick(video.id)} />
          ))}
        </div>
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
