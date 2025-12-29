import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollByCards = (direction: "prev" | "next") => {
    const node = scrollRef.current;
    if (!node) return;
    const offset = Math.round(node.clientWidth * 0.7);
    node.scrollBy({ left: direction === "next" ? offset : -offset, behavior: "auto" });
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
            <div
              ref={scrollRef}
              className="flex max-h-[460px] gap-4 overflow-x-auto pb-2 pl-6 pr-14 scroll-auto snap-x snap-mandatory scroll-pl-6 scroll-pr-14 [scrollbar-gutter:stable] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="min-w-[58%] max-w-[360px] shrink-0 snap-start [scroll-snap-stop:always] sm:min-w-[52%] sm:max-w-[320px]"
                >
                  <VideoCard video={video} onSelect={() => handleClick(video.id)} />
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Scroll videos left"
              onClick={() => scrollByCards("prev")}
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 text-foreground shadow-sm transition hover:bg-card"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll videos right"
              onClick={() => scrollByCards("next")}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 text-foreground shadow-sm transition hover:bg-card"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
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
