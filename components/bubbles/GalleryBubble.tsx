import VideoCard from "@/components/VideoCard";
import { renderMosaic } from "@/components/video-grid/mosaic";
import type { VideoItem } from "@/types/video";

export default function GalleryBubble({
  videoIds,
  videosById,
  onOpenVideo,
}: {
  videoIds: string[];
  videosById: Map<string, VideoItem>;
  onOpenVideo?: (video: VideoItem) => void;
}) {
  const videos = videoIds
    .map((id) => videosById.get(id))
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
    return (
      <div className="w-full rounded-xl border border-border bg-card p-4 bg-red-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

  return (
    <div className="relative flex justify-center items-center ">
      <div className="absolute left-1/2 -translate-x-1/2 h-[60vh] top-0 w-[75vw] rounded-xl border border-border bg-card p-4 bg-red-200 overflow-x-scroll overflow-y-clip flex flex-nowrap">
        {renderMosaic({
          videos,
          onSelectId: handleClick,
          className: "",
        })}
      </div>
    </div>
  );
}

// -translate-x-[25%] h-[50vh] w-[75vw]
